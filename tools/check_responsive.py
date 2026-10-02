"""Проверка адаптивности: python -X utf8 tools/check_responsive.py.

Нужны Playwright и установленный Edge. Сервер запускается автоматически.
Скриншоты сохраняются в .local-check и не попадают в репозиторий.
"""
import json
import sys
import time
import io
import re
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.local-check'))
from playwright.sync_api import sync_playwright

OUT = ROOT / '.local-check' / 'responsive'
OUT.mkdir(parents=True, exist_ok=True)
PAGES = ['index.html'] + [str(p.relative_to(ROOT)).replace('\\', '/') for p in sorted((ROOT / 'slides').glob('*.html'))]

class PreviewHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send_head(self):
        # GitHub Pages поддерживает Range. Обычный сервер Python не даёт
        # Edge перематывать MP3, поэтому для аудио воспроизводим это поведение.
        path = Path(self.translate_path(self.path))
        if path.suffix != '.mp3' or not path.is_file():
            return super().send_head()
        data = path.read_bytes()
        match = re.fullmatch(r'bytes=(\d+)-(\d*)', self.headers.get('Range', ''))
        start = int(match[1]) if match else 0
        end = min(int(match[2]) if match and match[2] else len(data) - 1, len(data) - 1)
        if start > end:
            self.send_error(416)
            return None
        self.send_response(206 if match else 200)
        self.send_header('Content-Type', 'audio/mpeg')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1))
        if match:
            self.send_header('Content-Range', f'bytes {start}-{end}/{len(data)}')
        self.end_headers()
        return io.BytesIO(data[start:end + 1])


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(PreviewHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{server.server_port}/'


def visit(page, path):
    for attempt in range(3):
        try:
            page.goto(BASE + path, wait_until='load')
            return
        except Exception:
            if attempt == 2:
                raise
            time.sleep(.3)


def check(page, expression, message):
    assert page.evaluate(expression), message


with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    errors = []
    results = []
    sizes = [] if '--flows-only' in sys.argv else [(320, 568), (375, 667), (390, 844), (428, 926), (768, 1024), (900, 700), (844, 390), (1024, 768), (1440, 900)]
    for width, height in sizes:
        context = browser.new_context(viewport={'width': width, 'height': height}, is_mobile=width <= 900, has_touch=width <= 900)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.route('**/*goatcounter.com/**', lambda route: route.abort())
        for path in PAGES:
            visit(page, path)
            page.wait_for_timeout(120)
            check(page, "document.documentElement.scrollWidth <= innerWidth + 1", f'{width} {path}: ширина документа')
            check(page, "[...document.querySelectorAll('.slide, .site')].every(e => e.scrollWidth <= e.clientWidth + 1)", f'{width} {path}: переполнение содержимого')
            check(page, "[...document.querySelectorAll('main img')].every(e => e.complete && e.naturalWidth > 0)", f'{width} {path}: изображения')
            if width <= 900:
                check(page, "document.querySelector('[data-balloon]').hidden", f'{width} {path}: реплики свёрнуты')
                page.locator('.buddy__toggle').click()
                check(page, "document.querySelector('.buddy__toggle').getAttribute('aria-expanded') === 'true'", 'Открытие реплик')
                check(page, "document.querySelector('.buddy').getBoundingClientRect().bottom <= document.querySelector('.viewport').getBoundingClientRect().top + 1", 'Реплики перекрывают слайд')
                page.locator('[data-action="line-next"]').click()
                page.locator('[data-action="balloon-close"]').click()
                check(page, "document.querySelector('.personalbar [aria-current=page]').getBoundingClientRect().right <= innerWidth + 1", 'Текущая глава недоступна')
            else:
                check(page, "getComputedStyle(document.querySelector('.buddy')).position === 'fixed'", 'Рассказчик на ПК')
                if not page.locator('[data-balloon]').evaluate('(e) => e.hidden'):
                    page.locator('[data-balloon-text]').click()
                    page.locator('[data-action="balloon-close"]').click()
            if width in [320, 390, 768, 1440]:
                page.screenshot(path=str(OUT / f'{width}-{Path(path).stem}.png'), full_page=width <= 900)
            if '01-connection' in path:
                page.locator('[data-load="512000"]').click()
                page.wait_for_timeout(850)
                check(page, "document.querySelector('[data-load-text]').textContent.includes('Готово')", 'Загрузка картинки')
                page.locator('[data-pickup]').click()
                check(page, "document.querySelector('[data-pickup-result]').textContent.length > 0", 'Телефон')
                page.locator('#t-dns').click()
                check(page, "!document.querySelector('#p-dns').hidden", 'Словарь')
                page.locator('[data-play]').click()
                page.wait_for_function("document.querySelector('[data-audio]').readyState >= 2 && !document.querySelector('[data-audio]').paused")
                page.locator('[data-play]').click()
                page.locator('[data-wave]').focus()
                page.keyboard.press('ArrowRight')
                page.wait_for_timeout(150)
                check(page, "document.querySelector('[data-audio]').currentTime > 0", 'Перемотка')
                check(page, "document.querySelector('[data-balloon]').hidden", 'Перемотка открывает реплики')
                page.locator('[data-stop]').click()
                if width <= 900:
                    page.locator('.slide__scroll').evaluate('(e) => e.scrollLeft = e.scrollWidth')
                    check(page, "document.querySelector('.slide__scroll').scrollLeft > 0 || innerWidth >= 768", 'Прокрутка таблицы')
                    page.locator('[data-player]').screenshot(path=str(OUT / f'{width}-player.png'))
            if '02-design' in path:
                page.locator('[data-xray]').click()
                check(page, "document.querySelector('[data-tbldemo]').classList.contains('is-xray')", 'Рентген')
                page.locator('[data-font-list] button').nth(1).click()
                check(page, "document.querySelector('[data-font-sample]').style.fontFamily.includes('Arial')", 'Шрифты')
                page.locator('[data-tm-zoom]').click()
                check(page, "document.querySelector('[data-tm-zoom]').getAttribute('aria-pressed') === 'true'", 'Масштаб архива')
                check(page, "document.querySelector('[data-tm-frame]').getBoundingClientRect().width >= 800", 'Читаемый архив')
                page.locator('[data-tm-zoom]').click()
                check(page, "Math.abs(document.querySelector('[data-tm-frame]').getBoundingClientRect().width - document.querySelector('[data-tm-screen]').clientWidth) < 2", 'Архив обрезан')
                for _ in range(10):
                    page.locator('[data-tm-next]').click()
                    page.locator('[data-tm-loading]').wait_for(state='hidden')
                page.locator('[data-tm]').screenshot(path=str(OUT / f'{width}-time-machine.png'))
                page.locator('[data-crt]').click()
                page.wait_for_timeout(900)
                check(page, "document.body.classList.contains('is-crt')", 'Включение CRT')
                page.screenshot(path=str(OUT / f'{width}-crt.png'))
                page.locator('.crt-exit').click()
                page.wait_for_timeout(900)
                check(page, "!document.body.classList.contains('is-crt')", 'Выключение CRT')
                check(page, "document.querySelector('[data-crt]').getBoundingClientRect().top >= 0 && document.querySelector('[data-crt]').getBoundingClientRect().bottom <= innerHeight", 'Возврат к секции CRT')
            results.append(f'{width}x{height}: {path}')
        context.close()
        print(f'OK: {width}x{height}, {len(PAGES)} страниц', flush=True)

    # Переключение между мобильной раскладкой и презентацией без перезагрузки.
    page = browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    page.on('pageerror', lambda error: errors.append(str(error)))
    visit(page, PAGES[1])
    page.locator('.buddy__toggle').click()
    page.set_viewport_size({'width': 1440, 'height': 900})
    page.wait_for_timeout(100)
    check(page, "document.querySelector('.buddy').parentElement === document.body", 'Выход из мобильной раскладки')
    page.set_viewport_size({'width': 390, 'height': 844})
    page.wait_for_timeout(100)
    check(page, "!document.querySelector('[data-balloon]').hidden", 'Состояние мобильных реплик')
    page.locator('.buddy').screenshot(path=str(OUT / '390-narrator.png'))
    page.locator('[data-action="balloon-close"]').click()
    page.locator('.slide__pager [data-nav="next"]').click()
    page.wait_for_url('**/02-design.html')
    check(page, "document.querySelector('[data-balloon]').hidden", 'Состояние между главами')
    page.locator('.slide__pager [data-nav="home"]').click()
    page.wait_for_url('**/index.html')
    page.locator('.hero__actions [data-open="about"]').click()
    check(page, "document.querySelector('#about').open", 'Диалог')
    page.locator('#about button[value="ok"]').click()
    page.emulate_media(reduced_motion='no-preference')
    page.reload()
    page.locator('.hero__actions [data-dialup]').click()
    page.locator('[data-action="dialup-skip"]').click()
    page.wait_for_url('**/01-connection.html')
    page.locator('.dialscene').screenshot(path=str(OUT / '390-dialscene.png'))
    page.locator('.slide__pager').screenshot(path=str(OUT / '390-pager.png'))
    head = page.locator('[data-part="head"]')
    page.wait_for_timeout(100)
    pose = head.get_attribute('style')
    page.wait_for_timeout(150)
    assert head.get_attribute('style') == pose, 'Анимация продолжается вне экрана'
    assert not errors, '\n'.join(errors)
    print(json.dumps({'pages_checked': len(results), 'javascript_errors': errors, 'screenshots': str(OUT)}, ensure_ascii=False))
    browser.close()
    server.shutdown()

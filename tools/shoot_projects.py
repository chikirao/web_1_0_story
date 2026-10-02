"""Скриншоты моих проектов для баннеров на слайде 06 «Послесловие».

Открывает живые сайты и снимает их. Результат: assets/projects/<имя>.webp.
Нужны только Glitchy (потом tools/make_banner_art.py вырезает из него слово)
и титульный экран Webivore (у него пропускается интро). Баннеры Symbolize и Sleeper
рисуются на самой странице: им скриншоты не нужны.

    python -X utf8 tools/shoot_projects.py

Нужны Playwright и Edge (как для tools/check_responsive.py).
"""
import io
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".local-check"))
from playwright.sync_api import sync_playwright  # noqa: E402
from PIL import Image  # noqa: E402

OUT = ROOT / "assets" / "projects"
OUT.mkdir(parents=True, exist_ok=True)


# имя: (адрес, размер окна, пауза, действие после загрузки)
SITES = {
    "glitchylab": ("https://glitchylab.com/", (1000, 750), 3000, None),
    "webivore": ("https://webivore.chikirao.ru/", (1280, 800), 2000, lambda p: (p.keyboard.press("Escape"), p.wait_for_timeout(2500))),
}

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge")
    for name, (url, (w, h), wait, act) in SITES.items():
        page = browser.new_page(viewport={"width": w, "height": h})
        page.goto(url, wait_until="load", timeout=60000)
        page.wait_for_timeout(wait)
        if act:
            try:
                act(page)
            except Exception as e:  # не страшно: снимем как есть
                print(name, "действие не сработало:", str(e).splitlines()[0])
        png = page.screenshot()
        img = Image.open(io.BytesIO(png)).convert("RGB")
        img.thumbnail((900, 700))
        img.save(OUT / f"{name}.webp", quality=82, method=6)
        print(name, (OUT / f"{name}.webp").stat().st_size // 1024, "КБ")
        page.close()
    browser.close()

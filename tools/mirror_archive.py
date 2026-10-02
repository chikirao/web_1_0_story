"""Скачивает старые сайты для «машины времени» (слайд 02) из Интернет-архива в assets/archive/.

Зачем: web.archive.org отвечает по 5-30 секунд, на выступлении это слишком долго.
Здесь каждая страница сохраняется вместе с картинками и стилями, скрипты вырезаются,
текст перекодируется в UTF-8. Ссылки внутри страниц ведут в настоящий архив.

    python tools/mirror_archive.py            # скачать недостающие
    python tools/mirror_archive.py --force    # перекачать всё (готовые картинки не качаются заново)
    python tools/mirror_archive.py --fix      # докачать то, что архив не отдал (missing.txt)

Список сайтов совпадает с SITES в assets/js/design.js (name = папка).
SEARCH: страницы для слайда 03 (главные поисковиков и настоящие страницы выдачи).
"""
import hashlib
import html
import re
import sys
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "archive"
ARCHIVE = "https://web.archive.org"

SITES = [
    ("spacejam", "20031127032218", "http://www2.warnerbros.com/spacejam/movie/jam.htm"),
    ("yahoo", "19980210175524", "http://www.yahoo.com/"),
    ("apple", "19981212034415", "http://www99.apple.com/"),
    ("google", "19990117032727", "http://www.google.com/"),
    ("geocities", "19991128084647", "http://geocities.yahoo.com/home/"),
    ("amazon", "20000229082444", "http://www.amazon.com/exec/obidos/subst/home/home.html"),
    ("rambler", "20000519235750", "http://rambler.ru/"),
    ("aport", "20001219162400", "http://www.aport.ru/"),
    ("mail", "20000304084227", "http://koi.mail.ru/cgi-bin/splash"),
    ("narod", "20001019035001", "http://narod.yandex.ru/"),
]

# слайд 03 «Поиск»: главные страницы поисковиков (для скриншотов) и сохранённая выдача
SEARCH = [
    ("s-yahoo", "19961017235908", "http://www2.yahoo.com:80/"),
    ("s-lycos", "19961022175214", "http://www.lycos.com:80/"),
    ("s-altavista", "19961022174555", "http://altavista.digital.com:80/"),
    ("s-ask", "19971211202422", "http://www.askjeeves.com:80/"),
    ("s-rambler", "19971210074218", "http://www.rambler.ru:80/"),
    ("s-aport", "19981206142350", "http://www.aport.ru:80/"),
    ("s-yandex", "19981206201051", "http://yandex.ru:80/"),
    ("s-google", "19981111183552", "http://google.stanford.edu:80/"),
    ("q-sms", "20010420102501", "http://www.yandex.ru:80/yandsearch?text=%EA%E0%EA+%EE%F2%EF%F0%E0%E2%E8%F2%FC+SMS++%F1%EE%E1%F9%E5%ED%E8%E5"),
    ("q-nokia", "20010420105041", "http://www.yandex.ru:80/yandsearch?text=%7bnokia+3310%7d"),
    ("q-google", "20010430142219", "http://www.yandex.ru:80/yandsearch?text=google&stype="),
    ("q-winamp", "20000425002256", "http://www.altavista.com:80/cgi-bin/query?pg=q&KL=en&enc=iso88591&sc=on&hl=on&q=+winamp"),
    ("q-y2k", "20000424120930", "http://www.altavista.com:80/cgi-bin/query?pg=g&user=MSND&q=y2k"),
]

UA = {"User-Agent": "Mozilla/5.0 (web10 slide mirror; personal study project)"}


# архив обрывает соединения, если спрашивать часто: не чаще одного запроса в PAUSE секунд
PAUSE = 1.5
_gate = threading.Lock()
_last = [0.0]


def fetch(url, tries=6):
    for n in range(tries):
        with _gate:
            wait = _last[0] + PAUSE - time.time()
            if wait > 0:
                time.sleep(wait)
            _last[0] = time.time()
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
                return r.read(), r.headers.get_content_charset(), r.headers.get_content_type()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                print("  ! нет в архиве:", url)
                return None, None, None
            err = e
        except Exception as e:  # noqa: BLE001
            err = e
        if n == tries - 1:
            print("  ! не скачалось:", url, err)
            return None, None, None
        time.sleep(5 + n * 10)


# счётчики, баннерные крутилки и видео: не качаем, вместо них пустая картинка
JUNK = re.compile(r"spylog|html\.ng|cookies\.xhtm|logs/show|bsshow|cnt\?|\.mov$|\.ra?m$", re.I)
BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"


def absolute(ref, base):
    ref = html.unescape(ref.strip())
    if ref.startswith("//"):
        return "https:" + ref
    # urljoin склеивает «http://» внутри пути архива в «http:/», возвращаем второй слеш
    return re.sub(r"(/web/\d+[a-z_]*/https?:)/(?!/)", r"\1//", urljoin(base, ref))


def as_raw(url):
    """Ссылку на ресурс в архиве переводим в режим im_ (файл как есть)."""
    return re.sub(r"(/web/\d+)[a-z_]*/", r"\1im_/", url, count=1)


EXT = {"image/gif": ".gif", "image/jpeg": ".jpg", "image/png": ".png", "text/css": ".css",
       "image/x-icon": ".ico", "image/vnd.microsoft.icon": ".ico", "image/bmp": ".bmp"}


def mirror(name, ts, url, force):
    folder = OUT / name
    page = folder / "index.html"
    if page.exists() and not force:
        print(name, "уже есть")
        return
    folder.mkdir(parents=True, exist_ok=True)
    base = f"{ARCHIVE}/web/{ts}if_/{url}"
    raw, charset, _ = fetch(base)
    if raw is None:
        return
    # архив не всегда передаёт кодировку: ищем её в самой странице, а русский текст без пометки считаем cp1251
    if not charset:
        m = re.search(rb"<meta[^>]+charset\s*=\s*[\"']?([\w-]+)", raw[:8000], re.I)
        charset = m.group(1).decode() if m else None
    if not charset and sum(b >= 0xC0 for b in raw) > 50:
        charset = "cp1251"
    text = raw.decode(charset or "cp1252", errors="replace")

    # вырезаем вставки архива и все скрипты
    text = re.sub(r"(?is)<head>.*?<!-- End Wayback Rewrite JS Include -->", "<head>", text, count=1)
    text = re.sub(r"(?is)<script\b.*?</script>", "", text)
    text = re.sub(r"(?is)<noscript\b.*?</noscript>", "", text)
    text = re.sub(r"(?is)<!--\s*FILE ARCHIVED ON.*$", "", text)
    text = re.sub(r"(?is)<meta[^>]+charset[^>]*>", "", text)
    text = re.sub(r"(?i)\son(load|unload|mouseover|mouseout|click|submit|focus|blur)\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", "", text)

    resources = {}

    def local(ref):
        full = as_raw(absolute(ref, base))
        if not full.startswith(ARCHIVE):
            return None
        if JUNK.search(full):
            return "BLANK"
        if full not in resources:
            resources[full] = "r" + hashlib.md5(full.encode()).hexdigest()[:10]
        return resources[full]

    attr = re.compile(r"""(?i)(\s(?:src|background|lowsrc)\s*=\s*)(["']?)([^"'\s>]+)\2""")

    def put_attr(m):
        key = local(m.group(3))
        return f'{m.group(1)}"@@{key}@@"' if key else m.group(0)

    text = attr.sub(put_attr, text)

    def put_css(m):
        key = local(m.group(1).strip("'\""))
        return f"url(@@{key}@@)" if key else m.group(0)

    text = re.sub(r"url\(([^)]+)\)", put_css, text)

    link = re.compile(r"""(?i)(<link[^>]+href\s*=\s*)(["']?)([^"'\s>]+)\2""")
    text = link.sub(lambda m: f'{m.group(1)}"@@{local(m.group(3))}@@"' if local(m.group(3)) else m.group(0), text)

    # обычные ссылки: в настоящий архив, в новой вкладке
    href = re.compile(r"""(?i)(<a\b[^>]*?\shref\s*=\s*)(["']?)([^"'\s>]+)\2""")

    def put_href(m):
        ref = m.group(3)
        if ref.startswith(("#", "javascript:", "mailto:")):
            return m.group(0)
        full = absolute(ref, base).replace("if_/", "/", 1)
        return f'{m.group(1)}"{html.escape(full)}" target="_blank"'

    text = href.sub(put_href, text)
    text = re.sub(r"(?i)<base\b[^>]*>", "", text)

    # что не скачалось, пока ведёт в архив; список в missing.txt, докачка: --fix
    missing = []

    def grab(item):
        full, key = item
        have = [p for p in folder.glob(key + ".*")]
        if have:
            return key, have[0].name
        data, _, ctype = fetch(full)
        if data is None:
            missing.append(f"{key}\t{full}")
            return key, html.escape(full)
        ext = EXT.get(ctype, Path(full.split("?")[0]).suffix[:5] or ".bin")
        (folder / (key + ext)).write_bytes(data)
        return key, key + ext

    with ThreadPoolExecutor(2) as pool:
        names = dict(pool.map(grab, resources.items()))
    text = text.replace("@@BLANK@@", BLANK)
    for key, fname in names.items():
        text = text.replace(f"@@{key}@@", fname)
    (folder / "missing.txt").write_text("\n".join(missing), encoding="utf-8")

    head = '<meta charset="utf-8"><meta name="robots" content="noindex">\n'
    text = re.sub(r"(?i)<head[^>]*>", lambda m: m.group(0) + head, text, count=1) if re.search(r"(?i)<head", text) else head + text
    page.write_bytes(text.encode("utf-8"))
    size = sum(f.stat().st_size for f in folder.iterdir()) // 1024
    print(f"{name}: {len(names)} файлов, {size} КБ, не скачалось {len(missing)}", flush=True)


def fix(name):
    """Докачать то, что в прошлый раз не скачалось."""
    folder = OUT / name
    lst = folder / "missing.txt"
    page = folder / "index.html"
    if not lst.exists() or not page.exists():
        return
    text = page.read_text(encoding="utf-8")
    left = []
    for line in filter(None, lst.read_text(encoding="utf-8").splitlines()):
        key, full = line.split("\t", 1)
        data, _, ctype = fetch(full)
        if data is None:
            left.append(line)
            continue
        fname = key + EXT.get(ctype, Path(full.split("?")[0]).suffix[:5] or ".bin")
        (folder / fname).write_bytes(data)
        text = text.replace(html.escape(full), fname)
    # чего нет и после повтора, того нет и в архиве: пустая картинка, чтобы страница не ждала архив
    for line in left:
        text = text.replace(html.escape(line.split("\t", 1)[1]), BLANK)
    page.write_text(text, encoding="utf-8")
    lst.write_text("\n".join(left), encoding="utf-8")
    print(f"{name}: докачано, осталось {len(left)}", flush=True)


if __name__ == "__main__":
    force = "--force" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, ts, url in SITES + SEARCH:
        if url is None:
            continue
        if only and name not in only:
            continue
        if "--fix" in sys.argv:
            fix(name)
        else:
            mirror(name, ts, url, force)

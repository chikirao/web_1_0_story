"""Скриншоты главных страниц поисковиков для слайда 03 (окно «Поисковые системы»).

Берёт копии из assets/archive/s-*/ (их качает tools/mirror_archive.py) и снимает
окно 800×600, как на мониторе тех лет. Результат: assets/search/<имя>.webp.

    python -X utf8 tools/shoot_archive.py

Нужны Playwright и Edge (как для tools/check_responsive.py).
"""
import io
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".local-check"))
from playwright.sync_api import sync_playwright  # noqa: E402
from PIL import Image  # noqa: E402

SRC = ROOT / "assets" / "archive"
OUT = ROOT / "assets" / "search"
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge")
    page = browser.new_page(viewport={"width": 800, "height": 600})
    for folder in sorted(SRC.glob("s-*")):
        page.goto((folder / "index.html").as_uri(), wait_until="load")
        page.wait_for_timeout(300)
        png = page.screenshot()
        name = folder.name[2:]
        Image.open(io.BytesIO(png)).convert("RGB").save(OUT / f"{name}.webp", quality=82, method=6)
        print(name, (OUT / f"{name}.webp").stat().st_size // 1024, "КБ")
    browser.close()

"""Картинки для баннеров слайда 06 «Послесловие» (чёрно-белые, как сами проекты).

Из assets/projects/glitchylab.webp (после tools/shoot_projects.py) вырезает слово Glitchy,
из логотипа собирает пару «картинка / она же символами» для Symbolize,
из гифки-трофея Webivore делает лёгкую вращающуюся картинку.

    python -X utf8 tools/make_banner_art.py [путь к webivore-trophy.gif]

Нужны Pillow (лежит в .local-check) и шрифт Consolas.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".local-check"))
from PIL import Image, ImageDraw, ImageFont, ImageSequence  # noqa: E402

OUT = ROOT / "assets" / "projects"
TROPHY = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("D:/dev/katamari_web/artifacts/overdrive-trophy.gif")


def glitchy_word():
    """Только огромное слово, без интерфейса, в пропорциях баннера 3,2 : 1."""
    img = Image.open(OUT / "glitchylab-full.webp") if (OUT / "glitchylab-full.webp").exists() else Image.open(OUT / "glitchylab.webp")
    w, h = img.size
    ch = round(w / 3.2)
    top = 82
    img.crop((0, top, w, top + ch)).save(OUT / "glitchylab-word.webp", quality=85, method=6)
    print("glitchylab-word", (OUT / "glitchylab-word.webp").stat().st_size // 1024, "КБ")


def symbols():
    """bunny-src.webp: исходник, bunny-symbols.webp: он же, собранный из символов."""
    src = Image.open(ROOT / "assets" / "ui" / "logo-bunny-source.png").convert("L").crop((100, 100, 540, 540))
    size, cells = 288, 32
    src.resize((size, size), Image.LANCZOS).save(OUT / "bunny-src.webp", quality=90, method=6)

    small = src.resize((cells, cells), Image.BOX)
    font = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", 12)
    ramp = " .:+x#@"
    cell = size // cells
    out = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(out)
    for y in range(cells):
        for x in range(cells):
            v = small.getpixel((x, y)) / 255
            ch = ramp[min(len(ramp) - 1, int(v * len(ramp) * 1.05))]
            if ch != " ":
                d.text((x * cell + cell / 2, y * cell + cell / 2), ch, fill=255, font=font, anchor="mm")
    out.save(OUT / "bunny-symbols.webp", quality=90, method=6)
    print("bunny-symbols", (OUT / "bunny-symbols.webp").stat().st_size // 1024, "КБ")


def ball():
    """Вращающийся трофей Webivore: 48 кадров 512×512 уменьшаем до 256×256."""
    im = Image.open(TROPHY)
    frames = [f.convert("RGB").resize((256, 256), Image.LANCZOS) for f in ImageSequence.Iterator(im)]
    frames[0].save(OUT / "webivore-ball.webp", save_all=True, append_images=frames[1:],
                   duration=im.info.get("duration", 80), loop=0, quality=70, method=6)
    print("webivore-ball", (OUT / "webivore-ball.webp").stat().st_size // 1024, "КБ")


if __name__ == "__main__":
    glitchy_word()
    symbols()
    ball()

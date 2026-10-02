"""
Сборка 2.5D-зайца для сайта из ассетов игры WEBIVORE (D:/dev/katamari_web).

Повторяет алгоритм src/rabbit.ts (Rabbit.compose): тело ставится ногами на
линию-якорь, голова - на один радиус головы выше шеи (с учётом высоты камеры),
плюс ручная калибровка из src/rabbit-user-settings.json и исправленные головы
для ракурса 135°.

Результат (папка assets/bunny/):
  bunny-body.webp  - 8 × 3 кадров тела   (колонки = поворот, ряды = высота камеры)
  bunny-head.webp  - 8 × 3 кадров головы (тот же размер кадра и тот же якорь)
  bunny-rig.json / .js  - размеры кадра, якорь ног, точка шеи, масштаб для рук

Запуск:  python tools/build_bunny.py [путь_к_katamari_web]
Нужен Pillow (pip install pillow).
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image

GAME = Path(sys.argv[1] if len(sys.argv) > 1 else "D:/dev/katamari_web")
OUT = Path(__file__).resolve().parent.parent / "assets" / "bunny"

# --- константы из rabbit.ts ---
CELL, STRIDE, INSET = 250, 256, 3
SHEET_SCALE = 0.8
SHEET_W, SHEET_H = 512, 640
ANCHOR_Y = SHEET_H - 12
HEAD_SIZE, BODY_SIZE = 52, 32
ROWS = [math.radians(d) for d in (0, 40, 75)]
K = HEAD_SIZE / BODY_SIZE * SHEET_SCALE
OUT_SCALE = 0.75         # кадры сайта = 75% композита игры (запас под Retina)
PAD = 6                  # запас вокруг общего прямоугольника
# В игре камера смотрит сверху, и голова откалибрована почти вплотную к ступням.
# Для сайта (вид спереди) поднимаем голову, чтобы было видно тело и лапки.
# OVERLAP - насколько низ головы заходит за горловину тела (px композита игры).
OVERLAP = 18


def cell(img, col, row, h=CELL):
    return img.crop((col * STRIDE + INSET, row * STRIDE + INSET,
                     col * STRIDE + INSET + CELL, row * STRIDE + INSET + h))


def extent(alpha, w, y):
    a = b = -1
    for x in range(w):
        if alpha[y * w + x] > 110:
            if a < 0:
                a = x
            b = x
    return None if a < 0 else (a, b)


def rows_of(alpha, w, h):
    top = bottom = -1
    for y in range(h):
        e = extent(alpha, w, y)
        if e and e[1] - e[0] >= 3:
            if top < 0:
                top = y
            bottom = y
    return top, bottom


def measure_body(img, elevation):
    w, h = img.size
    alpha = img.getchannel("A").tobytes()
    top, bottom = rows_of(alpha, w, h)
    rim = extent(alpha, w, min(bottom, top + 5))
    width = rim[1] - rim[0]
    return {"neck": ((rim[0] + rim[1]) / 2, top + width * math.sin(elevation) / 2), "feet": bottom, "top": top}


def measure_head(img, lower_start=0.4):
    w, h = img.size
    alpha = img.getchannel("A").tobytes()
    top, bottom = rows_of(alpha, w, h)
    best, at, centre = -1, top, w / 2
    for y in range(round(top + (bottom - top) * lower_start), bottom + 1):
        e = extent(alpha, w, y)
        if e and e[1] - e[0] > best:
            best, at, centre = e[1] - e[0], y, (e[0] + e[1]) / 2
    return {"centre": (centre, at), "radius": best / 2}


def paste_scaled(canvas, src, x, y, scale):
    w, h = round(src.width * scale), round(src.height * scale)
    part = src.resize((w, h), Image.LANCZOS)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(part, (round(x), round(y)))
    canvas.alpha_composite(layer)


def main():
    a = GAME / "public" / "assets"
    body_atlas = Image.open(a / "rabbit-body.png").convert("RGBA")
    head_atlas = Image.open(a / "rabbit-head.png").convert("RGBA")
    repairs = []
    for name in ("low", "mid", "high"):
        im = Image.open(a / f"rabbit-head-135-{name}.png").convert("RGBA")
        repairs.append((im, measure_head(im, 0.65)))
    views = json.loads((GAME / "src" / "rabbit-user-settings.json").read_text("utf-8"))["views"]

    body_m, head_m = {}, {}
    for r in range(3):
        for c in range(8):
            body_m[(c, r)] = measure_body(cell(body_atlas, c, r), ROWS[r])
            head_m[(c, r)] = measure_head(cell(head_atlas, c, r))

    frames = []
    for row in range(3):
        for column in range(8):
            t = views[row * 8 + column]
            b = body_m[(t["bodyColumn"], t["bodyRow"])]
            h = head_m[(t["headColumn"], t["headRow"])]
            body_layer = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))
            head_layer = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))

            # тело: ноги на линии-якоре, ось шеи по центру кадра
            bx = SHEET_W / 2 - b["neck"][0] * SHEET_SCALE
            by = ANCHOR_Y - (b["feet"] + 1) * SHEET_SCALE
            neck = (SHEET_W / 2, by + b["neck"][1] * SHEET_SCALE)
            # голова: радиус головы над шеей, укороченный высотой камеры
            lift = max(0, h["radius"] * K * math.cos(ROWS[row]) - 2)
            g = -t["ground"]
            hx, hy = t["head"]["x"], -t["head"]["y"]

            paste_scaled(body_layer, cell(body_atlas, t["bodyColumn"], t["bodyRow"]),
                         bx + t["body"]["x"], by - t["body"]["y"] + g, SHEET_SCALE)

            if t["headColumn"] == 5:  # исправленные головы 135°
                im, m = repairs[t["headRow"]]
                s = h["radius"] / m["radius"] * K
                paste_scaled(head_layer, im,
                             neck[0] + hx - m["centre"][0] * s,
                             neck[1] - lift + hy - m["centre"][1] * s + g, s)
            else:
                hh = 264 if t["headRow"] == 0 else CELL  # нижний контур первой строки
                src = cell(head_atlas, t["headColumn"], t["headRow"], hh)
                paste_scaled(head_layer, src,
                             neck[0] - h["centre"][0] * K + hx,
                             neck[1] - h["centre"][1] * K + hy + g, K)

            # «шея» для сайта: низ головы садится на верх тела с перекрытием OVERLAP
            hb, bb = head_layer.getbbox(), body_layer.getbbox()
            hole = 2 * (b["neck"][1] - b["top"]) * SHEET_SCALE  # глубина горловины тела в этом ракурсе
            raise_px = round(max(0, hb[3] - (bb[1] + hole + OVERLAP)))
            if raise_px:
                lifted = Image.new("RGBA", head_layer.size, (0, 0, 0, 0))
                lifted.paste(head_layer, (0, -raise_px))
                head_layer = lifted
            hb = head_layer.getbbox()
            r = h["radius"] * K
            frames.append({
                "column": column, "row": row, "body": body_layer, "head": head_layer,
                # точка качания головы - низ головы, над шеей
                "pivot": ((hb[0] + hb[2]) / 2, hb[3] - r * 0.25),
                "headCentre": ((hb[0] + hb[2]) / 2, hb[3] - r),
                "headRadius": r,
            })

    # общий прямоугольник по всем кадрам: якорь ног - в одной точке каждого кадра
    box = [SHEET_W, SHEET_H, 0, 0]
    for f in frames:
        for layer in (f["body"], f["head"]):
            bb = layer.getbbox()
            if bb:
                box = [min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3])]
    half = max(SHEET_W / 2 - box[0], box[2] - SHEET_W / 2) + PAD
    left, right = SHEET_W / 2 - half, SHEET_W / 2 + half
    top, bottom = box[1] - PAD, ANCHOR_Y + PAD
    fw, fh = round((right - left) * OUT_SCALE), round((bottom - top) * OUT_SCALE)

    def conv(p):
        return [round((p[0] - left) * OUT_SCALE, 1), round((p[1] - top) * OUT_SCALE, 1)]

    sheets = {k: Image.new("RGBA", (fw * 8, fh * 3), (0, 0, 0, 0)) for k in ("body", "head")}
    rig_frames = []
    for f in frames:
        for k in ("body", "head"):
            crop = f[k].crop((round(left), round(top), round(right), round(bottom))).resize((fw, fh), Image.LANCZOS)
            sheets[k].paste(crop, (f["column"] * fw, f["row"] * fh))
        rig_frames.append({"pivot": conv(f["pivot"]), "headCentre": conv(f["headCentre"]),
                           "headRadius": round(f["headRadius"] * OUT_SCALE, 1)})

    sheets["body"].save(OUT / "bunny-body.webp", quality=90, method=6)
    sheets["head"].save(OUT / "bunny-head.webp", quality=90, method=6)
    unit = BODY_SIZE / (CELL * SHEET_SCALE)  # единиц игры на 1 px композита
    rig = {
        "frame": [fw, fh],
        "columns": 8,
        "rows": 3,
        "anchor": [round((SHEET_W / 2 - left) * OUT_SCALE, 1), round((ANCHOR_Y - top) * OUT_SCALE, 1)],
        "pxPerUnit": round(OUT_SCALE / unit, 4),
        "elevations": [0, 40, 75],
        "hand": {"radius": 4.8, "rest": [16, 20, 8]},
        "frames": rig_frames,
    }
    data = json.dumps(rig, ensure_ascii=False, indent=1)
    (OUT / "bunny-rig.json").write_text(data, "utf-8")
    # тот же JSON как скрипт: работает и при открытии index.html двойным щелчком (file://)
    header = "/* Сгенерировано tools/build_bunny.py - не править руками */"
    (OUT / "bunny-rig.js").write_text(f"{header}\nwindow.BUNNY_RIG = {data};\n", "utf-8")
    print("frame", fw, fh, "anchor", rig["anchor"], "pxPerUnit", rig["pxPerUnit"])


if __name__ == "__main__":
    main()

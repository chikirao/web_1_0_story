"""
Генератор страниц глав (slides/*.html) из index.html.

Берёт «хром» браузера, строку состояния, окна и Чикиряо с главной страницы,
убирает меню (в режиме презентации оно не нужно), меняет пути на ../
и вставляет слайд-заготовку главы. Запускать один раз; дальше каждую
главу можно править руками как обычный HTML.

Текст выступления и план интерактива по главам: docs/SPEECH.md.

Запуск:  python tools/make_slides.py            (существующие файлы не трогает)
         python tools/make_slides.py --force    (перезаписать заготовки; слайды с пометкой handmade не трогает)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CHAPTERS = [
    {
        "file": "01-connection.html", "num": "01", "title": "Подключение",
        "gif": ("modem.gif", 100, 76),
        "about": "модемы, телефонная линия, 56 кбит/с и тот самый звук дозвона",
        "lines": [
            "Первая остановка: подключение! Раньше интернет «включали»: модем звонил по телефонной линии и пищал.",
            "Слайд пока строится. Скоро тут будет звук дозвона и рассказ, почему картинки грузились построчно.",
        ],
    },
    {
        "file": "02-design.html", "num": "02", "title": "Дизайн",
        "gif": ("paint-bucket.gif", 87, 100),
        "about": "простые HTML-страницы, вёрстка таблицами, фоны-обои, блёстки и очень странный дизайн",
        "lines": [
            "Остановка «Дизайн». Сайты верстали таблицами, а украшали гифками, блёстками и бегущими строками.",
            "Тут скоро будет галерея самых странных страниц того времени.",
        ],
    },
    {
        "file": "03-search.html", "num": "03", "title": "Поиск",
        "gif": ("search-magnifier.gif", 110, 95),
        "about": "каталоги сайтов, рейтинги-«топы», вебринги и первые поисковики",
        "lines": [
            "Остановка «Поиск». До больших поисковиков сайты искали по каталогам, рейтингам и ссылкам друг друга.",
            "Скоро здесь появятся каталоги, «топ-100» и первые поисковые системы.",
        ],
    },
    {
        "file": "04-problems.html", "num": "04", "title": "Проблемы и ограничения",
        "gif": ("hourglass.gif", 120, 90),
        "about": "медленная загрузка, «лучше смотреть в IE», кодировки и битые ссылки",
        "lines": [
            "Остановка «Проблемы». Ранний веб был медленным и капризным: кодировки, несовместимые браузеры, битые ссылки.",
            "Здесь будет честный список того, чего тогда не хватало.",
        ],
    },
    {
        "file": "05-indieweb.html", "num": "05", "title": "IndieWeb сегодня",
        "gif": ("house.gif", 64, 64),
        "about": "Neocities, личные сайты, вебринги и кнопки 88×31 сегодня",
        "lines": [
            "Последняя остановка: IndieWeb. Личные сайты, вебринги и кнопки 88×31 живы и сегодня!",
            "Скоро тут будет рассказ про Neocities и современных «жителей» старого веба. Спасибо, что прошли экскурсию со мной!",
        ],
    },
]


def main():
    force = "--force" in sys.argv
    src = (ROOT / "index.html").read_text("utf-8")

    head = src[: src.index("<body")]
    chrome = src[src.index("<!-- ===== SVG-спрайт"): src.index("    <!-- ===== Содержимое «вкладки»")]
    status = src[src.index("    <!-- Строка состояния"): src.index("<!-- ===== Окно «О проекте»")]
    buddy = src[src.index('<div class="buddy" data-buddy>'):]
    about = src[src.index("<!-- ===== Окно «О проекте»"): src.index("<!-- ===== Окно «Удалённое соединение»")]

    # в режиме презентации меню и инфо-полоска не нужны
    chrome = re.sub(r"\n\s*<!-- Меню:.*?</nav>\n", "\n", chrome, flags=re.S)
    chrome = re.sub(r"\n<!-- Инфо-полоска.*?</p>\n", "\n", chrome, flags=re.S)

    for i, ch in enumerate(CHAPTERS, start=1):
        out = ROOT / "slides" / ch["file"]
        if out.exists() and (not force or "handmade" in out.read_text("utf-8")):
            print("пропуск (уже есть):", out.name)
            continue
        gif, gw, gh = ch["gif"]
        lines = "\n".join(f"  <li>{t}</li>" for t in ch["lines"])
        content = f'''    <!-- ===== Слайд главы: правьте содержимое <main class="slide"> ===== -->
    <div class="viewport" id="content" tabindex="-1">
      <main class="slide" aria-labelledby="slide-title">
        <header class="slide__head">
          <p class="slide__kicker"><span class="slide__num">{ch["num"]}</span> Остановка {i} из {len(CHAPTERS)}</p>
          <h1 class="slide__title" id="slide-title">{ch["title"]}</h1>
          <img class="slide__rule" src="../assets/gifs/rainbow-line.gif" alt="" width="139" height="5">
        </header>

        <div class="slide__body">
          <div class="slide__text">
            <p class="slide__lead">Здесь будет рассказ про {ch["about"]}.</p>
            <img class="construction__bar" src="../assets/gifs/construction-bar.gif" alt="Under construction" width="200" height="30">
            <div class="construction">
              <img src="../assets/gifs/construction-area.gif" alt="" width="78" height="53">
              <p>Слайд строится. Текст выступления и интерактив для него собираем в <code>docs/SPEECH.md</code>.</p>
            </div>
          </div>
          <figure class="slide__figure" aria-hidden="true">
            <img src="../assets/gifs/{gif}" alt="" width="{gw}" height="{gh}">
          </figure>
        </div>

        <nav class="slide__pager" aria-label="Переход между главами">
          <a class="btn" data-nav="prev" href="../index.html">‹ Назад</a>
          <a class="btn btn--default" data-nav="next" href="../index.html">Дальше ›</a>
          <a class="linklike" data-nav="home" href="../index.html">На главную</a>
        </nav>
      </main>
    </div>

'''
        page_head = head.replace('href="./', 'href="../')
        page_chrome = chrome.replace('href="./', 'href="../').replace('src="./', 'src="../')
        # подсветить текущую главу в личной панели
        page_chrome = page_chrome.replace(' aria-current="page"', "")
        page_chrome = page_chrome.replace(f'href="../slides/{ch["file"]}"><svg', f'href="../slides/{ch["file"]}" aria-current="page"><svg')
        page_chrome = page_chrome.replace("../slides/", "./")
        page_status = status.replace('src="./', 'src="../')
        page_buddy = buddy.replace('src="./', 'src="../')
        page_about = about.replace('src="./', 'src="../')

        html = (
            page_head
            + f'<body class="page-chapter" data-root="../" data-chapter="{i}">\n\n'
            + page_chrome + content + page_status
            + "<!-- ===== Окно «О проекте» ===== -->" + page_about.split("-->", 1)[1]
            + f'''<!-- Реплики Чикиряо для этой главы: правьте здесь -->
<ol class="narration" data-narration hidden>
{lines}
</ol>

''' + page_buddy
        )
        html = re.sub(r"<title>.*?</title>", f'<title>{ch["num"]}. {ch["title"]} | Web 1.0</title>', html)
        html = html.replace("http://chikirao.narod.ru/web10/index.html", f'http://chikirao.narod.ru/web10/slides/{ch["file"]}')
        out.write_text(html, "utf-8")
        print("создано:", out.name)


if __name__ == "__main__":
    main()

# Ассеты и источники

Всё, что не нарисовано для проекта, это настоящая графика старого веба. Файлы скачаны и лежат локально. Снаружи грузится только счётчик GoatCounter.

## Чикиряо и логотип: `assets/bunny/`, `assets/ui/`
| Файл | Откуда |
|---|---|
| `bunny-body.webp`, `bunny-head.webp`, `bunny-rig.*` | собраны `tools/build_bunny.py` из игры WEBIVORE (`D:/dev/katamari_web/public/assets/rabbit-body.png`, `rabbit-head.png`, `rabbit-head-135-*.png`, калибровка `src/rabbit-user-settings.json`) |
| `bunny-webpage.png` | `overdrive-entry-rabbit.png` из той же игры (поза с комком веб-страницы, для будущих глав) |
| `ui/logo-bunny.webp`, `logo-bunny-source.png`, `favicon.png`, `apple-touch-icon.png` | логотип автора (исходник 640×640 и уменьшенные копии) |
| `badges/web10-button.gif` | своя кнопка 88×31 сайта (логотип автора + Planet Opti) |

## Кнопки 88×31: `assets/badges/`
Архив **cyber.dabamos.de/88x31** (~4500 настоящих кнопок): `best1024`, `firefox2`, `netscape_now`, `anybrowser`, `got_html`, `notepad`, `valid-html401`, `neocities`, `yesterweb`, `webmentions`, `nocookie`, `internetarchive`, `rambler`, `construction`.

## Гифки: `assets/gifs/`
**GifCities** (gifcities.org, архив GeoCities от Internet Archive): телефоны (`phone-desk`, `phone-ringing`), здания АТС и провайдера (`exchange-building`, `isp-building`), модемы, компьютер, лупа, «Under construction», песочные часы, глобус, домик, «NEW», конверт, почтовый ящик, разделители, блёстки, «Caution: Web Paint».

## Звук: `assets/audio/`
| Файл | Откуда |
|---|---|
| `dialup.mp3` | [Dial up modem noises.ogg](https://commons.wikimedia.org/wiki/File:Dial_up_modem_noises.ogg), William Termini, общественное достояние (перекодировано в MP3) |
| `wave-dim.png`, `wave-lit.png` | аудиограмма этой записи, сгенерирована из звука |
| (разметка фаз) | по спектрограмме [Dial up modem noises explained](https://commons.wikimedia.org/wiki/File:Dial_up_modem_noises_explained_final.png), Oona Räisänen, CC BY-SA 3.0; сама картинка на сайт не выкладывается, указана как источник |

## Фото: `assets/photos/`
| Файл | Откуда |
|---|---|
| `minion.jpg`, `minion-lowres.png` | картинка от автора для демо загрузки на 56k (слайд 01) |
| `internet-cafe.jpg` | фото компьютерного клуба, 5.11.2004 (дата на снимке), прислал автор; фон режима «монитор 2004 года» (слайд 02) |
| `rabbit.jpg` | фото белого кролика, прислал автор; аватарка в «соцсети» и фото в огненной рамке (слайд 05, сравнение публикаций) |

## CRT-монитор (слайд 02): `assets/js/crt.js`
Эффект пузатого монитора из заставки игры WEBIVORE (`D:/dev/katamari_web/src/crt/CrtScreen.ts`, настройки `screen` из `settings.ts`): та же формула изгиба стекла, строки луча, апертурная решётка, утопленное в пластик стекло, отражение лампы. Изгиб страницы сделан SVG-фильтром (две карты смещений), стекло шейдером поверх окна.

## Старые сайты (слайд 02)
Скачаны из [Wayback Machine](https://web.archive.org/) Интернет-архива скриптом `tools/mirror_archive.py` в `assets/archive/<имя>/` (страница + картинки, без скриптов, текст в UTF-8). Архив отвечает медленно, поэтому на слайде показываются локальные копии. Ссылки внутри страниц ведут в настоящий архив. Список снимков: в скрипте и в начале `assets/js/design.js`.

Для слайда 03 там же лежат главные страницы поисковиков 1996–1998 годов (`s-*`) и настоящие страницы выдачи Яндекса 2001 и AltaVista 2000 (`q-*`). Со страниц `s-*` скрипт `tools/shoot_archive.py` снимает скриншоты 800×600 в `assets/search/*.webp`.

## Хеллоу Китти: `assets/gifs/kitty-*.gif`
[picgifs.com](https://www.picgifs.com/graphics/hello-kitty/) (раздел Hello kitty graphics): 4 гифки для огненного сайта на слайде 05. Hello Kitty принадлежит Sanrio, гифки взяты как старые фан-графики для учебной презентации.

## Блинкиз: `assets/blinkies/`
**glitter-graphics.com** (раздел Blinkies): `loading`, `im-online`, `computer-addict`, `browser-history`, `webmistress`, `welcome-pixel`, `updated`, `no-internet-housework`.

## Каоани: `assets/kaoani/`
**gocanucks.free.fr** (галереи kaoani): мини-жители панелей сайдбара (без зайцев: заяц на сайте один, Чикиряо).

## Шрифты: `assets/fonts/`
**planet.dk/fonts** (1999): Planet Megapolis (логотип), Planet Estyle, Planet Opti. CD-Ware, бесплатно для некоммерческого использования, см. `PLANET-FONTS-README.txt`. Только латиница, поэтому кириллица набрана веб-безопасными Verdana / Tahoma / Times New Roman.

## Что можно заменить
- Любую гифку: положить файл с тем же именем в ту же папку.
- Кнопки 88×31 в подвале: список `<div class="badges">` в `index.html`.
- Логотип в правом верхнем углу браузера: `assets/ui/logo-bunny.webp` (путь в `.throbber img` в HTML).

## Реклама (слайд 04): `assets/ads/`
Картинки для всплывающих окон из **GifCities** (gifcities.org, архив GeoCities). Тексты рекламы выдуманы. `phone.gif` это копия `gifs/phone-ringing.gif`.

| Файл | Исходный адрес |
|---|---|
| `congrats.gif` | `http://www.geocities.com/wayneedwards2000/congratulations_red_white_blue_glitter.gif` |
| `warning.gif` | `http://www.geocities.com/carolyn6813/ImageFile/TypingComputer.gif` |
| `money.gif` | `http://www.geocities.com/erictbrassellsr/freemoney.gif` |
| `builder.gif` | `http://geocities.com/ResearchTriangle/Facility/8180/images/ani-constructionguy.gif` |
| `winner.gif` | `http://www.geocities.com/blessfriends04/smile.gif` |
| `search.gif` | `http://geocities.com/rockm59/computer_girl_md_wht.gif` |
| `hot.gif` | `http://geocities.com/winlink_travel/HotDeals.gif` |
| `banner.gif` | `http://www.geocities.com:80/ilovegirlsfeet/images/AllClicks1.gif` |

## IndieWeb (слайд 05): `assets/indieweb/`, `assets/badges/wall/`
- `cecil-1998.png`: снимок [Cecil’s Street Fighter page](https://geocities.restorativland.org/Tokyo/1265/) из сохранённого GeoCities. В [каталоге Tokyo](https://geocities.restorativland.org/Tokyo/) указано последнее изменение 17 сентября 1998. Сам скриншот снят 3 октября 2026.
- `piggie.png`: снимок [piggie.party](https://piggie.party/), личного сайта GNOCCHI, снят 3 октября 2026. Права на графику и страницу у автора. В сравнении и кольце есть ссылка на оригинал.
- Пример «Одна публикация, два места»: условная лента и авторская страница Чикиряо с одинаковым текстом. Используются уже перечисленные гифки, кнопки и логотип сайта.
- Скриншоты сайтов (`doghouse`, `cameron`, `melonking`, `melonland`, `ribo`, `petrapixel`, а также `cafe32`, `wiby`, `marginalia`, `neocities` про запас) сняты с живых сайтов в октябре 2026, 1024×720. Права на страницы у их авторов, на слайде они как превью со ссылкой.
- `video.jpg`: превью видео MrAlexBat «А ты знаешь... Что есть ДРУГОЙ ИНТЕРНЕТ?» (YouTube), карточка ведёт на видео.
- `badges/wall/`: 25 кнопок 88×31 из архива **cyber.dabamos.de/88x31** для стены кнопок.
- Гостевая книга: Atabook, https://chikirao.atabook.org/ (встроена iframe).

## Послесловие (слайд 06): `assets/projects/`
- `glitchylab.webp`, `webivore.webp`: скриншоты живых сайтов glitchylab.com и webivore.chikirao.ru (титульный экран), снимает `tools/shoot_projects.py`.
- `glitchylab-word.webp`: из первого скриншота вырезано слово «Glitchy» (`tools/make_banner_art.py`).
- `bunny-src.webp`, `bunny-symbols.webp`: логотип Чикиряо и он же, собранный из символов (для баннера Symbolize), рисует `tools/make_banner_art.py`.
- `webivore-ball.webp`: вращающийся бумажный шар из финала игры Webivore, 48 кадров, уменьшен до 256×256 из гифки-трофея (`tools/make_banner_art.py`, исходник лежит в проекте игры).
- Баннеры Symbolize, Sleeper и «И другие» целиком нарисованы HTML и CSS в `slides/06-epilogue.html` и `styles.css` (раздел 12g). Время на баннере Sleeper считает `assets/js/epilogue.js`.

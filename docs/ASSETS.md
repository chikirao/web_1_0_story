# Ассеты и источники

Всё, что не нарисовано для проекта, это настоящая графика старого веба. Файлы скачаны и лежат локально, внешних запросов сайт не делает.

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

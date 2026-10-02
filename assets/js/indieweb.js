/* =====================================================================
   Слайд 05 «IndieWeb сегодня»: интерактив
     1. Кольцо Чикиряо: витрина сайтов малого веба
     2. Словарик трендов
     3. Код нашей кнопки 88×31 (стена кнопок свёрстана в HTML)
     4. Мастер домашних страниц: собрать и скачать свою страничку
   ===================================================================== */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));


  /* ---------- 1. Кольцо Чикиряо ----------
     shot: скриншот из assets/indieweb/ (снят в октябре 2026) */

  const SITES = [
    { shot: "doghouse", url: "https://dog-house.neocities.org/home", name: "Dog House", who: "Личный сайт художника Snailz",
      text: `<p>Сайт в виде уютной комнаты-конуры: меню на облачках, дневник, музыка, ссылки
        и гостевая. Настроение автора показывает старый виджет iMood.</p>
        <p>Хороший пример того, как сегодня выглядит «домашняя страничка»: это не резюме,
        а комната, куда зовут в гости.</p>` },
    { shot: "cameron", url: "https://www.cameronsworld.net/", name: "Cameron's World", who: "Камерон Аскин, коллаж из GeoCities",
      text: `<p>Огромный коллаж из гифок, надписей и кусочков тысяч домашних страниц GeoCities
        1994–2009 годов, спасённых Интернет-архивом.</p>
        <p>Листаешь вниз, и мимо проплывают космос, «Under construction», котики и признания
        в любви к Netscape. Музей всего, о чём был этот рассказ.</p>` },
    { shot: "melonking", url: "https://melonking.net/", name: "Melonking", who: "Личный сайт Мелона",
      text: `<p>Вход в мир Мелона: зелёный экран, музыка и надпись «вы покидаете информационную
        супермагистраль». Внутри десятки комнат с рисунками, играми и заметками.</p>
        <p>Мелон же придумал MelonLand: форум и клуб для тех, кто делает себе сайты.</p>` },
    { shot: "melonland", url: "https://melonland.net/", name: "MelonLand", who: "Форум и клуб создателей сайтов",
      text: `<p>Главная площадь малого веба: форум, вики, своё веб-кольцо Surf Club и события
        вроде «Weird Web October», когда весь месяц делают странные страницы.</p>
        <p>Сюда приходят показать свой сайт, спросить про код и найти соседей.</p>` },
    { shot: "ribo", url: "https://ribo.zone/", name: "ribo.zone", who: "Сайт-лаборатория",
      text: `<p>Сайт устроен как лаборатория: на столе компьютер, микроскоп и растения,
        а разделы спрятаны в ящиках стола. «Покопайся в ящиках или открой карту сайта».</p>
        <p>Внутри история науки, фото через микроскоп, рисунки, глина, ретро-игры и модели роботов.</p>` },
    { shot: "petrapixel", url: "https://petrapixel.neocities.org/", name: "petrapixel", who: "Сайт Петры на Neocities",
      text: `<p>Розовый пиксельный сайт с блинками, счётчиком и гостевой. Но главное в нём:
        уроки для новичков, как сделать свой сайт, и генератор раскладок.</p>
        <p>По таким урокам сегодня учатся HTML так же, как в 90-е учились по чужим страницам.</p>` },
  ];

  const show = $("[data-show]");
  if (show) {
    const img = $("[data-show-img]", show);
    const link = $("[data-show-link]", show);
    const open = $("[data-show-open]", show);
    const urlEl = $("[data-show-url]", show);
    const nameEl = $("[data-show-name]", show);
    const whoEl = $("[data-show-who]", show);
    const textEl = $("[data-show-text]", show);
    const count = $("[data-show-count]", show);
    let at = 0;

    function go(i) {
      at = (i + SITES.length) % SITES.length;
      const s = SITES[at];
      img.src = `../assets/indieweb/${s.shot}.webp`;
      img.alt = `Главная страница ${s.name}`;
      link.href = open.href = s.url;
      urlEl.textContent = s.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      nameEl.textContent = s.name;
      whoEl.textContent = s.who;
      textEl.innerHTML = s.text;
      count.textContent = `сайт ${at + 1} из ${SITES.length}`;
    }

    show.addEventListener("click", (ev) => {
      const g = ev.target.closest("[data-show-go]")?.dataset.showGo;
      if (!g) return;
      if (g === "random") {
        let r;
        do r = Math.floor(Math.random() * SITES.length); while (r === at);
        go(r);
      } else go(at + Number(g));
    });
    // заранее подгружаем скриншоты, чтобы листалось без задержки
    SITES.forEach((s) => { new Image().src = `../assets/indieweb/${s.shot}.webp`; });
    go(0);
  }


  /* ---------- 2. Словарик трендов ---------- */

  const TRENDS = {
    rings: {
      title: "Веб-кольца", img: "../assets/badges/wall/atari_webring.gif", w: 88, h: 31,
      text: `<p>Те самые кольца из девяностых вернулись. Внизу сайта плашка «пред. / случайный / след.»,
        и можно пройти по кругу десятки похожих страниц.</p>
        <p>Известные кольца: Hotline Webring, MelonLand Surf Club, кольцо IndieWeb.
        Кольцо Yesterweb разрослось до 815 сайтов и в 2023 году закрылось: его стали использовать
        ради поисковых позиций, а не ради соседства.</p>`,
    },
    guest: {
      title: "Гостевые книги", img: "../assets/gifs/send-email.gif", w: 45, h: 58,
      text: `<p>Почти у каждого личного сайта есть гостевая: любой может оставить запись, а автор
        прочитает и ответит. Лайков нет, только слова.</p>
        <p>Сервисы вроде Atabook дают гостевую бесплатно, как в 2000-х. Наша внизу этой страницы.</p>`,
    },
    blinkies: {
      title: "Блинки и гифки", img: "../assets/blinkies/im-online.gif", w: 150, h: 20,
      text: `<p>Блинки: мигающие полоски 150×20 с надписями вроде «I'm online» или «webmistress».
        Их собирают в коллекции и вешают десятками.</p>
        <p>Гифки берут из GifCities, поиска по гифкам старого GeoCities от Интернет-архива,
        так что на новых сайтах живут те же крутящиеся глобусы и конвертики.</p>`,
    },
    shrines: {
      title: "Шрайны", img: "../assets/kaoani/c117.gif", w: 40, h: 40,
      text: `<p>Шрайн, или «алтарь»: страничка, целиком посвящённая одной любимой вещи. Игре,
        персонажу, группе, сериалу из детства, даже одному покемону.</p>
        <p>Это наследник фан-сайтов девяностых: всё, что знаешь, картинки, ссылки и признание в любви.</p>`,
    },
    status: {
      title: "Статусы и питомцы", img: "../assets/kaoani/c5.gif", w: 50, h: 50,
      text: `<p>Маленькие живые штуки на странице: статус «что я сейчас делаю» через Status Café,
        настроение через iMood, виртуальный питомец, которого гости кормят кликом.</p>
        <p>Это заменяет ленту новостей: зашёл к другу на сайт и видишь, как у него дела.</p>`,
    },
    clubs: {
      title: "Клубы и форумы", img: "../assets/gifs/net-computers.gif", w: 59, h: 58,
      text: `<p>Общаются на старомодных форумах и в клубах: MelonLand, 32-Bit Cafe, клубы
        «маленьких» сайтов вроде 512KB Club, где страница должна весить меньше 512 килобайт.</p>
        <p>Есть общие события: месяц странных страниц, конкурсы кнопок, совместные кольца.</p>`,
    },
    search: {
      title: "Поиск по малому вебу", img: "../assets/gifs/search-magnifier.gif", w: 55, h: 48,
      text: `<p>Большие поисковики такие сайты почти не показывают, поэтому появились свои.
        <b>Wiby</b> ищет только простые страницы «в духе классического веба» и умеет
        «удиви меня». <b>Marginalia</b> ищет некоммерческие сайты с текстом, без рекламы и куки.</p>
        <p>А ещё снова живы каталоги и списки ссылок, совсем как Yahoo в 1994-м.</p>`,
    },
  };

  const trends = $("[data-trends]");
  if (trends) {
    const page = $("[data-trend-page]", trends);
    const tabs = $$("[data-trend]", trends);
    function pick(btn) {
      const t = TRENDS[btn.dataset.trend];
      tabs.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      page.innerHTML = `<img src="${t.img}" width="${t.w}" height="${t.h}" alt=""><h3>${t.title}</h3>${t.text}`;
    }
    tabs.forEach((b) => b.addEventListener("click", () => pick(b)));
    $("[data-trend-list]", trends).addEventListener("keydown", (ev) => {
      const step = { ArrowDown: 1, ArrowUp: -1 }[ev.key];
      if (!step) return;
      ev.preventDefault();
      const next = tabs[(tabs.indexOf(document.activeElement) + step + tabs.length) % tabs.length];
      next.focus();
      pick(next);
    });
    pick(tabs[0]);
  }


  /* ---------- 3. Кнопки 88×31 ---------- */

  const copyBtn = $("[data-ourbtn-copy]");
  if (copyBtn) {
    const code = $("[data-ourbtn-code]");
    copyBtn.addEventListener("click", async () => {
      code.select();
      try {
        await navigator.clipboard.writeText(code.value);
      } catch {
        document.execCommand?.("copy");
      }
      copyBtn.textContent = "Скопировано!";
      setTimeout(() => { copyBtn.textContent = "Скопировать код"; }, 1600);
    });
  }


  /* ---------- 4. Мастер домашних страниц ----------
     Собирает настоящую страничку в духе 1999 года. В предпросмотре картинки берутся
     с этого сайта, в скачанном файле по полному адресу web1.chikirao.ru. */

  // css: фон страницы (с анимацией), js: скрипт для фона (только у «Хакера»)
  const THEMES = {
    space: {
      body: "#fff", head: "#ffff00", link: "#00ffff", box: "rgba(0, 0, 40, .85)",
      css: `body { background: #000; }
  body::before { content: ""; position: fixed; inset: 0; z-index: -1;
    background: radial-gradient(#fff 1px, transparent 2px) 0 0 / 40px 40px,
                radial-gradient(#ffd 1px, transparent 2px) 20px 13px / 57px 57px,
                radial-gradient(#9cf 1.5px, transparent 2.5px) 7px 31px / 91px 91px;
    animation: twinkle 3s steps(2) infinite; }
  @keyframes twinkle { 50% { opacity: .55; } }`,
    },
    pink: {
      body: "#7a004a", head: "#ff1493", link: "#c71585", box: "rgba(255, 240, 248, .92)",
      css: `body { background:
    radial-gradient(circle, #fff 0 1.5px, transparent 2px) 0 0 / 22px 22px,
    radial-gradient(circle, #ff69b4 0 1.5px, transparent 2px) 11px 11px / 22px 22px,
    radial-gradient(circle, #fff 0 1px, transparent 1.5px) 5px 16px / 13px 13px,
    linear-gradient(45deg, #ffc0e0 25%, #ffd6ec 25% 50%, #ffc0e0 50% 75%, #ffd6ec 75%) 0 0 / 40px 40px; }
  body::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background: radial-gradient(circle, #fff 0 2px, transparent 3px) 7px 3px / 31px 37px,
                radial-gradient(circle, #ffe600 0 1.5px, transparent 2.5px) 19px 23px / 43px 29px;
    animation: glitter .6s steps(2) infinite; }
  @keyframes glitter { 50% { opacity: 0; transform: translate(3px, 2px); } }`,
    },
    matrix: {
      body: "#00ff66", head: "#00ff66", link: "#ccffcc", box: "rgba(0, 20, 0, .82)",
      css: `body { background: #000; }
  #rain { position: fixed; inset: 0; z-index: -1; width: 100%; height: 100%; }`,
      html: `<canvas id="rain"></canvas>`,
      js: `<script>
// дождь из букв, как в «Матрице»
var c = document.getElementById("rain"), x = c.getContext("2d"), cols, drops;
function size() { c.width = innerWidth; c.height = innerHeight; cols = Math.ceil(c.width / 16); drops = []; for (var i = 0; i < cols; i++) drops[i] = Math.random() * -50; }
size(); addEventListener("resize", size);
var abc = "アカサタナハマヤラワ0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽ";
setInterval(function () {
  x.fillStyle = "rgba(0, 0, 0, .08)"; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#0f6"; x.font = "16px monospace";
  for (var i = 0; i < cols; i++) {
    x.fillText(abc[Math.floor(Math.random() * abc.length)], i * 16, drops[i] * 16);
    if (drops[i] * 16 > c.height && Math.random() > .975) drops[i] = 0;
    drops[i]++;
  }
}, 50);
<\/script>`,
    },
    paper: {
      body: "#202060", head: "#c00000", link: "#0000cc", box: "rgba(255, 255, 255, .7)",
      css: `body { background: linear-gradient(90deg, transparent 50px, #ff9a9a 50px 52px, transparent 52px),
    repeating-linear-gradient(#fffbe6 0 27px, #b6d4ff 27px 28px); }`,
    },
    sky: {
      body: "#002050", head: "#1b3f8f", link: "#0000aa", box: "rgba(255, 255, 255, .78)", shadow: "2px 2px 0 #fff",
      css: `body { background: linear-gradient(#4aa8e8, #bfe6ff) fixed; }
  body::before, body::after { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background:
      radial-gradient(ellipse 60px 26px at 60px 40px, #fff 98%, transparent),
      radial-gradient(ellipse 40px 30px at 95px 28px, #fff 98%, transparent),
      radial-gradient(ellipse 45px 22px at 125px 44px, #fff 98%, transparent);
    background-size: 340px 190px;
    animation: clouds 40s linear infinite; }
  body::after { background-size: 520px 260px; background-position: 160px 90px; opacity: .8; animation-duration: 70s; }
  @keyframes clouds { to { background-position-x: 340px; } }`,
    },
  };
  const FONTS = {
    comic: '"Comic Sans MS", cursive', times: '"Times New Roman", serif', impact: "Impact, sans-serif", courier: '"Courier New", monospace',
  };

  const maker = $("[data-maker]");
  if (maker) {
    const form = $("[data-maker-form]", maker);
    const preview = $("[data-maker-preview]", maker);
    const SITE = "https://web1.chikirao.ru/";
    const LOCAL = new URL("../", location.href).href;

    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

    function build(base) {
      const f = new FormData(form);
      const t = THEMES[f.get("theme")];
      const title = esc(f.get("title") || "Моя страничка");
      const about = esc(f.get("about") || "").replace(/\n/g, "<br>");
      const on = (k) => f.get(k) === "on";
      const img = (p, w, h, alt = "") => `<img src="${base}${p}" width="${w}" height="${h}" alt="${alt}">`;
      return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { margin: 0; padding: 16px; color: ${t.body}; font: 16px Verdana, sans-serif; }
  ${t.css}
  .page { max-width: 640px; margin: 0 auto; padding: 16px; background: ${t.box}; border: 3px ridge ${t.head}; }
  h1 { margin: 0 0 8px; font: bold 34px ${FONTS[f.get("font")]}; color: ${t.head}; text-align: center; text-shadow: ${t.shadow || "none"}; }
  a { color: ${t.link}; }
  .center { text-align: center; }
  .counter { display: inline-block; padding: 2px 6px; font: bold 16px monospace; letter-spacing: 3px; color: #3f3; background: #000; }
</style>
</head>
<body>
${t.html || ""}
<div class="page">
  <h1>${on("pet") ? img("assets/kaoani/c117.gif", 40, 40) + " " : ""}${title}${on("pet") ? " " + img("assets/kaoani/c117.gif", 40, 40) : ""}</h1>
  ${on("marquee") ? `<marquee scrollamount="4">*~*~ Добро пожаловать на мою страничку! ~*~*</marquee>` : ""}
  ${on("construction") ? `<p class="center">${img("assets/gifs/construction-sign.gif", 40, 38)} Сайт строится! ${img("assets/gifs/construction-sign.gif", 40, 38)}</p>` : ""}
  <p>${about}</p>
  <p class="center"><a href="#">Обо мне</a> | <a href="#">Фотки</a> | <a href="#">Гостевая</a> | <a href="#">Ссылки</a></p>
  ${on("blinkies") ? `<p class="center">${img("assets/blinkies/im-online.gif", 150, 20)} ${img("assets/blinkies/computer-addict.gif", 150, 20)}</p>` : ""}
  ${on("counter") ? `<p class="center">Вы посетитель № <span class="counter">000${Math.floor(1000 + Math.random() * 8999)}</span></p>` : ""}
  ${on("buttons") ? `<p class="center">${img("assets/badges/web10-button.gif", 88, 31, "Web 1.0")} ${img("assets/badges/neocities.gif", 88, 31, "Neocities")} ${img("assets/badges/notepad.gif", 88, 31, "Made with Notepad")}</p>` : ""}
</div>
${t.js || ""}
</body>
</html>
`;
    }

    // перерисовываем не на каждую букву, а после короткой паузы
    let t = 0;
    const render = () => { clearTimeout(t); t = setTimeout(() => { preview.srcdoc = build(LOCAL); }, 150); };
    form.addEventListener("input", render);
    form.addEventListener("change", render);
    form.addEventListener("submit", (ev) => ev.preventDefault());
    preview.srcdoc = build(LOCAL);

    $("[data-maker-download]", maker).addEventListener("click", () => {
      const blob = new Blob([build(SITE)], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "index.html";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  }
})();

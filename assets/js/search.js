/* =====================================================================
   Слайд 03 «Поиск»: интерактив
     1. Окно «Поисковые системы»: список и справка
     2. Тогда и сейчас: настоящая выдача 2000–2001 годов из архива и та же выдача сегодня
     3. Веб-кольцо: пред / след / случайный
   ===================================================================== */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));


  /* ---------- 1. Поисковые системы ----------
     shot: скриншот главной страницы тех лет (assets/search/, снимает tools/shoot_archive.py)
     archive: копия сайта из assets/archive/ (та же, что в машине времени на слайде 02) */

  const ENGINES = {
    yahoo: {
      name: "Yahoo!", where: "США, 1994", shot: "октябрь 1996",
      text: `<p>Начинался как список ссылок двух студентов Стэнфорда, Джерри Янга и Дэвида Фило.
        Это <b>каталог</b>: сайты добавляли люди и раскладывали по рубрикам.</p>
        <p>Название шуточное: «Yet Another Hierarchical Officious Oracle», «ещё один иерархический
        назойливый оракул». К концу 90-х самый посещаемый сайт в мире.</p>`,
      archive: "yahoo", year: 1998,
    },
    lycos: {
      name: "Lycos", where: "США, 1994", shot: "октябрь 1996",
      text: `<p>Один из первых настоящих поисковиков: робот сам обходил сайты. Сделан в университете
        Карнеги-Меллон.</p>
        <p>Название от латинского имени паука-волка: он не плетёт паутину, а бегает и ловит добычу.
        На логотипе при этом была собака.</p>`,
    },
    altavista: {
      name: "AltaVista", where: "США, 1995", shot: "октябрь 1996",
      text: `<p>Его сделала компания DEC, чтобы показать, какие мощные у неё серверы. Одной из первых
        хранила <b>весь текст страниц</b>, а не только заголовки, и отвечала за секунду.</p>
        <p>Понимала операторы: <code>+слово</code>, <code>-слово</code>, кавычки, <code>NEAR</code>.
        В конце 90-х главный поисковик мира, закрыта в 2013 году.</p>`,
    },
    rambler: {
      name: "Rambler", where: "Россия, 1996", shot: "декабрь 1997",
      text: `<p>Первый большой русский поисковик. Его сделали в подмосковном Пущино, в городе учёных,
        осенью 1996 года.</p>
        <p>Главной фишкой стал рейтинг <b>Rambler Top100</b>: сайты ставили счётчик и соревновались,
        у кого больше посетителей.</p>`,
      archive: "rambler", year: 2000,
    },
    ask: {
      name: "Ask Jeeves", where: "США, 1997", shot: "декабрь 1997",
      text: `<p>Тут можно было не подбирать ключевые слова, а <b>задать вопрос</b> целиком:
        «Где купить билет в кино?».</p>
        <p>Отвечал дворецкий Дживс, персонаж из книг Вудхауса, нарисованный на логотипе.</p>`,
    },
    aport: {
      name: "Апорт", where: "Россия, 1997", shot: "декабрь 1998",
      text: `<p>Один из первых русских поисковиков, команда «Агама». На главной всё сразу: поиск,
        каталог, погода, курсы валют.</p>
        <p>В начале 2000-х был в тройке вместе с Яндексом и Рамблером, потом сдал позиции
        и стал сервисом сравнения цен.</p>`,
      archive: "aport", year: 2000,
    },
    yandex: {
      name: "Яндекс", where: "Россия, 1997", shot: "декабрь 1998",
      text: `<p>Открылся 23 сентября 1997 года. Название от «Yet Another iNDEXer», «ещё один индексатор»,
        а русская «Я» вместо английской «Y» появилась уже потом.</p>
        <p>Главное отличие: понимал <b>морфологию</b>. По запросу «блины» находил и «блинов»,
        и «блинами».</p>`,
    },
    google: {
      name: "Google", where: "США, 1998", shot: "ноябрь 1998, ещё на сервере Стэнфорда",
      text: `<p>Ларри Пейдж и Сергей Брин, аспиранты Стэнфорда. Считал не только слова, но и <b>ссылки</b>:
        чем больше сайтов ссылается на страницу, тем она важнее. Это называется PageRank.</p>
        <p>В первом индексе было около 26 миллионов страниц. Сегодня сотни миллиардов.</p>`,
      archive: "google", year: 1999,
    },
  };

  const engines = $("[data-engines]");
  if (engines) {
    const page = $("[data-engine-page]", engines);
    const tabs = $$("[data-engine]", engines);

    function pick(btn) {
      const e = ENGINES[btn.dataset.engine];
      tabs.forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
      const copy = e.archive
        ? `<p class="helpwin__see"><a class="btn btn--small" href="../assets/archive/${e.archive}/index.html"
             target="_blank" rel="noopener">Открыть копию ${e.year} года ↗</a></p>`
        : "";
      page.innerHTML = `
        <figure class="engwin__shot">
          <img src="../assets/search/${btn.dataset.engine}.webp" width="800" height="600"
               alt="Главная страница ${e.name}, ${e.shot}">
          <figcaption>${e.shot}</figcaption>
        </figure>
        <h3>${e.name}</h3><p class="engwin__where">${e.where}</p>${e.text}${copy}`;
    }

    tabs.forEach((b) => b.addEventListener("click", () => pick(b)));
    // стрелки вверх/вниз ходят по списку, как в настоящем окне
    $("[data-engine-list]", engines).addEventListener("keydown", (ev) => {
      const step = { ArrowDown: 1, ArrowUp: -1 }[ev.key];
      if (!step) return;
      ev.preventDefault();
      const i = tabs.indexOf(document.activeElement);
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      pick(next);
    });
    pick(tabs[0]);
  }


  /* ---------- 2. Тогда и сейчас ----------
     Слева настоящая страница выдачи из Интернет-архива (assets/archive/q-*),
     справа тот же запрос в духе сегодняшнего поисковика. Сегодняшняя выдача
     собрана вручную по образцу настоящей: ответ сверху, карты, вопросы, видео. */

  const site = (letter, color, name, url) =>
    `<p class="now__site"><span class="now__fav" style="background:${color}">${letter}</span>
       <span><b>${name}</b><br><small>${url}</small></span></p>`;

  const result = (fav, title, text) =>
    `<div class="now__res">${fav}<p class="now__link">${title}</p><p class="now__snip">${text}</p></div>`;

  const QUERIES = {
    sms: {
      q: "как отправить SMS собщение", engine: "Яндекс", date: "20 апреля 2001",
      ts: "20010420102501", url: "http://www.yandex.ru:80/yandsearch?text=%EA%E0%EA+%EE%F2%EF%F0%E0%E2%E8%F2%FC+SMS++%F1%EE%E1%F9%E5%ED%E8%E5",
      found: "Найдено около 12 млн результатов",
      fix: "Показаны результаты по запросу «как отправить SMS <b>сообщение</b>»",
      now: `
        <div class="now__card now__answer">
          <p class="now__h">Быстрый ответ</p>
          <ol class="now__steps">
            <li>Откройте приложение «Сообщения».</li>
            <li>Нажмите «Новое сообщение» и выберите контакт или введите номер.</li>
            <li>Напишите текст и нажмите «Отправить».</li>
          </ol>
          ${site("S", "#3478f6", "Справка по телефону", "support › сообщения › отправка")}
        </div>
        <div class="now__card">
          <p class="now__h">Видео</p>
          <div class="now__videos">
            <span><i>1:24</i>Как отправить СМС на Android</span>
            <span><i>0:58</i>Отправка сообщений на iPhone</span>
            <span><i>2:10</i>Если SMS не отправляется</span>
          </div>
        </div>
        ${result(site("M", "#e64a19", "Мобильный оператор", "operator.ru › help › sms"),
          "Не отправляются SMS: 7 причин и что делать",
          "Проверьте номер SMS-центра, баланс и режим полёта. Если сообщение всё равно не уходит…")}`,
    },
    nokia: {
      q: "{nokia 3310}", engine: "Яндекс", date: "20 апреля 2001",
      ts: "20010420105041", url: "http://www.yandex.ru:80/yandsearch?text=%7bnokia+3310%7d",
      found: "Найдено около 9 млн результатов",
      now: `
        <div class="now__card now__panel">
          <p class="now__big">Nokia 3310</p>
          <p class="now__muted">Мобильный телефон · Nokia</p>
          <dl class="now__facts">
            <dt>Выпуск</dt><dd>сентябрь 2000</dd>
            <dt>Продано</dt><dd>около 126 млн штук</dd>
            <dt>Экран</dt><dd>84×48 точек, монохромный</dd>
            <dt>Игры</dt><dd>«Змейка II», Space Impact…</dd>
          </dl>
        </div>
        <div class="now__card">
          <p class="now__h">Товары</p>
          <div class="now__shop">
            <span><b>Nokia 3310 (2017)</b><br>от 4 990 ₽</span>
            <span><b>Nokia 3310, оригинал 2000</b><br>Б/у, от 2 500 ₽</span>
            <span><b>Корпус для 3310</b><br>от 690 ₽</span>
          </div>
        </div>
        ${result(site("W", "#888", "Википедия", "ru.wikipedia.org › Nokia_3310"),
          "Nokia 3310: Википедия",
          "Сотовый телефон, выпущенный компанией Nokia в 2000 году. Один из самых продаваемых телефонов в истории, известен своей прочностью…")}`,
    },
    google: {
      q: "google", engine: "Яндекс", date: "30 апреля 2001",
      ts: "20010430142219", url: "http://www.yandex.ru:80/yandsearch?text=google&stype=",
      found: "Найдено около 25 млрд результатов",
      now: `
        ${result(site("G", "#4285f4", "Google", "google.com"),
          "Google",
          "Поиск информации в интернете: веб-страницы, картинки, видео и многое другое.")}
        <div class="now__sub">
          <span>Картинки</span><span>Переводчик</span><span>Карты</span><span>Почта</span>
        </div>
        <div class="now__card now__panel">
          <p class="now__big">Google</p>
          <p class="now__muted">Технологическая компания</p>
          <dl class="now__facts">
            <dt>Основана</dt><dd>4 сентября 1998 года</dd>
            <dt>Основатели</dt><dd>Ларри Пейдж, Сергей Брин</dd>
            <dt>Штаб-квартира</dt><dd>Маунтин-Вью, Калифорния</dd>
          </dl>
        </div>
        <div class="now__card">
          <p class="now__h">Люди также спрашивают</p>
          <p class="now__q">Что означает слово Google?</p>
          <p class="now__q">Как Google выглядел в 1998 году?</p>
        </div>`,
    },
    winamp: {
      q: "+winamp", engine: "AltaVista", date: "25 апреля 2000",
      ts: "20000425002256", url: "http://www.altavista.com:80/cgi-bin/query?pg=q&KL=en&enc=iso88591&sc=on&hl=on&q=+winamp",
      found: "Найдено около 30 млн результатов",
      now: `
        ${result(site("W", "#f7a400", "Winamp", "winamp.com"),
          "Winamp: официальный сайт",
          "Легендарный музыкальный плеер. Скачать для Windows, скины, плагины…")}
        <div class="now__sub">
          <span>Скачать</span><span>Скины</span><span>Плагины</span><span>Winamp для Android</span>
        </div>
        <div class="now__card now__panel">
          <p class="now__big">Winamp</p>
          <p class="now__muted">Медиапроигрыватель · Nullsoft, 1997</p>
          <p>Один из самых популярных MP3-плееров конца 90-х. Известен скинами и фразой
            «It really whips the llama's ass».</p>
        </div>
        <div class="now__card">
          <p class="now__h">Люди также спрашивают</p>
          <p class="now__q">Работает ли Winamp сейчас?</p>
          <p class="now__q">Как поставить классический скин Winamp?</p>
        </div>`,
    },
    y2k: {
      q: "y2k", engine: "AltaVista", date: "24 апреля 2000",
      ts: "20000424120930", url: "http://www.altavista.com:80/cgi-bin/query?pg=g&user=MSND&q=y2k",
      found: "Найдено около 90 млн результатов",
      note: "В 2000 году это «проблема 2000 года», а сегодня ещё и стиль в моде.",
      now: `
        <div class="now__card now__panel">
          <p class="now__big">Проблема 2000 года</p>
          <p class="now__muted">Y2K · компьютерная ошибка</p>
          <p>Многие программы хранили год двумя цифрами, и 2000 год для них превращался в 1900-й.
            Ждали сбоев в банках и на транспорте, на исправления по всему миру ушли сотни
            миллиардов долларов. Серьёзных аварий не случилось.</p>
        </div>
        <div class="now__card">
          <p class="now__h">Картинки</p>
          <div class="now__shop">
            <span><b>Эстетика Y2K</b><br>серебро, блёстки, стразы</span>
            <span><b>Одежда в стиле Y2K</b><br>джинсы клёш, топы</span>
            <span><b>Обои Y2K</b><br>хром и голограммы</span>
          </div>
        </div>
        ${result(site("V", "#111", "Журнал о моде", "magazine.ru › trends › y2k"),
          "Стиль Y2K: как одеваться в духе нулевых",
          "Блестящие ткани, низкая посадка и телефоны-раскладушки снова в моде. Рассказываем, откуда взялся тренд…")}`,
    },
  };

  const vs = $("[data-vs]");
  if (vs) {
    const frame = $("[data-vs-frame]", vs);
    const screen = $("[data-vs-screen]", vs);
    const oldHead = $("[data-vs-old-head]", vs);
    const openEl = $("[data-vs-open]", vs);
    const nowEl = $("[data-vs-new]", vs);
    const qBtns = $$("[data-q]", vs);

    // страница выдачи рисуется шириной 800 px и уменьшается под колонку
    const zoom = $("[data-vs-zoom]", vs);
    function fit() {
      const s = vs.classList.contains("is-readable") ? 1 : Math.min(screen.clientWidth / 800, 1);
      screen.style.setProperty("--vs-s", s.toFixed(3));
    }

    function render(id) {
      const q = QUERIES[id];
      qBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.q === id)));
      oldHead.textContent = `${q.engine}, ${q.date}`;
      screen.style.setProperty("--vs-h", 600);   // настоящую высоту узнаем после загрузки
      frame.src = `../assets/archive/q-${id}/index.html`;
      openEl.href = `https://web.archive.org/web/${q.ts}/${q.url}`;
      nowEl.innerHTML = `
        <div class="now__top">
          <p class="now__box">${q.q.replace(/[{}+]/g, "").trim()}<span aria-hidden="true">×</span></p>
          <p class="now__tabs"><b>Все</b><span>Картинки</span><span>Видео</span><span>Карты</span><span>Новости</span></p>
        </div>
        <p class="now__muted now__found">${q.found}</p>
        ${q.fix ? `<p class="now__fix">${q.fix}</p>` : ""}
        ${q.note ? `<p class="now__note">${q.note}</p>` : ""}
        ${q.now}`;
      fit();
    }

    // высоту страницы узнаём после загрузки, чтобы прокручивалась вся выдача
    frame.addEventListener("load", () => {
      const doc = frame.contentDocument;
      if (doc) screen.style.setProperty("--vs-h", doc.documentElement.scrollHeight);
      screen.scrollTop = 0;
    });
    // на узком экране страница мелкая: «Читать крупнее» показывает её в настоящем размере с прокруткой вбок
    zoom.addEventListener("click", () => {
      const on = vs.classList.toggle("is-readable");
      zoom.setAttribute("aria-pressed", String(on));
      zoom.textContent = on ? "Показать целиком" : "Читать крупнее";
      fit();
    });
    qBtns.forEach((b) => b.addEventListener("click", () => render(b.dataset.q)));
    window.addEventListener("resize", fit);
    render("sms");
  }


  /* ---------- 3. Веб-кольцо ----------
     Выдуманные фан-сайты. Каждый оформлен по-своему, как настоящие домашние страницы. */

  const RING = [
    { name: "Тамагочи-клуб Маши", owner: "masha.narod.ru", bg: "#ffe6f5", color: "#a0006e", font: '"Comic Sans MS", cursive',
      text: "Привет! У меня три тамагочи: Пушок, Бублик и Звёздочка. Тут я пишу, как за ними ухаживать." },
    { name: "СЕКРЕТЫ И КОДЫ", owner: "tamacodes.chat.ru", bg: "#000000", color: "#00ff66", font: '"Courier New", monospace',
      text: "Как вырастить ангела, что делать если питомец болеет, и секретный код на бесконечную еду (проверено!!!)." },
    { name: "Мой тамагочи умер (((", owner: "geocities.com/Tokyo/2241", bg: "#d8d8f0", color: "#202060", font: '"Times New Roman", serif',
      text: "Кладбище виртуальных питомцев. Оставь в гостевой имя своего тамагочи, и мы его помянем." },
    { name: "Тамагочи из картона", owner: "karton-tama.boom.ru", bg: "#fff6c8", color: "#7a4a00", font: "Verdana, sans-serif",
      text: "Нет денег на тамагочи? Распечатай мой, вырежи и играй! Инструкция внутри. Сайт строится." },
    { name: "Большая галерея питомцев", owner: "pets-gallery.da.ru", bg: "#e8ffe8", color: "#006000", font: "Arial, sans-serif",
      text: "Больше 200 картинок тамагочи, гига-петов и дигимонов. Качайте на рабочий стол!" },
  ];

  const ring = $("[data-ring]");
  if (ring) {
    const site = $("[data-ring-site]", ring);
    const count = $("[data-ring-count]", ring);
    let at = 0;

    function show(i) {
      at = (i + RING.length) % RING.length;
      const s = RING[at];
      site.style.background = s.bg;
      site.style.color = s.color;
      site.style.fontFamily = s.font;
      site.innerHTML = `<p class="ring__title">${s.name}</p><p>${s.text}</p><p class="ring__url">http://${s.owner}/</p>`;
      count.textContent = `сайт ${at + 1} из ${RING.length}`;
    }

    function list() {
      site.style.background = "#fff";
      site.style.color = "#000";
      site.style.fontFamily = "";
      site.innerHTML = `<p class="ring__title">Все сайты кольца</p><ol class="ring__all">${RING.map((s, i) =>
        `<li><button class="linklike" type="button" data-ring-at="${i}">${s.name}</button></li>`).join("")}</ol>`;
      count.textContent = `всего ${RING.length} сайтов`;
    }

    ring.addEventListener("click", (ev) => {
      const at2 = ev.target.closest("[data-ring-at]");
      if (at2) return show(Number(at2.dataset.ringAt));
      const go = ev.target.closest("[data-ring-go]")?.dataset.ringGo;
      if (!go) return;
      if (go === "list") return list();
      if (go === "random") {
        let r;
        do r = Math.floor(Math.random() * RING.length); while (r === at);
        return show(r);
      }
      show(at + Number(go));
    });
    show(0);
  }
})();

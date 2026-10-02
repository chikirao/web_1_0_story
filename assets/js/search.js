/* =====================================================================
   Слайд 03 «Поиск»: интерактив
     1. Окно «Поисковые системы»: список и справка
     2. Тогда и сейчас: один запрос в выдаче 1998 года и сегодня
     3. Веб-кольцо: пред / след / случайный
   ===================================================================== */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));


  /* ---------- 1. Поисковые системы ----------
     archive: копия сайта из assets/archive/ (та же, что в машине времени на слайде 02) */

  const ENGINES = {
    yahoo: {
      name: "Yahoo!", where: "США, 1994",
      text: `<p>Начинался как список ссылок двух студентов Стэнфорда, Джерри Янга и Дэвида Фило.
        Это <b>каталог</b>: сайты добавляли люди и раскладывали по рубрикам.</p>
        <p>Название шуточное: «Yet Another Hierarchical Officious Oracle», «ещё один иерархический
        назойливый оракул». К концу 90-х самый посещаемый сайт в мире.</p>`,
      archive: "yahoo", year: 1998,
    },
    lycos: {
      name: "Lycos", where: "США, 1994",
      text: `<p>Один из первых настоящих поисковиков: робот сам обходил сайты. Сделан в университете
        Карнеги-Меллон.</p>
        <p>Название от латинского имени паука-волка: он не плетёт паутину, а бегает и ловит добычу.
        На логотипе при этом была собака.</p>`,
    },
    altavista: {
      name: "AltaVista", where: "США, 1995",
      text: `<p>Его сделала компания DEC, чтобы показать, какие мощные у неё серверы. Одной из первых
        хранила <b>весь текст страниц</b>, а не только заголовки, и отвечала за секунду.</p>
        <p>Понимала операторы: <code>+слово</code>, <code>-слово</code>, кавычки, <code>NEAR</code>.
        В конце 90-х главный поисковик мира, закрыта в 2013 году.</p>`,
    },
    rambler: {
      name: "Rambler", where: "Россия, 1996",
      text: `<p>Первый большой русский поисковик. Его сделали в подмосковном Пущино, в городе учёных,
        осенью 1996 года.</p>
        <p>Главной фишкой стал рейтинг <b>Rambler Top100</b>: сайты ставили счётчик и соревновались,
        у кого больше посетителей.</p>`,
      archive: "rambler", year: 2000,
    },
    ask: {
      name: "Ask Jeeves", where: "США, 1997",
      text: `<p>Тут можно было не подбирать ключевые слова, а <b>задать вопрос</b> целиком:
        «Где купить билет в кино?».</p>
        <p>Отвечал дворецкий Дживс, персонаж из книг Вудхауса, нарисованный на логотипе.</p>`,
    },
    aport: {
      name: "Апорт", where: "Россия, 1997",
      text: `<p>Один из первых русских поисковиков, команда «Агама». На главной всё сразу: поиск,
        каталог, погода, курсы валют.</p>
        <p>В начале 2000-х был в тройке вместе с Яндексом и Рамблером, потом сдал позиции
        и стал сервисом сравнения цен.</p>`,
      archive: "aport", year: 2000,
    },
    yandex: {
      name: "Яндекс", where: "Россия, 1997",
      text: `<p>Открылся 23 сентября 1997 года. Название от «Yet Another iNDEXer», «ещё один индексатор»,
        а русская «Я» вместо английской «Y» появилась уже потом.</p>
        <p>Главное отличие: понимал <b>морфологию</b>. По запросу «блины» находил и «блинов»,
        и «блинами».</p>`,
    },
    google: {
      name: "Google", where: "США, 1998",
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
      page.innerHTML = `<h3>${e.name}</h3><p class="engwin__where">${e.where}</p>${e.text}${copy}`;
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
     Выдача заготовлена заранее. hits: сколько раз на странице встречаются слова запроса,
     по ним старый поисковик и сортировал. hidden: спрятанный белый текст. */

  const QUERIES = {
    weather: {
      found: "12 840",
      old: [
        { title: "ПОГОДА!!! ПОГОДА МОСКВА ПОГОДА БЕСПЛАТНО", url: "members.tripod.com/~megaportal/", hits: 214,
          text: "Самый лучший портал рунета!!! Знакомства, анекдоты, рефераты, картинки…",
          hidden: "погода погода москва погода бесплатно погода прогноз погода москва погода реферат погода погода москва" },
        { title: "Погода в Москве на 12 марта", url: "www.moscow-info.ru/weather.htm", hits: 9,
          text: "Ночью −8, днём −3, небольшой снег. Страница обновлена 3 месяца назад." },
        { title: "Москва: путеводитель. Климат", url: "www.guide.ru/moscow/climate.html", hits: 6,
          text: "Климат Москвы умеренно континентальный. Средняя температура января −10…" },
        { title: "Гидрометцентр России", url: "www.meteo.ru/", hits: 3,
          text: "Прогноз погоды по городам России. Выберите регион на карте." },
        { title: "Форум: какая погода в москве?? ответьте плиз", url: "www.chat.ru/forum/1532.html", hits: 2,
          text: "Еду в субботу, не знаю что одеть. Кто из москвы, напишите!!!" },
      ],
      now: `<div class="now__weather">
              <p class="now__big">+4°</p>
              <p><b>Москва, сейчас</b><br>облачно, ветер 3 м/с</p>
            </div>
            <p class="now__days"><span>Пт +6°</span><span>Сб +2°</span><span>Вс +5°</span><span>Пн +7°</span></p>
            <p class="now__note">Ответ сразу наверху, по вашему местоположению. Открывать сайт не нужно.</p>`,
    },
    pancakes: {
      found: "3 517",
      old: [
        { title: "РЕЦЕПТЫ рецепт блинов БЛИНЫ рецепты бесплатно", url: "www.geocities.com/Heartland/9931/", hits: 168,
          text: "Добро пожаловать!!! Тут будет много рецептов. Раздел строится.",
          hidden: "рецепт блинов рецепт блины рецепт рецепты блинов блинов блины рецепт блинов рецепт" },
        { title: "Кулинарная страничка Тани", url: "tanya-kitchen.narod.ru/", hits: 11,
          text: "Мои любимые рецепты: салаты, пироги, блины. Пишите в гостевую книгу!" },
        { title: "Блины. История блюда", url: "www.kuhnya.ru/history/bliny.html", hits: 7,
          text: "Блины на Руси пекли ещё в языческие времена, на Масленицу…" },
        { title: "Ресторан «Блинная» на Арбате", url: "www.arbat-bliny.ru/", hits: 5,
          text: "Блины с икрой, с мёдом, со сметаной. Ждём вас с 10 до 22." },
        { title: "Рецепты блинов", url: "www.recepty.ru/bliny.htm", hits: 4,
          text: "Ошибка 404. Страница не найдена." },
      ],
      now: `<p class="now__title"><b>Блины на молоке</b> · 30 минут</p>
            <ul class="now__list"><li>молоко, 500 мл</li><li>яйца, 2 шт</li><li>мука, 250 г</li><li>сахар, соль, масло</li></ul>
            <p class="now__note">Сразу рецепт, время, фото, отзывы и десяток вариантов на выбор.</p>`,
    },
    winamp: {
      found: "1 284",
      old: [
        { title: "WINAMP СКАЧАТЬ WINAMP БЕСПЛАТНО MP3 WINAMP КРЯК", url: "free-mp3-zone.chat.ru/", hits: 302,
          text: "Всё бесплатно!!! Музыка, программы, кряки, серийники. Самая большая коллекция!",
          hidden: "winamp скачать winamp скачать бесплатно winamp mp3 скачать winamp winamp winamp скачать" },
        { title: "Каталог программ: Winamp 1.91 (1,1 Мб)", url: "www.freeware.ru/audio/winamp.html", hits: 12,
          text: "Проигрыватель MP3. Скачать: зеркало 1, зеркало 2 (медленное)." },
        { title: "Скачать winamp", url: "www.soft.narod.ru/winamp.htm", hits: 8,
          text: "Файл перенесён. Новый адрес скоро будет!" },
        { title: "Nullsoft Winamp", url: "www.winamp.com/", hits: 4,
          text: "Winamp: the definitive audio player for Windows." },
        { title: "Скины для Winamp: 500 штук!", url: "skins.boom.ru/", hits: 3,
          text: "Самые прикольные скины. Качайте, не забудьте проголосовать в Top100!" },
      ],
      now: `<p class="now__title"><b>Winamp</b> · официальный сайт</p>
            <p>winamp.com · Скачать для Windows</p>
            <p class="now__note">Первая строка: официальный сайт. Сайты-ловушки с «кряками» поисковик убирает вниз или прячет.</p>`,
    },
  };

  const vs = $("[data-vs]");
  if (vs) {
    const oldEl = $("[data-vs-old]", vs);
    const newEl = $("[data-vs-new]", vs);
    const how = $("[data-vs-how]", vs);
    const qBtns = $$("[data-q]", vs);

    function render(id) {
      const q = QUERIES[id];
      qBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.q === id)));
      oldEl.innerHTML =
        `<p class="serp__found">Найдено документов: <b>${q.found}</b>. Показаны 1–5.</p>` +
        q.old.map((r, i) => `
          <div class="serp__item">
            <p class="serp__title">${i + 1}. <a href="#vs-title">${r.title}</a>
              <span class="serp__hits">совпадений: ${r.hits}</span></p>
            <p class="serp__text">${r.text}</p>
            ${r.hidden ? `<p class="serp__hidden">${r.hidden}</p>` : ""}
            <p class="serp__url">${r.url}</p>
          </div>`).join("");
      newEl.innerHTML = q.now;
    }

    qBtns.forEach((b) => b.addEventListener("click", () => render(b.dataset.q)));
    how.addEventListener("click", () => {
      const on = !vs.classList.contains("is-how");
      vs.classList.toggle("is-how", on);
      how.setAttribute("aria-pressed", String(on));
      how.textContent = on ? "Спрятать подсказки" : "Как считал поисковик";
    });
    render("weather");
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

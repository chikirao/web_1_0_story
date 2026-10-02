/* =====================================================================
   Слайд 02 «Дизайн»: интерактив
     1. Машина времени: старые сайты из Интернет-архива в iframe
     2. Форма «открыть сайт в архиве»
     3. Рентген таблиц
     4. Окно «Шрифт»
     5. Монитор 2004 года: окно сжимается до 800×600
   ===================================================================== */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));


  /* ---------- 1. Машина времени ----------
     Страницы заранее скачаны из Интернет-архива в assets/archive/<id>/
     (tools/mirror_archive.py), поэтому открываются мгновенно.
     ts: дата снимка в архиве, year: год самой страницы. */

  const SITES = [
    { id: "spacejam", year: 1996, ts: "20031127032218", url: "http://www2.warnerbros.com/spacejam/movie/jam.htm", show: "spacejam.com",
      note: "Сайт мультфильма «Космический джем». Звёздный фон, кнопки-планеты. Провисел без изменений почти 25 лет." },
    { id: "yahoo", year: 1998, ts: "19980210175524", url: "http://www.yahoo.com/", show: "www.yahoo.com",
      note: "Yahoo! начинался как каталог: люди вручную раскладывали сайты по рубрикам." },
    { id: "apple", year: 1998, ts: "19981212034415", url: "http://www99.apple.com/", show: "www.apple.com",
      note: "Только что вышел iMac. Страница собрана из таблиц и нарезанных картинок." },
    { id: "google", year: 1999, ts: "19990117032727", url: "http://www.google.com/", show: "www.google.com",
      note: "Google ещё «бета»: строка поиска и две кнопки. Рядом с порталами выглядел почти пустым." },
    { id: "geocities", year: 1999, ts: "19991128084647", url: "http://geocities.yahoo.com/home/", show: "www.geocities.com",
      note: "Бесплатный хостинг домашних страниц. Сайты жили в «районах» по темам: Area51, Hollywood, Heartland." },
    { id: "amazon", year: 2000, ts: "20000229082444", url: "http://www.amazon.com/exec/obidos/subst/home/home.html", show: "www.amazon.com",
      note: "Книжный магазин, который уже продаёт всё подряд. Вкладки сверху тоже картинки." },
    { id: "rambler", year: 2000, ts: "20000519235750", url: "http://rambler.ru/", show: "www.rambler.ru",
      note: "Поисковик и рейтинг Top100: сайты соревновались, у кого больше посетителей." },
    { id: "aport", year: 2000, ts: "20001219162400", url: "http://www.aport.ru/", show: "www.aport.ru",
      note: "Один из первых русских поисковиков. Всё на одной странице: рубрики, погода, курсы валют." },
    { id: "mail", year: 2000, ts: "20000304084227", url: "http://koi.mail.ru/cgi-bin/splash", show: "www.mail.ru",
      note: "Бесплатная почта. Вверху выбор кодировки: koi, win, mac. Выбрал не ту, и вместо букв кракозябры." },
    { id: "narod", year: 2000, ts: "20001019035001", url: "http://narod.yandex.ru/", show: "narod.ru",
      note: "Бесплатные сайты от Яндекса: «Постройте свой сайт за 60 секунд». Тут жила половина домашних страниц рунета." },
  ];

  const tm = $("[data-tm]");
  if (tm) {
    const frame = $("[data-tm-frame]", tm);
    const screen = $("[data-tm-screen]", tm);
    const loading = $("[data-tm-loading]", tm);
    const yearEl = $("[data-tm-year]", tm);
    const urlEl = $("[data-tm-url]", tm);
    const countEl = $("[data-tm-count]", tm);
    const noteEl = $("[data-tm-note]", tm);
    const openEl = $("[data-tm-open]", tm);
    const PAGE_W = 800;     // старые сайты верстали под 800 px
    const PAGE_H = 560;
    let index = 0;

    const local = (s) => `../assets/archive/${s.id}/index.html`;

    // страница рисуется в окне 800 px и масштабируется под ширину слайда,
    // но не выше, чем помещается на экране
    function fit() {
      const w = screen.clientWidth;
      const room = window.innerHeight * 0.62;
      const s = Math.min(w / PAGE_W, room / PAGE_H, 1.6);
      screen.style.setProperty("--tm-s", s.toFixed(3));
    }

    function show(i) {
      index = (i + SITES.length) % SITES.length;
      const s = SITES[index];
      yearEl.textContent = s.year;
      urlEl.textContent = s.show;
      countEl.textContent = `${index + 1} / ${SITES.length}`;
      noteEl.textContent = s.note;
      openEl.href = `https://web.archive.org/web/${s.ts}/${s.url}`;
      loading.hidden = false;
      frame.src = local(s);
    }

    const zoom = $("[data-tm-zoom]", tm);
    zoom.addEventListener("click", () => {
      const readable = tm.classList.toggle("is-readable");
      zoom.setAttribute("aria-pressed", String(readable));
      zoom.textContent = readable ? "Показать целиком" : "Читать крупнее";
      screen.scrollTo(0, 0);
      fit();
    });
    frame.addEventListener("load", () => { if (frame.src) loading.hidden = true; });
    $("[data-tm-prev]", tm).addEventListener("click", () => show(index - 1));
    $("[data-tm-next]", tm).addEventListener("click", () => show(index + 1));
    new ResizeObserver(fit).observe(screen);
    window.addEventListener("resize", fit);
    fit();

    show(0);
  }


  /* ---------- 2. Открыть свой сайт в архиве ---------- */

  const form = $("[data-archive-form]");
  if (form) {
    const select = $("[data-archive-year]", form);
    for (let y = 1996; y <= 2012; y++) select.add(new Option(y, y, false, y === 2002));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = form.elements.url.value.trim().replace(/^https?:\/\//, "");
      if (!url) return;
      window.open(`https://web.archive.org/web/${select.value}0601000000/http://${url}`, "_blank", "noopener");
    });
  }


  /* ---------- 3. Рентген таблиц ---------- */

  const xray = $("[data-xray]");
  const demo = $("[data-tbldemo]");
  if (xray && demo) {
    xray.addEventListener("click", () => {
      const on = demo.classList.toggle("is-xray");
      xray.setAttribute("aria-pressed", String(on));
      xray.textContent = on ? "Спрятать таблицы" : "Показать таблицы";
    });
    // ссылки внутри демо-странички никуда не ведут
    $$("a", demo).forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
  }


  /* ---------- 4. Окно «Шрифт» ---------- */

  const list = $("[data-font-list]");
  if (list) {
    const sample = $("[data-font-sample]");
    const note = $("[data-font-note]");
    const buttons = $$("[data-font]", list);
    function pick(btn, focus) {
      buttons.forEach((b) => {
        const on = b === btn;
        b.setAttribute("aria-checked", String(on));
        b.tabIndex = on ? 0 : -1;
      });
      sample.style.fontFamily = btn.dataset.font;
      note.textContent = btn.dataset.note;
      if (focus) btn.focus();
    }
    buttons.forEach((b, i) => {
      b.tabIndex = i === 0 ? 0 : -1;
      // в списке каждое название написано своим шрифтом
      b.style.fontFamily = b.dataset.font;
      b.addEventListener("click", () => pick(b));
      b.addEventListener("keydown", (e) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        e.stopPropagation();    // стрелки не листают реплики Чикиряо
        pick(buttons[(i + step + buttons.length) % buttons.length], true);
      });
    });
    // у «красивого шрифта» название в списке тоже упадёт в Times: так и задумано
  }


  /* ---------- 5. Монитор 2004 года ----------
     Окно браузера сжимается до 800×600 на фоне фото компьютерного клуба,
     содержимое уменьшается целиком (CSS), а вместе со сжатием плавно
     появляется пузатое стекло CRT (crt.js). «Вернуть размер» или Esc: обратно. */

  const crtBtn = $("[data-crt]");
  if (crtBtn) {
    const body = document.body;
    const viewport = $(".viewport");
    const desktop = $(".desktop");
    const section = crtBtn.closest("section");
    const crtLabel = $("span", crtBtn);
    const exit = document.createElement("button");
    exit.type = "button";
    exit.className = "btn btn--default crt-exit";
    exit.textContent = "Вернуть размер";
    body.append(exit);

    function keep() {
      // после пересчёта вёрстки держим эту секцию в поле зрения
      setTimeout(() => {
        const scroller = window.matchMedia("(max-width: 900px)").matches && !body.classList.contains("is-crt")
          ? window : viewport;
        const top = scroller === window
          ? window.scrollY + section.getBoundingClientRect().top - 12
          : viewport.scrollTop + (section.getBoundingClientRect().top - viewport.getBoundingClientRect().top)
            / (body.classList.contains("is-crt") ? parseFloat(getComputedStyle(desktop).getPropertyValue("--k")) : 1) - 12;
        scroller.scrollTo({ top });
      }, 650);
    }
    function on() {
      body.classList.add("is-crt");
      crtLabel.textContent = "Выключить монитор 2004 года";
      window.CRT?.attach(desktop);
      keep();
      exit.focus({ preventScroll: true });
    }
    function off() {
      if (!body.classList.contains("is-crt")) return;
      body.classList.remove("is-crt");
      crtLabel.textContent = "Включить монитор 2004 года";
      window.CRT?.detach();
      keep();
      crtBtn.focus({ preventScroll: true });
    }
    crtBtn.addEventListener("click", () => (body.classList.contains("is-crt") ? off() : on()));
    exit.addEventListener("click", off);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") off(); });
  }
})();

/* =====================================================================
   Web 1.0: каким был интернет?
   Общий скрипт для всех страниц. Без библиотек, без сборки.

   Каждая страница сообщает о себе через <body>:
     data-root="./"     - путь до корня сайта (в slides/ это "../")
     data-chapter="0"   - номер главы из CHAPTERS (0 = главная)

   Разделы файла:
     1. Настройки и главы
     2. Навигация, адресная строка
     3. Строка состояния и «загрузка»
     4. Счётчик посещений
     5. Рассказчик: реплики (облачко)
     6. Рассказчик Чикиряо: заяц из частей (2.5D, перетаскивание, взмах, головокружение)
     7. Диалоги и «дозвон»
     8. Мелочи: тулбар, вебринг, «ссылка на нас»
   ===================================================================== */

(() => {
  "use strict";

  /* ---------- 1. Настройки и главы ---------- */

  const SITE = {
    // «Адрес» в фальшивой адресной строке - чистая атмосфера
    fakeHost: "http://chikirao.narod.ru/web10/",
    // Настоящий адрес на GitHub Pages: для кода кнопки «Ссылка на нас»
    publicUrl: "https://chikirao.github.io/web_1_0_story/",
    // Звук дозвона: положите файл и впишите путь, например "assets/audio/dialup.mp3".
    // null = без звука (сайт ничего не проигрывает сам по себе).
    dialupSound: null,
    // Настоящий счётчик посетителей через GoatCounter (бесплатно, без cookie).
    // Один посетитель = один IP + браузер. Как включить: см. README, раздел «Счётчик».
    // Впишите код сайта, например "web10" для web10.goatcounter.com. null = локальный счётчик.
    goatcounter: "chikirao",
    // Прибавка к числу на счётчике (для вида «старого сайта»; 0 = честные цифры)
    counterStart: 0,
    // Кнопка настроек ⚙ справа сверху (для разработки). Перед защитой можно
    // поставить false, а включить временно, открыв страницу с ?dev.
    devTools: false,
  };

  // Главы презентации. file - путь от корня сайта.
  const CHAPTERS = [
    { id: "home",       num: "00", title: "Главная",                file: "index.html" },
    { id: "connection", num: "01", title: "Подключение",            file: "slides/01-connection.html" },
    { id: "design",     num: "02", title: "Дизайн",                 file: "slides/02-design.html" },
    { id: "search",     num: "03", title: "Поиск",                  file: "slides/03-search.html" },
    { id: "problems",   num: "04", title: "Проблемы и ограничения", file: "slides/04-problems.html" },
    { id: "indieweb",   num: "05", title: "IndieWeb сегодня",       file: "slides/05-indieweb.html" },
  ];

  const body = document.body;
  const root = body.dataset.root || "./";
  const chapterIndex = Number(body.dataset.chapter || 0);
  const prevChapter = CHAPTERS[chapterIndex - 1];
  const nextChapter = CHAPTERS[chapterIndex + 1];
  const compactLayout = window.matchMedia("(max-width: 900px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  // Безопасная работа с хранилищем (в приватном режиме может падать)
  const safe = (storage) => ({
    get(key) { try { return storage.getItem(key); } catch { return null; } },
    set(key, value) { try { storage.setItem(key, value); } catch { /* ничего */ } },
    remove(key) { try { storage.removeItem(key); } catch { /* ничего */ } },
  });
  const local = safe(window.localStorage);
  const session = safe(window.sessionStorage);


  /* ---------- 2. Навигация, адресная строка ---------- */

  function setupNavigation() {
    const current = CHAPTERS[chapterIndex] || CHAPTERS[0];
    const address = $("#address");
    if (address) address.value = SITE.fakeHost + current.file;

    document.title = chapterIndex === 0
      ? "Web 1.0: каким был интернет?"
      : `${current.num}. ${current.title} | Web 1.0`;

    const wire = (selector, target) => {
      $$(selector).forEach((el) => {
        if (target) {
          el.href = root + target.file;
          el.removeAttribute("aria-disabled");
          el.title = target.title;
        } else {
          el.setAttribute("aria-disabled", "true");
          el.tabIndex = -1;
        }
      });
    };
    wire('[data-nav="prev"]', prevChapter);
    wire('[data-nav="next"]', nextChapter);
    $$('[data-nav="home"]').forEach((el) => { el.href = root + "index.html"; });
    $$(".tbtn").forEach((el) => {
      const label = $("span", el)?.textContent;
      if (label) el.setAttribute("aria-label", label);
    });
    const bar = $(".personalbar");
    const active = $("[aria-current=page]", bar);
    if (active) bar.scrollLeft += active.getBoundingClientRect().left - bar.getBoundingClientRect().left
      - (bar.clientWidth - active.getBoundingClientRect().width) / 2;
  }

  // Переход на другую главу. atEnd: открыть её на последней реплике (шаг «назад»).
  function goToChapter(chapter, { atEnd = false, dial = false } = {}) {
    if (!chapter) return;
    if (atEnd) session.set("web10:startAtEnd", chapter.id);
    const href = root + chapter.file;
    if (dial) startDialup(href);
    else navigate(href);
  }

  /* Главная: сайт в окне. Главы: окно развёрнуто на весь экран (режим презентации).
     При переходе с главной окно анимированно разворачивается, при возврате
     на главную сворачивается обратно на своё место.                           */
  const isHome = chapterIndex === 0;
  const isSlideUrl = (url) => /\/slides\/[^/]+\.html$/.test(url.pathname);

  function navigate(href) {
    const url = new URL(href, window.location.href);
    if (isHome && isSlideUrl(url)) { expandTo(url.href); return; }
    if (!isHome && !isSlideUrl(url)) session.set("web10:shrink", "1");
    window.location.href = url.href;
  }

  function pinBrowser(browser) {
    const r = browser.getBoundingClientRect();
    browser.style.setProperty("--from-x", `${r.left}px`);
    browser.style.setProperty("--from-y", `${r.top}px`);
    browser.style.setProperty("--from-w", `${r.width}px`);
    browser.style.setProperty("--from-h", `${Math.min(r.height, window.innerHeight - r.top)}px`);
  }

  function expandTo(href) {
    const browser = $("#browser");
    if (!browser || reduceMotion || compactLayout.matches || body.classList.contains("is-expanding")) {
      window.location.href = href;
      return;
    }
    pinBrowser(browser);
    body.classList.add("is-expanding");
    let gone = false;
    const go = () => { if (!gone) { gone = true; window.location.href = href; } };
    browser.addEventListener("animationend", (e) => { if (e.target === browser) go(); });
    setTimeout(go, 900); // на случай, если анимация не запустилась
  }

  function playShrink() {
    if (!isHome || !session.get("web10:shrink")) return;
    session.remove("web10:shrink");
    const browser = $("#browser");
    if (!browser || reduceMotion || compactLayout.matches) return;
    pinBrowser(browser);
    body.classList.add("is-shrinking");
    browser.addEventListener("animationend", () => body.classList.remove("is-shrinking"), { once: true });
  }

  function setupTransitions() {
    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest("a[href]");
      if (!link || link.target || link.getAttribute("aria-disabled") === "true") return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash && url.pathname === window.location.pathname) return;
      e.preventDefault();
      navigate(url.href);
    });
    // вернулись кнопкой «Назад» браузера: страница из кэша, снять анимацию
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) body.classList.remove("is-expanding", "is-shrinking");
    });
    playShrink();
  }


  /* ---------- 3. Строка состояния и «загрузка» ---------- */

  const statusEl = $("[data-status]");
  const progressEl = $("[data-progress]");
  const READY = "Документ: Готово";
  let loadTimers = [];

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function stopLoading() {
    loadTimers.forEach(clearTimeout);
    loadTimers = [];
    body.classList.remove("is-loading");
    if (progressEl) progressEl.style.width = "0";
    setStatus(READY);
  }

  // Короткая «загрузка» страницы: пульсар крутится, статус меняется
  function fakeLoad() {
    if (reduceMotion) { setStatus(READY); return; }
    stopLoading();
    const host = SITE.fakeHost.replace(/^https?:\/\//, "").split("/")[0];
    const steps = [
      [0,    `Поиск узла ${host}…`,                "8%"],
      [280,  `Соединение с узлом ${host}…`,        "25%"],
      [620,  "Узел найден. Ожидание ответа…",      "45%"],
      [900,  "Передача данных: 17 из 34 объектов…", "70%"],
      [1250, "Передача данных: 34 из 34 объектов…", "100%"],
    ];
    body.classList.add("is-loading");
    steps.forEach(([delay, text, width]) => {
      loadTimers.push(setTimeout(() => {
        setStatus(text);
        if (progressEl) progressEl.style.width = width;
      }, delay));
    });
    loadTimers.push(setTimeout(stopLoading, 1600));
  }

  // Наведение на ссылку → её адрес в строке состояния, как в настоящем браузере
  function setupStatusHover() {
    document.addEventListener("mouseover", (e) => {
      if (body.classList.contains("is-loading")) return;
      const link = e.target.closest("a[href]");
      if (link) setStatus(link.href);
    });
    document.addEventListener("mouseout", (e) => {
      if (body.classList.contains("is-loading")) return;
      if (e.target.closest("a[href]")) setStatus(READY);
    });
  }


  /* ---------- 4. Счётчик посещений ---------- */

  /* GitHub Pages отдаёт только статику, поэтому считает внешний сервис GoatCounter:
     он отличает посетителей по IP + браузеру (хэш, без cookie) и отдаёт общий итог
     в JSON. count.js сам не считает localhost, так что при разработке цифры не растут.
     Итог кэшируется сервисом до 4 часов. Без кода сайта счётчик локальный
     (визиты этого браузера), чтобы страница не выглядела сломанной.          */
  function renderCounter(el, number) {
    const value = String(SITE.counterStart + number).padStart(6, "0");
    el.setAttribute("aria-label", `Посетитель номер ${Number(value)}`);
    el.innerHTML = value
      .split("")
      .map((d) => `<span class="counter__digit" aria-hidden="true">${d}</span>`)
      .join("");
  }

  function setupCounter() {
    const code = SITE.goatcounter;
    if (code) {
      const gc = document.createElement("script");
      gc.async = true;
      gc.src = "https://gc.zgo.at/count.js";
      gc.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
      document.head.append(gc);
    }

    const el = $("[data-counter]");
    if (!el) return;
    const visits = Number(local.get("web10:visits") || 0) + 1;
    local.set("web10:visits", String(visits));
    if (!code) { renderCounter(el, visits); return; }

    // пока ответа нет: последнее известное число, а если его нет, визиты этого браузера
    renderCounter(el, Number(local.get("web10:lastCount")) || visits);
    fetch(`https://${code}.goatcounter.com/counter/TOTAL.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const n = Number(String(data.count).replace(/\D/g, "")) || 0;
        local.set("web10:lastCount", String(n));
        renderCounter(el, n);
      })
      .catch(() => { /* сервис недоступен: остаётся последнее известное число */ });
  }


  /* ---------- 5. Рассказчик: реплики ----------
     Реплики берутся из <ol class="narration"> на странице.
     «Далее» на последней реплике ведёт на следующую главу,
     «Назад» на первой - на последнюю реплику предыдущей главы.
     Работают и клавиши: → / PageDown - дальше, ← / PageUp - назад
     (так что подойдёт пульт-кликер для презентаций).                    */

  const Narrator = (() => {
    const balloon = $("[data-balloon]");
    const textEl = $("[data-balloon-text]");
    const countEl = $("[data-line-count]");
    const prevBtn = $('[data-action="line-prev"]');
    const nextBtn = $('[data-action="line-next"]');
    const lines = $$("[data-narration] > li").map((li) => ({
      html: li.innerHTML.trim(),
      nextLabel: li.dataset.nextLabel,
    }));
    let index = 0;
    let aside = false; // показана «шутка вне сценария» (data-bunny-say)

    /* Печатная машинка: реплика появляется посимвольно, облачко растёт вверх.
       Для экранных дикторов полный текст сразу лежит в скрытом live-элементе. */
    const TYPE_CPS = 110; // символов в секунду
    let typing = null;    // { nodes, total, start, raf }
    const srText = document.createElement("p");
    srText.className = "visually-hidden";
    srText.setAttribute("aria-live", "polite");
    if (textEl) {
      textEl.removeAttribute("aria-live");
      textEl.setAttribute("aria-hidden", "true");
      textEl.after(srText);
    }

    function fillTyped(count) {
      let left = count;
      typing.nodes.forEach((n) => {
        const take = Math.max(0, Math.min(n.full.length, left));
        if (n.node.data.length !== take) n.node.data = n.full.slice(0, take);
        left -= n.full.length;
      });
    }

    function finishTyping() {
      if (!typing) return;
      cancelAnimationFrame(typing.raf);
      fillTyped(typing.total);
      typing = null;
      textEl.classList.remove("is-typing");
      Buddy.talk(false);
      Buddy.layoutBalloon();
    }

    function typeLine(html) {
      finishTyping();
      textEl.innerHTML = html;
      srText.textContent = textEl.textContent;
      if (reduceMotion || compactLayout.matches) { Buddy.layoutBalloon(); return; }
      const walker = document.createTreeWalker(textEl, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push({ node: walker.currentNode, full: walker.currentNode.data });
      const total = nodes.reduce((sum, n) => sum + n.full.length, 0);
      typing = { nodes, total, start: performance.now(), raf: 0 };
      fillTyped(0);
      textEl.classList.add("is-typing");
      Buddy.talk(true);
      const step = (now) => {
        if (!typing) return;
        const count = Math.floor(((now - typing.start) / 1000) * TYPE_CPS) + 1;
        fillTyped(count);
        Buddy.layoutBalloon();
        if (count >= typing.total) finishTyping();
        else typing.raf = requestAnimationFrame(step);
      };
      typing.raf = requestAnimationFrame(step);
    }

    const startAtEnd = session.get("web10:startAtEnd");
    if (startAtEnd && startAtEnd === (CHAPTERS[chapterIndex] || {}).id) index = Math.max(0, lines.length - 1);
    session.remove("web10:startAtEnd");

    function pop() {
      if (!balloon) return;
      balloon.classList.remove("is-popping");
      void balloon.offsetWidth; // перезапуск анимации
      balloon.classList.add("is-popping");
    }

    function render() {
      if (!balloon || !textEl) return;
      aside = false;
      const line = lines[index];
      typeLine(line ? line.html : "");
      countEl.textContent = lines.length ? `${index + 1} / ${lines.length}` : "";

      const atStart = index === 0;
      const atEnd = index >= lines.length - 1;
      prevBtn.disabled = atStart && !prevChapter;
      prevBtn.textContent = "‹ Назад";
      if (atEnd) {
        nextBtn.textContent = (line && line.nextLabel) || (nextChapter ? `${nextChapter.title} ›` : "Конец");
        nextBtn.disabled = !nextChapter;
      } else {
        nextBtn.textContent = "Далее ›";
        nextBtn.disabled = false;
      }
      pop();
      Buddy.layoutBalloon();
    }

    function next() {
      if (aside) { render(); return; }
      if (index < lines.length - 1) { index++; render(); Buddy.nod(); return; }
      goToChapter(nextChapter, { dial: chapterIndex === 0 });
    }

    function prev() {
      if (aside) { render(); return; }
      if (index > 0) { index--; render(); Buddy.nod(); return; }
      goToChapter(prevChapter, { atEnd: true });
    }

    // Фраза вне сценария (кнопки меню, гостевая книга и т. п.)
    function say(html) {
      if (!balloon) return;
      show();
      aside = true;
      typeLine(html);
      countEl.textContent = "★";
      prevBtn.disabled = false;
      nextBtn.disabled = false;
      nextBtn.textContent = "Понятно ›";
      pop();
      Buddy.layoutBalloon();
      Buddy.wave();
    }

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn buddy__toggle";
    if (balloon) {
      balloon.id = "narrator-balloon";
      toggle.setAttribute("aria-controls", balloon.id);
      balloon.before(toggle);
    }
    function syncToggle() {
      toggle.setAttribute("aria-expanded", String(!balloon.hidden));
      toggle.textContent = balloon.hidden ? "Чикиряо: читать реплики" : "Свернуть реплики";
    }
    function storageKey() {
      return compactLayout.matches ? "web10:mobileNarratorOpen" : "web10:balloonHidden";
    }
    function adaptNarrator() {
      const wrap = $("[data-buddy]");
      if (compactLayout.matches) {
        $(".chrome").after(wrap);
        balloon.hidden = session.get(storageKey()) !== "1";
      } else {
        body.append(wrap);
        balloon.hidden = session.get(storageKey()) === "1";
      }
      finishTyping();
      syncToggle();
      Buddy.layoutBalloon();
    }

    function show() {
      if (!balloon || !balloon.hidden) return;
      balloon.hidden = false;
      if (compactLayout.matches) session.set(storageKey(), "1");
      else session.remove(storageKey());
      syncToggle();
      Buddy.layoutBalloon();
    }

    function hide() {
      if (!balloon) return;
      finishTyping();
      balloon.hidden = true;
      if (compactLayout.matches) session.remove(storageKey());
      else session.set(storageKey(), "1");
      syncToggle();
    }

    function init() {
      if (!balloon) return;
      prevBtn.addEventListener("click", prev);
      nextBtn.addEventListener("click", next);
      $('[data-action="balloon-close"]').addEventListener("click", hide);
      textEl.addEventListener("click", finishTyping); // клик по тексту: допечатать сразу
      toggle.addEventListener("click", () => { if (balloon.hidden) show(); else hide(); });
      compactLayout.addEventListener("change", adaptNarrator);
      adaptNarrator();
      render();

      document.addEventListener("keydown", (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.target.closest("input, textarea, select, [contenteditable], [role=slider], [role=tab], [role=radio]")) return;
        if ($("dialog[open]")) return;
        if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); show(); next(); }
        if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); show(); prev(); }
      });

      $$("[data-bunny-say]").forEach((el) => {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          say(el.dataset.bunnySay);
        });
      });
    }

    return { init, say, show, isHidden: () => !balloon || balloon.hidden };
  })();


  /* ---------- 6. Рассказчик: заяц из частей ----------
     Спрайты и разметка собраны скриптом tools/build_bunny.py из игры:
     тело и голова - отдельные слои, 8 поворотов × 3 высоты камеры.
     Лапки - «3D»-шарики: их положение считается в координатах игры
     и проецируется с учётом поворота и наклона камеры (2.5D).         */

  const Buddy = (() => {
    const RIG = window.BUNNY_RIG;
    const wrap = $("[data-buddy]");
    const rig = $("[data-rig]");
    const balloon = $("[data-balloon]");
    if (!RIG || !wrap || !rig) {
      return { init() {}, layoutBalloon() {}, wave() {}, nod() {}, talk() {}, isBusy: () => false };
    }
    const part = (name) => $(`[data-part="${name}"]`, rig);
    const swingEl = part("swing");
    const bodyEl = part("body");
    const headEl = part("head");
    const hands = [part("hand-l"), part("hand-r")];

    // Звёздочки головокружения: живут внутри качающегося слоя, чтобы падать вместе с зайцем
    const starsEl = document.createElement("span");
    starsEl.className = "rig__stars";
    starsEl.setAttribute("aria-hidden", "true");
    const stars = Array.from({ length: 4 }, () => {
      const star = document.createElement("span");
      star.className = "rig__star";
      starsEl.append(star);
      return star;
    });
    swingEl.append(starsEl);

    const [FW, FH] = RIG.frame;
    const [AX, AY] = RIG.anchor;
    const PPU = RIG.pxPerUnit;
    const ELEV = RIG.elevations.map((d) => (d * Math.PI) / 180);
    const KEY = "web10:buddy";
    const TUNE_KEY = "web10:bunny-tuning";

    /* Ручная подстройка головы для каждого из 24 ракурсов (px кадра).
       Порядок: сначала то, что сохранено в браузере панелью ⚙,
       иначе - файл assets/bunny/bunny-tuning.js (его даёт кнопка «Экспорт»). */
    function emptyTuning() {
      return { version: 1, views: Array.from({ length: 24 }, () => ({ x: 0, y: 0 })) };
    }
    function parseTuning(raw) {
      if (!raw || !Array.isArray(raw.views) || raw.views.length !== 24) return null;
      const num = (v) => (Number.isFinite(v) ? clamp(v, -150, 150) : 0);
      return { version: 1, views: raw.views.map((v) => ({ x: num(v && v.x), y: num(v && v.y) })) };
    }
    function fileTuning() {
      return parseTuning(window.BUNNY_TUNING) || emptyTuning();
    }
    let tuning = (() => {
      try { return parseTuning(JSON.parse(local.get(TUNE_KEY))) || fileTuning(); } catch { return fileTuning(); }
    })();
    let lockView = null; // { column, row } - ракурс зафиксирован из панели

    // Масштаб на экране: на телефоне заяц меньше
    let S = 1;
    const st = {
      x: 0, y: 0,                 // точка между ступнями, px окна
      moved: false,               // пользователь переставлял зайца
      heading: 0, headingTarget: 0, column: 0, row: 0,
      swing: 0, swingV: 0, swingTarget: 0,
      tilt: 0, tiltV: 0,
      vx: 0, vy: 0,
      dragging: false, pressed: false,
      grab: { x: 0, y: 0 }, start: { x: 0, y: 0 }, last: { x: 0, y: 0, t: 0 },
      mouseX: null,
      waveUntil: 0, hopAt: -10, nodAt: -10, landAt: -10,
      stillSince: 0,
      shakeDir: { x: 0, y: 0 }, flips: [], // смены направления при тряске (время, с)
      dizzyAt: -100, fallDir: 1,
      talking: false,
    };

    /* Головокружение: если сильно потрясти зайца и отпустить, у него кружится голова,
       лапки крутятся, вокруг летают звёздочки; потом он падает на бок и встаёт.
       Фазы, в секундах от момента, когда отпустили:                              */
    const DIZZY = { wobble: 2.4, fall: 0.5, lie: 1.3, rise: 0.6 };
    DIZZY.end = DIZZY.wobble + DIZZY.fall + DIZZY.lie + DIZZY.rise;
    const SHAKE_FLIPS = 6;      // столько резких смен направления...
    const SHAKE_WINDOW = 1.6;   // ...за столько секунд = «потрясли»
    const SHAKE_SPEED = 400;    // px/с: медленнее не считается тряской

    const dizzyTime = () => performance.now() / 1000 - st.dizzyAt;
    const isDizzy = () => dizzyTime() < DIZZY.end;

    function measure() {
      S = compactLayout.matches ? 0.2 : window.innerWidth < 1100 ? 0.62 : 0.72;
      rig.setAttribute("aria-label", compactLayout.matches
        ? "Чикиряо. Нажмите, чтобы прочитать реплики"
        : "Чикиряо. Нажмите, чтобы он помахал; перетащите, чтобы передвинуть");
      rig.style.setProperty("--fw", `${FW * S}px`);
      rig.style.setProperty("--fh", `${FH * S}px`);
      rig.style.setProperty("--hand", `${RIG.hand.radius * 2 * PPU * S}px`);
    }

    function homePosition() {
      return { x: window.innerWidth - FW * S * 0.5 - 6, y: window.innerHeight - 10 };
    }

    function keepInside() {
      st.x = clamp(st.x, FW * S * 0.3, window.innerWidth - FW * S * 0.3);
      st.y = clamp(st.y, FH * S * 0.75, window.innerHeight - 6);
    }

    function restore() {
      const saved = session.get(KEY);
      if (saved) {
        try {
          const p = JSON.parse(saved);
          st.x = p.rx * window.innerWidth;
          st.y = p.ry * window.innerHeight;
          st.moved = true;
        } catch { /* игнор */ }
      }
      if (!st.moved) Object.assign(st, homePosition());
      keepInside();
    }

    function save() {
      session.set(KEY, JSON.stringify({ rx: st.x / window.innerWidth, ry: st.y / window.innerHeight }));
    }

    /* Ввод: короткое нажатие - помахать, движение - перетаскивание */
    function onDown(e) {
      if (e.button !== 0 || isDizzy()) return;
      if (compactLayout.matches) { Narrator.show(); wave(); return; }
      rig.setPointerCapture(e.pointerId);
      const now = performance.now() / 1000;
      st.pressed = true;
      st.start = { x: e.clientX, y: e.clientY };
      st.grab = { x: e.clientX - st.x, y: e.clientY - st.y };
      st.flips = [];
      st.shakeDir = { x: 0, y: 0 };
      st.last = { x: e.clientX, y: e.clientY, t: now };
      // качаться будем вокруг точки, за которую взяли
      const ox = AX * S + st.grab.x;
      const oy = AY * S + st.grab.y;
      swingEl.style.transformOrigin = `${ox}px ${oy}px`;
    }

    function onMove(e) {
      st.mouseX = e.clientX;
      if (!st.pressed) return;
      const dist = Math.hypot(e.clientX - st.start.x, e.clientY - st.start.y);
      if (!st.dragging && dist > 6) {
        st.dragging = true;
        rig.classList.add("is-dragging");
      }
      if (!st.dragging) return;
      const now = performance.now() / 1000;
      const dt = Math.max(1 / 240, now - st.last.t);
      const vx = (e.clientX - st.last.x) / dt;
      const vy = (e.clientY - st.last.y) / dt;
      st.vx = st.vx * 0.7 + vx * 0.3;
      st.vy = st.vy * 0.7 + vy * 0.3;
      // тряска: считаем резкие смены направления по каждой оси
      [["x", st.vx], ["y", st.vy]].forEach(([axis, v]) => {
        if (Math.abs(v) < SHAKE_SPEED) return;
        const dir = Math.sign(v);
        if (st.shakeDir[axis] && dir !== st.shakeDir[axis]) st.flips.push(now);
        st.shakeDir[axis] = dir;
      });
      st.flips = st.flips.filter((ft) => now - ft < SHAKE_WINDOW);
      st.last = { x: e.clientX, y: e.clientY, t: now };
      st.x = e.clientX - st.grab.x;
      st.y = e.clientY - st.grab.y;
      keepInside();
      st.moved = true;
    }

    function onUp() {
      if (!st.pressed) return;
      st.pressed = false;
      if (st.dragging) {
        st.dragging = false;
        rig.classList.remove("is-dragging");
        st.landAt = performance.now() / 1000;
        save();
        if (st.flips.length >= SHAKE_FLIPS && !reduceMotion) dizzy();
      } else {
        if (Narrator.isHidden()) Narrator.show();
        wave();
      }
    }

    function wave() {
      if (isDizzy()) return;
      const now = performance.now() / 1000;
      st.waveUntil = now + 1.5;
      st.hopAt = now;
    }

    function nod() {
      st.nodAt = performance.now() / 1000;
    }

    function talk(on) {
      st.talking = on;
    }

    function dizzy() {
      st.dizzyAt = performance.now() / 1000;
      st.flips = [];
      st.waveUntil = 0;
      st.swing = 0;
      st.swingV = 0;
      // падает в сторону, где больше места
      st.fallDir = st.x > window.innerWidth / 2 ? -1 : 1;
      setTimeout(() => {
        Narrator.say("Голова кружится... Давай без тряски, ладно?");
      }, DIZZY.end * 1000 + 150);
    }

    /* Облачко рядом с головой; сторона выбирается по свободному месту */
    function layoutBalloon() {
      if (!balloon || balloon.hidden) return;
      if (compactLayout.matches) {
        balloon.style.removeProperty("width");
        balloon.style.removeProperty("transform");
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const bw = Math.min(320, vw - 24);
      balloon.style.width = `${bw}px`;
      const bh = balloon.offsetHeight;
      const half = FW * S * 0.3;
      const headY = st.y - (AY - RIG.frames[0].headCentre[1]) * S;
      let x;
      let y;
      let side;
      if (vw < 600) {
        side = "above";
        x = clamp(st.x - bw * 0.7, 12, vw - bw - 12);
        y = st.y - FH * S * 0.92 - bh - 16;
        balloon.style.setProperty("--tail-x", `${clamp(st.x - x - 9, 16, bw - 30)}px`);
      } else {
        side = st.x - half - bw - 22 > 8 ? "left" : "right";
        x = side === "left" ? st.x - half - bw - 22 : st.x + half + 22;
        // низ облачка чуть ниже головы: при печати оно растёт вверх
        y = clamp(headY + 46 - bh, 8, vh - bh - 8);
        balloon.style.setProperty("--tail-y", `${clamp(headY - y - 9, 14, bh - 28)}px`);
      }
      y = clamp(y, 8, vh - bh - 8);
      balloon.classList.toggle("balloon--left", side === "left");
      balloon.classList.toggle("balloon--right", side === "right");
      balloon.classList.toggle("balloon--above", side === "above");
      balloon.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }

    /* Кадр из листа: колонка = поворот, ряд = высота камеры */
    function setFrame(column, row, headColumn = column) {
      bodyEl.style.backgroundPosition = `${-column * FW * S}px ${-row * FH * S}px`;
      headEl.style.backgroundPosition = `${-headColumn * FW * S}px ${-row * FH * S}px`;
      const f = RIG.frames[row * 8 + headColumn];
      headEl.style.transformOrigin = `${f.pivot[0] * S}px ${f.pivot[1] * S}px`;
    }

    // Колонка по углу поворота, с «гистерезисом», чтобы кадр не дрожал на границе
    function pickColumn(heading) {
      const nearest = ((Math.round(heading / 45) % 8) + 8) % 8;
      const diff = ((heading - st.column * 45) % 360 + 540) % 360 - 180;
      return Math.abs(diff) > 22.5 + 6 ? nearest : st.column;
    }

    let lastT = performance.now() / 1000;
    let lastBalloon = "";
    let animationFrame = 0;
    let mobileVisible = true;

    function resumeAnimation() {
      if (animationFrame || document.hidden || compactLayout.matches && !mobileVisible) return;
      lastT = performance.now() / 1000;
      animationFrame = requestAnimationFrame(tick);
    }

    function tick() {
      animationFrame = 0;
      if (document.hidden || compactLayout.matches && !mobileVisible) return;
      const t = performance.now() / 1000;
      const dt = Math.min(0.05, t - lastT);
      lastT = t;

      /* головокружение: фаза и её параметры */
      const dz = t - st.dizzyAt;
      const dizzyOn = dz >= 0 && dz < DIZZY.end;
      const tFall = DIZZY.wobble, tLie = tFall + DIZZY.fall, tRise = tLie + DIZZY.lie;

      /* куда смотрим */
      if (dizzyOn) {
        st.headingTarget = 0;
      } else if (st.dragging) {
        if (st.vx > 160) st.headingTarget = 90;
        else if (st.vx < -160) st.headingTarget = -90;
        if (Math.abs(st.vx) < 40 && Math.abs(st.vy) < 40) {
          if (!st.stillSince) st.stillSince = t;
          if (t - st.stillSince > 0.45) st.headingTarget = 0;
        } else st.stillSince = 0;
        st.vx *= 0.9; // затухание, если мышь остановилась
        st.vy *= 0.9;
      } else if (st.mouseX !== null && !reduceMotion) {
        // следит за курсором: поворачивает голову на 3/4, если курсор далеко
        st.headingTarget = clamp((st.mouseX - st.x) / 380, -1, 1) * 42;
      } else st.headingTarget = 0;

      const dh = st.headingTarget - st.heading;
      st.heading += dh * Math.min(1, dt * (st.dragging ? 9 : 5));
      st.column = pickColumn(st.heading);
      st.row = st.dragging ? 1 : 0;
      if (lockView) { st.column = lockView.column; st.row = lockView.row; }
      // голова «гуляет» по сторонам, пока кружится
      let headColumn = st.column;
      if (dizzyOn && dz < tFall) {
        const look = Math.sin(dz * 4.3) * 2.3 + Math.sin(dz * 7.9) * 0.9;
        headColumn = ((Math.round(look) % 8) + 8) % 8;
      }
      setFrame(st.column, st.row, headColumn);
      const tune = tuning.views[st.row * 8 + headColumn];

      /* маятник: при перетаскивании ноги отстают от движения */
      st.swingTarget = st.dragging ? clamp(st.vx * 0.045, -38, 38) : 0;
      const k = 110, c = 7.5;
      st.swingV += ((st.swingTarget - st.swing) * k - st.swingV * c) * dt;
      st.swing += st.swingV * dt;
      /* голова чуть запаздывает за телом - «желейный» наклон */
      const tiltTarget = -st.swingV * 0.035 + (st.dragging ? -st.vx * 0.006 : 0);
      st.tiltV += ((clamp(tiltTarget, -14, 14) - st.tilt) * 140 - st.tiltV * 11) * dt;
      st.tilt += st.tiltV * dt;

      /* дыхание, прыжок, кивок, приземление */
      const idle = reduceMotion ? 0 : Math.sin(t * 2.2);
      const hopP = (t - st.hopAt) / 0.45;
      const hop = hopP >= 0 && hopP < 1 ? Math.sin(hopP * Math.PI) * 18 * S / 0.72 : 0;
      const nodP = (t - st.nodAt) / 0.35;
      const nod = nodP >= 0 && nodP < 1 ? Math.sin(nodP * Math.PI) * 6 : 0;
      const landP = (t - st.landAt) / 0.3;
      const squash = landP >= 0 && landP < 1 ? 1 - Math.sin(landP * Math.PI) * 0.08 : 1;

      /* головокружение: покачивание → падение на бок → лежит → встаёт */
      let dizzyRot = 0;
      let headWobble = { x: 0, y: 0, r: 0 };
      if (dizzyOn) {
        const fade = 1 - dz / tFall;
        if (dz < tFall) {
          dizzyRot = Math.sin(dz * 3.4) * 7 * fade;
          headWobble = { x: Math.cos(dz * 6.5) * 4, y: Math.sin(dz * 6.5) * 3, r: Math.sin(dz * 5.2) * 16 };
        } else if (dz < tLie) {
          const p = (dz - tFall) / DIZZY.fall;
          dizzyRot = st.fallDir * 90 * p * p; // падает с ускорением
        } else if (dz < tRise) {
          const p = (dz - tLie) / 0.3;
          dizzyRot = st.fallDir * (90 - (p < 1 ? Math.sin(p * Math.PI) * 9 : 0)); // отскок от «пола»
        } else {
          const p = (dz - tRise) / DIZZY.rise;
          const back = 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2); // easeOutBack
          dizzyRot = st.fallDir * 90 * (1 - back);
        }
        if (dz >= DIZZY.end - 0.05) st.hopAt = t; // вскочил
      }

      rig.style.transform = `translate3d(${st.x - AX * S}px, ${st.y - AY * S - hop}px, 0)`;
      if (dizzyOn) {
        // при падении поворачиваемся вокруг края ступни, на который падаем
        const edge = dz < tFall ? 0 : st.fallDir * FW * 0.22;
        swingEl.style.transformOrigin = `${(AX + edge) * S}px ${AY * S}px`;
        swingEl.style.transform = `rotate(${dizzyRot.toFixed(2)}deg)`;
      } else {
        swingEl.style.transform =
          `rotate(${st.swing.toFixed(2)}deg) scale(${(2 - squash).toFixed(3)}, ${squash.toFixed(3)})`;
        swingEl.style.transformOrigin = st.dragging || Math.abs(st.swing) > 0.3
          ? swingEl.style.transformOrigin
          : `${AX * S}px ${AY * S}px`;
      }
      headEl.style.transform =
        `translate(${((tune.x + headWobble.x) * S).toFixed(2)}px, ` +
        `${((-tune.y + headWobble.y) * S - idle * 1.4 * S).toFixed(2)}px) ` +
        `rotate(${(st.tilt + nod + headWobble.r + (st.talking ? Math.sin(t * 19) * 1.8 : 0)).toFixed(2)}deg)`;

      /* звёздочки кружат вокруг головы */
      const starsOn = dizzyOn && dz > 0.15 && dz < DIZZY.end - 0.35;
      const hf = RIG.frames[st.row * 8 + headColumn];
      stars.forEach((star, k) => {
        if (!starsOn) { star.style.opacity = "0"; return; }
        const a = dz * 5.2 + (k * Math.PI * 2) / stars.length;
        const r = hf.headRadius;
        const cx = hf.headCentre[0] + tune.x + Math.cos(a) * r * 1.0;
        const cy = hf.headCentre[1] - tune.y - r * 0.95 + Math.sin(a) * r * 0.3;
        const size = (1.0 + 0.3 * Math.sin(a)) * S / 0.72;
        star.style.opacity = "1";
        star.style.transform =
          `translate(${(cx * S - 11).toFixed(1)}px, ${(cy * S - 11).toFixed(1)}px) ` +
          `scale(${size.toFixed(2)}) rotate(${(dz * 220 + k * 40).toFixed(0)}deg)`;
        star.classList.toggle("is-behind", Math.sin(a) < 0);
      });

      /* лапки: координаты игры → поворот → наклон камеры → пиксели кадра */
      const th = ((lockView ? st.column * 45 : st.heading) * Math.PI) / 180;
      const el = ELEV[st.row];
      const waving = t < st.waveUntil;
      hands.forEach((hand, i) => {
        const side = i ? 1 : -1;
        let p;
        if (dizzyOn && dz < tFall) {
          // лапки крутятся «мельницей»
          const a = dz * 13 + i * Math.PI;
          p = [side * (16 + 5 * Math.cos(a)), 23 + 9 * Math.sin(a), 6 + 9 * Math.cos(a)];
        } else if (dizzyOn && dz < tRise) {
          p = [side * 19, 15, 6]; // лежит, лапки обмякли
        } else if (waving) {
          const beat = Math.sin(t * 11 + i * Math.PI);
          p = [side * (17 + 3 * Math.abs(beat)), 25 + 11 * beat, 6];
        } else if (st.dragging) {
          p = [side * 18, 22 + Math.sin(t * 16 + i * Math.PI) * 4, 6]; // болтает лапками
        } else {
          p = [side * RIG.hand.rest[0], RIG.hand.rest[1] + idle * 0.6 + Math.sin(t * 2 + i) * 0.4, RIG.hand.rest[2]];
        }
        const x = p[0] * Math.cos(th) + p[2] * Math.sin(th);
        const z = -p[0] * Math.sin(th) + p[2] * Math.cos(th);
        const up = p[1] * Math.cos(el) - z * Math.sin(el);
        const size = RIG.hand.radius * 2 * PPU * S;
        const hx = (AX + x * PPU) * S - size / 2;
        const hy = (AY - up * PPU) * S - size / 2;
        hand.style.transform = `translate(${hx.toFixed(1)}px, ${hy.toFixed(1)}px)`;
        hand.classList.toggle("is-behind", z < -1);
      });

      const key = `${Math.round(st.x)}|${Math.round(st.y)}`;
      if (key !== lastBalloon) { lastBalloon = key; layoutBalloon(); }
      animationFrame = requestAnimationFrame(tick);
    }

    function init() {
      measure();
      restore();
      rig.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      document.addEventListener("mouseleave", () => { st.mouseX = null; });
      rig.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); Narrator.show(); wave(); }
      });
      // двойной клик - вернуть зайца на место
      rig.addEventListener("dblclick", () => {
        if (isDizzy()) return;
        st.moved = false;
        session.remove(KEY);
        Object.assign(st, homePosition());
      });
      window.addEventListener("resize", () => {
        measure();
        if (!st.moved) Object.assign(st, homePosition());
        keepInside();
        lastBalloon = "";
        resumeAnimation();
      });
      // На телефоне Чикиряо не перерисовывается, когда его прокрутили за экран.
      new IntersectionObserver(([entry]) => {
        mobileVisible = entry.isIntersecting;
        resumeAnimation();
      }).observe(rig);
      document.addEventListener("visibilitychange", resumeAnimation);
      wrap.classList.add("is-ready");
      resumeAnimation();
      if (!reduceMotion) setTimeout(wave, 700); // поздоровался
    }

    // API для панели настроек
    const tuningApi = {
      get: () => tuning,
      view: () => ({ column: st.column, row: st.row }),
      lock(view) { lockView = view; },
      set(index, values) {
        Object.assign(tuning.views[index], values);
        local.set(TUNE_KEY, JSON.stringify(tuning));
      },
      resetToFile() {
        tuning = fileTuning();
        local.remove(TUNE_KEY);
      },
      clearAll() {
        tuning = emptyTuning();
        local.set(TUNE_KEY, JSON.stringify(tuning));
      },
      exportJs() {
        return "/* Подстройка головы зайца: 24 ракурса = 3 ряда (высота камеры) × 8 колонок (поворот).\n" +
          "   x - вправо, y - вверх, в пикселях кадра. Сделано панелью ⚙ на сайте. */\n" +
          "window.BUNNY_TUNING = " + JSON.stringify(tuning) + ";\n";
      },
    };

    return { init, layoutBalloon, wave, nod, talk, isBusy: isDizzy, tuning: tuningApi };
  })();


  /* ---------- 7. Диалоги и «дозвон» ---------- */

  function openDialog(id) {
    const dlg = document.getElementById(id);
    if (!dlg) return;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }

  // «Удалённое соединение»: короткий дозвон перед переходом к первой главе
  const dialup = $("#dialup");
  let dialTimers = [];
  let dialTarget = null;
  let dialAudio = null;

  function dialCleanup() {
    dialTimers.forEach(clearTimeout);
    dialTimers = [];
    if (dialAudio) { dialAudio.pause(); dialAudio = null; }
  }

  function startDialup(href) {
    if (!dialup || typeof dialup.showModal !== "function" || reduceMotion) {
      navigate(href);
      return;
    }
    dialTarget = href;
    const status = $("[data-dialup-status]", dialup);
    const bar = $("[data-dialup-bar]", dialup);
    const steps = [
      [0,    "Набор номера…",                         "10%"],
      [700,  "Проверка имени пользователя и пароля…", "40%"],
      [1400, "Регистрация компьютера в сети…",        "70%"],
      [2100, "Соединено на скорости 56 000 бит/с",    "100%"],
    ];
    dialCleanup();
    bar.style.width = "0";
    dialup.showModal();

    if (SITE.dialupSound) {
      dialAudio = new Audio(root + SITE.dialupSound);
      dialAudio.play().catch(() => {});
    }
    steps.forEach(([delay, text, width]) => {
      dialTimers.push(setTimeout(() => { status.textContent = text; bar.style.width = width; }, delay));
    });
    dialTimers.push(setTimeout(() => { dialup.close(); navigate(dialTarget); }, 2800));
  }

  function setupDialogs() {
    $$("[data-open]").forEach((el) => {
      el.addEventListener("click", () => openDialog(el.dataset.open));
    });

    $$("a[data-dialup]").forEach((link) => {
      link.addEventListener("click", (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // новая вкладка - без шоу
        e.preventDefault();
        startDialup(link.href);
      });
    });

    if (dialup) {
      $('[data-action="dialup-cancel"]', dialup).addEventListener("click", () => {
        dialCleanup();
        dialup.close();
        Narrator.say("Соединение прервано. Раньше так бывало часто: кто-то в квартире снял трубку, и связь рвалась. Можно попробовать ещё раз.");
      });
      $('[data-action="dialup-skip"]', dialup).addEventListener("click", () => {
        dialCleanup();
        dialup.close();
        navigate(dialTarget);
      });
      dialup.addEventListener("cancel", dialCleanup);
    }
  }


  /* ---------- 8. Мелочи: тулбар, вебринг, «ссылка на нас» ---------- */

  function setupActions() {
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      switch (el.dataset.action) {
        case "reload": fakeLoad(); break;
        case "stop":
          stopLoading();
          setStatus("Загрузка прервана пользователем");
          break;
        case "copy-linkme": copyLinkme(el); break;
        default: break;
      }
    });

    // Вебринг: «случайный» сайт из маленького списка живых инди-ресурсов
    const ring = [
      "https://neocities.org/browse",
      "https://indieweb.org/",
      "https://gifcities.org/",
      "https://cyber.dabamos.de/88x31/",
      "https://yesterweb.org/",
      "https://web.archive.org/",
    ];
    $$("[data-webring-random]").forEach((a) => {
      a.addEventListener("click", () => { a.href = ring[Math.floor(Math.random() * ring.length)]; });
    });
  }

  // «Ссылка на нас»: HTML-код кнопки 88×31 с настоящим адресом сайта
  function setupLinkme() {
    const area = $("[data-linkme]");
    if (!area) return;
    area.value =
      `<a href="${SITE.publicUrl}"><img src="${SITE.publicUrl}assets/badges/web10-button.gif" ` +
      `width="88" height="31" alt="Web 1.0: каким был интернет?"></a>`;
    area.addEventListener("focus", () => area.select());
  }

  async function copyLinkme(btn) {
    const area = $("[data-linkme]");
    if (!area) return;
    try {
      await navigator.clipboard.writeText(area.value);
    } catch {
      area.select();
      document.execCommand && document.execCommand("copy");
    }
    const label = btn.textContent;
    btn.textContent = "Готово!";
    setTimeout(() => { btn.textContent = label; }, 1400);
  }


  /* ---------- 9. Панель настроек ⚙ (для разработки) ----------
     Сейчас в ней высота/сдвиг головы зайца для каждого ракурса.
     Значения сохраняются в этом браузере; кнопка «Экспорт» копирует
     содержимое для файла assets/bunny/bunny-tuning.js - так правки
     попадут на сайт для всех.                                         */

  function setupDevPanel() {
    const enabled = SITE.devTools || new URLSearchParams(location.search).has("dev");
    if (!enabled || !Buddy.tuning) return;
    const T = Buddy.tuning;
    const COLS = ["0° анфас", "45°", "90° профиль", "135°", "180° спина", "225°", "270° профиль", "315°"];
    const ROWS = ["камера прямо (0°)", "сверху 40°, при перетаскивании", "сверху 75°"];

    const btn = document.createElement("button");
    btn.className = "devbtn";
    btn.type = "button";
    btn.title = "Настройки (для разработки)";
    btn.setAttribute("aria-label", "Настройки");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "⚙";

    const panel = document.createElement("section");
    panel.className = "devpanel window";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Настройки");
    panel.innerHTML = `
      <div class="titlebar titlebar--dialog">
        <span class="titlebar__stripes" aria-hidden="true"></span>
        <h2 class="titlebar__title">Настройки</h2>
        <span class="titlebar__stripes" aria-hidden="true"></span>
      </div>
      <div class="devpanel__body">
        <fieldset class="devpanel__group">
          <legend>Голова зайца по ракурсам</legend>
          <label class="devpanel__check"><input type="checkbox" data-dev="lock"> Зафиксировать ракурс для настройки</label>
          <div class="devpanel__row">
            <label>Поворот <select data-dev="column">${COLS.map((c, i) => `<option value="${i}">${i} · ${c}</option>`).join("")}</select></label>
            <label>Камера <select data-dev="row">${ROWS.map((r, i) => `<option value="${i}">${r}</option>`).join("")}</select></label>
          </div>
          <div class="devpanel__grid" data-dev="grid" aria-label="Все ракурсы"></div>
          <label class="devpanel__slider">Высота (y) <input type="range" min="-80" max="80" step="1" data-dev="y"><output data-dev="y-out"></output></label>
          <label class="devpanel__slider">Сдвиг (x) <input type="range" min="-60" max="60" step="1" data-dev="x"><output data-dev="x-out"></output></label>
          <div class="devpanel__actions">
            <button class="btn btn--small" type="button" data-dev="zero">Обнулить ракурс</button>
            <button class="btn btn--small" type="button" data-dev="copy-row">Высоту → на весь ряд</button>
          </div>
          <p class="devpanel__hint">Без фиксации ползунки правят ракурс, который сейчас на экране
            (перетащи зайца или поводи курсором, чтобы он повернулся).</p>
        </fieldset>
        <div class="devpanel__actions">
          <button class="btn btn--small" type="button" data-dev="export">Экспорт → буфер</button>
          <button class="btn btn--small" type="button" data-dev="reset">Сбросить к файлу</button>
          <button class="btn btn--small" type="button" data-dev="clear">Обнулить всё</button>
        </div>
        <p class="devpanel__hint" data-dev="msg">Правки сохраняются в этом браузере.
          Чтобы они были на сайте: «Экспорт» и вставить в <code>assets/bunny/bunny-tuning.js</code>.</p>
      </div>`;
    document.body.append(btn, panel);

    const q = (name) => $(`[data-dev="${name}"]`, panel);
    const lock = q("lock"), colSel = q("column"), rowSel = q("row");
    const ySl = q("y"), xSl = q("x"), grid = q("grid"), msg = q("msg");

    grid.innerHTML = Array.from({ length: 24 }, (_, i) =>
      `<button type="button" data-i="${i}" title="ряд ${Math.floor(i / 8)}, поворот ${i % 8}">${i % 8}</button>`).join("");

    const current = () => (lock.checked
      ? Number(rowSel.value) * 8 + Number(colSel.value)
      : T.view().row * 8 + T.view().column);

    let shown = -1;
    function refresh(force) {
      const i = current();
      const v = T.get().views[i];
      if (force || i !== shown || document.activeElement !== ySl) ySl.value = v.y;
      if (force || i !== shown || document.activeElement !== xSl) xSl.value = v.x;
      q("y-out").textContent = v.y;
      q("x-out").textContent = v.x;
      $$("button", grid).forEach((b, k) => {
        b.classList.toggle("is-current", k === i);
        const t = T.get().views[k];
        b.classList.toggle("is-tuned", !!(t.x || t.y));
      });
      if (!lock.checked) { colSel.value = i % 8; rowSel.value = Math.floor(i / 8); }
      shown = i;
    }
    function applyLock() {
      T.lock(lock.checked ? { column: Number(colSel.value), row: Number(rowSel.value) } : null);
      refresh(true);
    }

    let timer = null;
    btn.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
      clearInterval(timer);
      if (!panel.hidden) { refresh(true); timer = setInterval(() => refresh(false), 150); }
    });
    lock.addEventListener("change", applyLock);
    colSel.addEventListener("change", () => { lock.checked = true; applyLock(); });
    rowSel.addEventListener("change", () => { lock.checked = true; applyLock(); });
    grid.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]");
      if (!b) return;
      const i = Number(b.dataset.i);
      lock.checked = true;
      colSel.value = i % 8;
      rowSel.value = Math.floor(i / 8);
      applyLock();
    });
    ySl.addEventListener("input", () => { T.set(current(), { y: Number(ySl.value) }); refresh(false); });
    xSl.addEventListener("input", () => { T.set(current(), { x: Number(xSl.value) }); refresh(false); });
    q("zero").addEventListener("click", () => { T.set(current(), { x: 0, y: 0 }); refresh(true); });
    q("copy-row").addEventListener("click", () => {
      const i = current(), row = Math.floor(i / 8), y = T.get().views[i].y;
      for (let c = 0; c < 8; c++) T.set(row * 8 + c, { y });
      refresh(true);
    });
    q("reset").addEventListener("click", () => { T.resetToFile(); refresh(true); });
    q("clear").addEventListener("click", () => { T.clearAll(); refresh(true); });
    q("export").addEventListener("click", async () => {
      const text = T.exportJs();
      try {
        await navigator.clipboard.writeText(text);
        msg.textContent = "Скопировано! Вставь целиком в assets/bunny/bunny-tuning.js и сохрани.";
      } catch {
        window.prompt("Скопируй и вставь в assets/bunny/bunny-tuning.js:", text);
      }
    });
  }


  /* ---------- Старт ---------- */

  setupNavigation();
  setupTransitions();
  setupStatusHover();
  setupCounter();
  setupDialogs();
  setupActions();
  setupLinkme();
  Buddy.init();
  setupDevPanel();
  Narrator.init();
  fakeLoad();
})();

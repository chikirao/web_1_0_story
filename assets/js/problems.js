/* =====================================================================
   Слайд 04 «Проблемы»: интерактив
     1. Реклама: при заходе страницу заваливают всплывающие окна
     2. Кракозябры: текст про кодировки ломается при смене кодировки
     3. «Положи трубку»: загрузку обрывает звонок
     4. Браузеры: одна страничка в IE, Netscape и Opera
     5. Почта: фото в 5 МБ не влезает в ящик
   ===================================================================== */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* ---------- 1. Реклама ----------
     Окна появляются по одному. Крестик закрывает окно, «ДА!!!» открывает ещё два,
     через полминуты окна закрываются сами. Внизу кнопка «Закрыть всю рекламу». */

  const ADS = [
    { title: "ПОЗДРАВЛЯЕМ!!!", img: "congrats.gif", text: "Вы <b>1 000 000-й</b> посетитель этого сайта! Нажмите «ДА», чтобы забрать <b>ПРИЗ</b>!", yes: "Забрать приз" },
    { title: "Внимание!", img: "warning.gif", text: "Ваш компьютер работает <b>МЕДЛЕННО</b>! Ускорьте его в 10 раз бесплатно!", yes: "Ускорить" },
    { title: "Работа на дому", img: "money.gif", text: "Заработок <b>$5000</b> в месяц, не выходя из дома! Без вложений!!!", yes: "Хочу!" },
    { title: "Мелодии на телефон", img: "phone.gif", text: "<b>1000</b> полифонических мелодий! Отправь SMS на номер 1121", yes: "Скачать" },
    { title: "Строим коттеджи", img: "builder.gif", text: "Коттеджи под ключ. <b>Дёшево!</b> Звоните прямо сейчас!", yes: "Позвонить" },
    { title: "Вы выиграли!", img: "winner.gif", text: "Вы выиграли <b>мобильный телефон</b>! Осталось заполнить анкету.", yes: "Заполнить" },
    { title: "Панель поиска", img: "search.gif", text: "Установите <b>СуперПанель</b> для своего браузера: 15 новых кнопок!", yes: "Установить" },
    { title: "Горящие туры", img: "hot.gif", text: "Египет за <b>99$</b>!!! Только сегодня! Осталось 2 места!", yes: "Купить" },
  ];
  const MAX_ADS = 14;
  const LIFE = 30000;

  let layer = null;
  let closer = null;
  let next = 0;

  function ensureLayer() {
    if (layer) return;
    layer = document.createElement("div");
    layer.className = "popads";
    closer = document.createElement("button");
    closer.type = "button";
    closer.className = "btn btn--default popads__all";
    closer.addEventListener("click", closeAll);
    document.body.append(layer, closer);
  }

  function updateCloser() {
    const n = layer.children.length;
    closer.textContent = `Закрыть всю рекламу (${n})`;
    closer.hidden = n === 0;
  }

  function spawn() {
    ensureLayer();
    if (layer.children.length >= MAX_ADS) return;
    const ad = ADS[next++ % ADS.length];
    const w = Math.min(320, window.innerWidth - 24);
    const x = 12 + Math.random() * Math.max(0, window.innerWidth - w - 24);
    const y = 12 + Math.random() * Math.max(0, window.innerHeight - 260);
    const win = document.createElement("section");
    win.className = "popad";
    win.style.cssText = `left:${x}px;top:${y}px;width:${w}px`;
    win.setAttribute("aria-label", `Реклама: ${ad.title}`);
    win.innerHTML = `
      <p class="popad__title"><span>${ad.title}</span>
        <button type="button" class="popad__x" aria-label="Закрыть рекламу">×</button></p>
      <div class="popad__body">
        <img src="../assets/ads/${ad.img}" alt="">
        <p>${ad.text}</p>
      </div>
      <p class="popad__btns">
        <button type="button" class="popad__btn popad__btn--yes">${ad.yes}</button>
        <button type="button" class="popad__btn popad__btn--no">Нет, спасибо</button>
      </p>`;
    // крестик и «Нет» закрывают, «Да» по-честному открывает ещё два окна
    win.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      close(win);
      if (b.classList.contains("popad__btn--yes")) { spawn(); spawn(); }
    });
    layer.append(win);
    win._t = setTimeout(() => close(win), LIFE + Math.random() * 5000);
    updateCloser();
  }

  function close(win) {
    clearTimeout(win._t);
    if (!win.isConnected) return;
    win.classList.add("is-closing");
    setTimeout(() => { win.remove(); updateCloser(); }, reduceMotion ? 0 : 160);
  }

  function closeAll() {
    $$(".popad", layer).forEach(close);
  }

  async function storm(count) {
    for (let i = 0; i < count; i++) {
      spawn();
      await wait(reduceMotion ? 50 : 380);
    }
  }

  // при заходе на слайд реклама вылезает сама, на телефоне окон меньше
  setTimeout(() => storm(window.innerWidth < 700 ? 4 : 7), 1400);
  $("[data-ads-again]")?.addEventListener("click", () => storm(6));


  /* ---------- 2. Кракозябры ----------
     Текст «сохранён» в Windows-1251: переводим буквы в байты этой кодировки
     и читаем байты выбранной кодировкой. Ломается по-настоящему, как в браузере. */

  const enc = $("[data-enc]");
  if (enc && "TextDecoder" in window) {
    const box = $("[data-enc-text]", enc);
    const state = $("[data-enc-state]", enc);
    const btns = $$("[data-enc-as]", enc);
    const nodes = [];
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push([walker.currentNode, walker.currentNode.data]);

    // таблица «буква → байт» для Windows-1251
    const toByte = new Map();
    const dec1251 = new TextDecoder("windows-1251");
    for (let b = 128; b < 256; b++) toByte.set(dec1251.decode(new Uint8Array([b])), b);
    const encode = (s) => Uint8Array.from(Array.from(s), (ch) => (ch.charCodeAt(0) < 128 ? ch.charCodeAt(0) : toByte.get(ch) ?? 63));

    const NAMES = {
      "windows-1251": "Windows-1251", "koi8-r": "KOI8-R", "ibm866": "DOS (CP866)",
      "x-mac-cyrillic": "Mac Cyrillic", "windows-1252": "западноевропейской (Latin)", "utf-8": "UTF-8",
    };

    function show(as) {
      let dec;
      try { dec = new TextDecoder(as); } catch { return; }
      btns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.encAs === as)));
      nodes.forEach(([node, text]) => { node.data = as === "windows-1251" ? text : dec.decode(encode(text)); });
      enc.classList.toggle("is-broken", as !== "windows-1251");
      state.textContent = as === "windows-1251"
        ? "Текст сохранён в Windows-1251 и читается в Windows-1251. Всё совпало."
        : `Текст сохранён в Windows-1251, а браузер читает его в ${NAMES[as]}. Латиница цела, русские буквы превратились в мусор.`;
    }
    btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.encAs)));
  }


  /* ---------- 3. «Положи трубку» ----------
     40 минут загрузки за несколько секунд. На 97% звонит телефон, связь рвётся.
     Дальше можно начать заново или докачать программой-докачкой. */

  const dl = $("[data-dl]");
  if (dl) {
    const bar = $("[data-dl-bar]", dl);
    const fill = $("span", bar);
    const doneEl = $("[data-dl-done]", dl);
    const timeEl = $("[data-dl-time]", dl);
    const say = $("[data-dl-say]", dl);
    const btns = $(".dl__btns", dl);
    const SIZE = 12.4;
    const MINUTES = 43;
    let running = false;

    const mb = (v) => v.toFixed(1).replace(".", ",");

    function set(p) {
      fill.style.width = `${p}%`;
      bar.setAttribute("aria-valuenow", Math.round(p));
      doneEl.textContent = `${mb(SIZE * p / 100)} из ${mb(SIZE)} МБ`;
      timeEl.textContent = `Прошло ${Math.round(MINUTES * p / 100)} мин`;
    }

    function buttons(html) {
      btns.innerHTML = html;
    }

    function run(from, to, ms) {
      return new Promise((ok) => {
        const t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          set(from + (to - from) * k);
          if (k < 1) requestAnimationFrame(step); else ok();
        };
        requestAnimationFrame(step);
      });
    }

    async function start() {
      if (running) return;
      running = true;
      dl.classList.remove("is-broken", "is-done", "is-ringing");
      dl.classList.add("is-running");
      buttons("");
      say.textContent = "Качается… Модем пищит, телефон занят, в квартире тишина.";
      await run(0, 97, reduceMotion ? 600 : 6500);
      dl.classList.add("is-ringing");
      say.textContent = "Дзынь! Бабушка в соседней комнате снимает трубку: «Алло? Кто там пищит?»";
      await wait(1800);
      dl.classList.remove("is-ringing", "is-running");
      dl.classList.add("is-broken");
      say.innerHTML = "<b>Соединение разорвано.</b> Скачано 12,0 из 12,4 МБ. Браузер не умеет продолжать: начинай заново.";
      buttons(`<button class="btn" type="button" data-dl-again>Начать заново</button>
               <button class="btn btn--default" type="button" data-dl-resume>Докачать в ReGet</button>`);
      running = false;
    }

    async function resume() {
      if (running) return;
      running = true;
      dl.classList.remove("is-broken");
      buttons("");
      say.textContent = "Перезваниваем провайдеру… ReGet продолжает с того же места.";
      await wait(reduceMotion ? 200 : 1200);
      dl.classList.add("is-running");
      await run(97, 100, reduceMotion ? 200 : 900);
      dl.classList.remove("is-running");
      dl.classList.add("is-done");
      say.innerHTML = "<b>Готово!</b> Можно смотреть трейлер в окошке размером со спичечный коробок.";
      buttons(`<button class="btn" type="button" data-dl-again>Скачать ещё раз</button>`);
      running = false;
    }

    dl.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-dl-start], [data-dl-again]")) start();
      if (ev.target.closest("[data-dl-resume]")) resume();
    });
  }


  /* ---------- 4. Браузеры ---------- */

  const BROWSERS = {
    ie: { title: "Мой сайт - Microsoft Internet Explorer",
      note: "Сайт делали и проверяли в Explorer: бегущая строка едет, меню слева, всё на месте." },
    nn: { title: "Мой сайт - Netscape",
      note: "Netscape 4 не знает <marquee>: строка стоит. Зато мигает <blink>. Стили из CSS он понял наполовину: шапка потеряла цвет, колонки разъехались." },
    op: { title: "Мой сайт - Opera",
      note: "Сайт проверил название браузера и не пустил. Так делали многие, поэтому Opera умела притворяться Explorer'ом." },
  };

  const br = $("[data-br]");
  if (br) {
    const title = $("[data-br-title]", br);
    const note = $("[data-br-note]", br);
    const btns = $$("[data-br-as]", br);
    function show(id) {
      br.dataset.br = id;
      btns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.brAs === id)));
      title.textContent = BROWSERS[id].title;
      note.textContent = BROWSERS[id].note;
    }
    btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.brAs)));
    show("ie");
  }


  /* ---------- 5. Почта ---------- */

  const mail = $("[data-mail]");
  if (mail) {
    const att = $("[data-mail-att]", mail);
    const q = $("[data-mail-q]", mail);
    const quota = $(".mail__quota", mail);
    const bar = $("[data-mail-bar]", mail);
    const fill = $("span", bar);
    const say = $("[data-mail-say]", mail);
    const send = $("[data-mail-send]", mail);
    const jpg = $("[data-mail-jpg]", mail);
    let small = false;
    let busy = false;

    function reset() {
      small = false;
      att.innerHTML = "Вложение: <b>dacha.bmp</b>, 5,2 МБ";
      jpg.disabled = false;
      q.style.width = "61%";
      quota.firstChild.textContent = "Ящик Васи: занято 6,1 из 10 МБ ";
      mail.classList.remove("is-bounced", "is-sent");
    }

    async function progress(ms, minutes) {
      bar.hidden = false;
      const t0 = performance.now();
      return new Promise((ok) => {
        const step = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          fill.style.width = `${k * 100}%`;
          say.textContent = `Отправка… ${Math.round(k * minutes)} мин из ${minutes}`;
          if (k < 1) requestAnimationFrame(step); else ok();
        };
        requestAnimationFrame(step);
      });
    }

    send.addEventListener("click", async () => {
      if (busy) return;
      if (mail.classList.contains("is-bounced") || mail.classList.contains("is-sent")) reset();
      busy = true;
      send.disabled = true;
      if (small) {
        await progress(reduceMotion ? 200 : 1200, 1);
        q.style.width = "64%";
        quota.firstChild.textContent = "Ящик Васи: занято 6,4 из 10 МБ ";
        mail.classList.add("is-sent");
        say.innerHTML = "<b>Письмо доставлено!</b> Фото стало в 17 раз легче и ушло за минуту.";
      } else {
        await progress(reduceMotion ? 300 : 3500, 20);
        q.style.width = "100%";
        mail.classList.add("is-bounced");
        say.innerHTML = "<b>MAILER-DAEMON:</b> письмо не доставлено. Ящик получателя переполнен (quota exceeded). Двадцать минут впустую.";
      }
      bar.hidden = true;
      send.disabled = false;
      send.textContent = "Отправить ещё раз";
      busy = false;
    });

    jpg.addEventListener("click", () => {
      if (busy) return;
      reset();
      small = true;
      jpg.disabled = true;
      att.innerHTML = "Вложение: <b>dacha.jpg</b>, 310 КБ";
      say.textContent = "Пережали в JPEG и уменьшили до 640×480. Качество похуже, зато влезет.";
      send.textContent = "Отправить";
    });
  }
})();

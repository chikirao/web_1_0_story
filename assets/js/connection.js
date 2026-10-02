/* =====================================================================
   Слайд 01 «Подключение»: интерактив страницы.
     1. Плеер со звуком модема и аудиограммой (перемотка по картинке)
     2. Схема звонка: компьютер → модем → линия → АТС → провайдер → интернет,
        подсвечивается по фазам записи
     3. «Снять трубку на кухне»: обрыв связи
     4. Интернет-карта (стереть слой) и счётчик времени в сети
     5. Таблица скоростей и картинка, которая грузится «на модеме»
     6. Словарик в окне «Справки»
   ===================================================================== */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pad2 = (n) => String(Math.floor(n)).padStart(2, "0");
  const mmss = (s) => `${pad2(s / 60)}:${pad2(s % 60)}`;
  const hhmmss = (s) => `${pad2(s / 3600)}:${pad2((s / 60) % 60)}:${pad2(s % 60)}`;


  /* ---------- 1–2. Плеер и схема звонка ---------- */

  const player = $("[data-player]");
  const scene = $("[data-dialscene]");
  const audio = $("[data-audio]");
  if (!player || !scene || !audio) return;

  const wave = $("[data-wave]", player);
  const lit = $("[data-wave-lit]", player);
  const head = $("[data-head]", player);
  const timeEl = $("[data-time]", player);
  const phaseName = $("[data-phase-name]", player);
  const playBtn = $("[data-play]", player);
  const statusText = $("[data-dial-text]", scene);

  const NODES = ["pc", "modem", "phone", "exchange", "isp", "net"];
  const CONNECT_AT = 26.6; // с этого момента в записи модем на связи
  const phases = $$("[data-phases] > li").map((li) => ({
    li,
    start: Number(li.dataset.start),
    end: Number(li.dataset.end),
    node: li.dataset.node,
    title: $("b", li).textContent,
    text: $("button", li).lastChild.textContent.trim(),
  }));

  // Что пишет схема в каждой фазе
  const STATUS = [
    "Модем снял трубку: линия открыта.",
    "В трубке гудок: телефонная станция готова принять номер.",
    "Набор номера провайдера: модем «нажимает кнопки» тонами.",
    "Идёт звонок. У провайдера трубку берёт такой же модем.",
    "Модемы знакомятся: какие стандарты знаешь? V.90? V.34?",
    "Ответный тон 2100 Гц: провайдер отключает на линии эхоподавление.",
    "Проверка линии: насколько она шумит и какие частоты проходят.",
    "Подбор скорости",
    "Соединено на 48 000 бит/с. Можно открывать сайты!",
  ];
  const TRAIN_SPEEDS = [2400, 4800, 9600, 14400, 21600, 28800, 33600, 40000, 44000, 48000];

  let state = "idle"; // idle | calling | online | broken
  let onlineSince = 0;
  let onlineTimer = null;
  const onlineEl = $("[data-online]");

  // отметки фаз на аудиограмме
  const marks = $("[data-marks]", player);
  const DURATION_FALLBACK = 28.6;
  const duration = () => (Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : DURATION_FALLBACK);
  function drawMarks() {
    marks.innerHTML = phases
      .map((p, i) => `<span class="player__mark" style="left:${(p.start / duration()) * 100}%">${i + 1}</span>`)
      .join("");
  }
  drawMarks();
  audio.addEventListener("loadedmetadata", drawMarks);

  function phaseAt(t) {
    let idx = 0;
    phases.forEach((p, i) => { if (t >= p.start) idx = i; });
    return idx;
  }

  function setScene(reachedNode, current) {
    const reached = NODES.indexOf(reachedNode);
    $$(".dialnode", scene).forEach((n) => {
      const i = NODES.indexOf(n.dataset.node);
      n.classList.toggle("is-on", i <= reached);
      n.classList.toggle("is-current", current && i === reached);
    });
    $$(".dialwire", scene).forEach((w) => {
      const i = NODES.indexOf(w.dataset.wire);
      w.classList.toggle("is-on", i + 1 <= reached);
    });
  }

  function setStatus(text, kind) {
    statusText.textContent = text;
    scene.dataset.state = kind || state;
  }

  function render() {
    const t = audio.currentTime;
    const d = duration();
    const k = clamp(t / d, 0, 1);
    lit.style.setProperty("--wave-w", `${wave.clientWidth}px`);
    lit.style.width = `${k * 100}%`;
    head.style.left = `${k * 100}%`;
    timeEl.textContent = mmss(t);
    wave.setAttribute("aria-valuenow", String(Math.round(t)));
    wave.setAttribute("aria-valuetext", mmss(t));

    if (state === "broken") return;
    const started = t > 0.05 || !audio.paused;
    if (!started && state !== "online") {
      phases.forEach((p) => p.li.classList.remove("is-current", "is-done"));
      phaseName.textContent = "Готов к звонку";
      setScene("pc", false);
      return;
    }
    const idx = phaseAt(t);
    const ph = phases[idx];
    phases.forEach((p, i) => {
      p.li.classList.toggle("is-current", i === idx);
      p.li.classList.toggle("is-done", i < idx);
    });
    phaseName.textContent = `${idx + 1}. ${ph.title}`;
    setScene(ph.node, !audio.paused);
    let text = STATUS[idx] || ph.text;
    if (idx === 7) {
      const p = clamp((t - ph.start) / (ph.end - ph.start), 0, 0.999);
      text = `Подбор скорости: ${TRAIN_SPEEDS[Math.floor(p * TRAIN_SPEEDS.length)].toLocaleString("ru-RU")} бит/с…`;
    }
    if (t >= CONNECT_AT) goOnline();
    setStatus(text, t >= CONNECT_AT ? "online" : "calling");
  }

  function loop() {
    render();
    if (!audio.paused) requestAnimationFrame(loop);
  }

  function goOnline() {
    if (state === "online") return;
    state = "online";
    onlineSince = Date.now();
    clearInterval(onlineTimer);
    const tick = () => { onlineEl.textContent = hhmmss((Date.now() - onlineSince) / 1000); };
    tick();
    onlineTimer = setInterval(tick, 1000);
    playBtn.textContent = "▶";
  }

  function hangUp(message) {
    clearInterval(onlineTimer);
    const was = state;
    state = "idle";
    audio.pause();
    audio.currentTime = 0;
    if (was === "online") onlineEl.textContent = `${onlineEl.textContent} (отключился)`;
    render();
    if (message) setStatus(message, "idle");
  }

  function play() {
    if (state === "broken") { state = "idle"; scene.classList.remove("is-broken"); }
    if (audio.ended || audio.currentTime >= duration() - 0.1) audio.currentTime = 0;
    if (audio.currentTime < CONNECT_AT && state === "online") { clearInterval(onlineTimer); state = "idle"; }
    if (state === "idle") state = "calling";
    audio.play().catch(() => setStatus("Браузер не дал включить звук. Нажми ▶ ещё раз.", "idle"));
  }

  playBtn.addEventListener("click", () => { if (audio.paused) play(); else audio.pause(); });
  $("[data-stop]", player).addEventListener("click", () => {
    hangUp(state === "online" ? "Соединение завершено. Модем положил трубку." : "Звонок отменён.");
  });
  $("[data-volume]", player).addEventListener("input", (e) => { audio.volume = Number(e.target.value) / 100; });
  audio.volume = 0.7;

  audio.addEventListener("play", () => {
    playBtn.textContent = "❚❚";
    playBtn.setAttribute("aria-label", "Пауза");
    player.classList.add("is-playing");
    requestAnimationFrame(loop);
  });
  audio.addEventListener("pause", () => {
    playBtn.textContent = "▶";
    playBtn.setAttribute("aria-label", "Играть");
    player.classList.remove("is-playing");
    render();
  });
  audio.addEventListener("ended", render);

  // перемотка по аудиограмме: клик, перетаскивание, стрелки
  function seekTo(clientX) {
    const r = wave.getBoundingClientRect();
    audio.currentTime = clamp((clientX - r.left) / r.width, 0, 1) * duration();
    if (audio.currentTime < CONNECT_AT && state === "online") { clearInterval(onlineTimer); state = "calling"; }
    render();
  }
  wave.addEventListener("pointerdown", (e) => {
    wave.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
    const move = (ev) => seekTo(ev.clientX);
    wave.addEventListener("pointermove", move);
    wave.addEventListener("pointerup", () => wave.removeEventListener("pointermove", move), { once: true });
  });
  wave.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    e.stopPropagation(); // стрелки здесь перематывают, а не листают реплики
    audio.currentTime = clamp(audio.currentTime + (e.key === "ArrowRight" ? 2 : -2), 0, duration());
    render();
  });

  // фазы: клик = перемотать и слушать
  phases.forEach((p) => {
    $("button", p.li).addEventListener("click", () => {
      audio.currentTime = p.start;
      if (p.start < CONNECT_AT && state === "online") { clearInterval(onlineTimer); state = "idle"; }
      play();
    });
  });

  render();


  /* ---------- 3. «Снять трубку на кухне» ---------- */

  const pickupResult = $("[data-pickup-result]");
  $("[data-pickup]").addEventListener("click", () => {
    if (state === "calling" || state === "online" || !audio.paused) {
      clearInterval(onlineTimer);
      audio.pause();
      state = "broken";
      scene.classList.add("is-broken");
      setScene("phone", false);
      setStatus("NO CARRIER. Кто-то снял трубку на кухне, связь оборвалась.", "broken");
      phaseName.textContent = "NO CARRIER";
      phases.forEach((p) => p.li.classList.remove("is-current", "is-done"));
      pickupResult.textContent = "Связь оборвалась! Модему придётся звонить заново.";
      if (onlineEl.textContent.includes(":")) onlineEl.textContent += " (обрыв)";
    } else {
      pickupResult.textContent = "В трубке обычный гудок: линия свободна. Теперь попробуй, когда модем звонит или уже на связи.";
    }
  });


  /* ---------- 4. Интернет-карта ---------- */

  // Слой стирается кругом под курсором, просто водишь мышкой (на телефоне пальцем).
  // Из-под круга вылетают серые крошки. Стёр больше половины: слой осыпается целиком.
  // С клавиатуры: Enter/пробел стирает сразу.
  const scratch = $("[data-scratch]");
  const cover = $(".scratch__cover", scratch);
  const flakes = $(".scratch__flakes", scratch);
  const ctx = cover.getContext("2d", { willReadFrequently: true });
  const BRUSH = 22;            // радиус «монетки», px
  const DONE_AT = 0.55;        // какая доля слоя стёрта, чтобы осыпать остальное
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dpr = 1;
  let last = null;
  let moves = 0;

  function paintCover() {
    const r = cover.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    cover.width = Math.round(r.width * dpr);
    cover.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#d6d6d6";
    ctx.fillRect(0, 0, r.width, r.height);
    ctx.strokeStyle = "#c2c2c2";
    ctx.lineWidth = 3;
    for (let x = -r.height; x < r.width; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, r.height);
      ctx.lineTo(x + r.height, 0);
      ctx.stroke();
    }
    ctx.fillStyle = "#666";
    ctx.font = "bold 13px Geneva, Verdana, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("потри мышкой", r.width / 2, r.height / 2);
  }

  function flake(x, y, burst) {
    if (calm || flakes.childElementCount > 120) return;
    const f = document.createElement("span");
    const s = 4 + Math.random() * 5;
    f.className = "flake";
    f.style.width = `${s}px`;
    f.style.height = `${s * (0.6 + Math.random() * 0.6)}px`;
    flakes.append(f);
    const dx = (Math.random() - 0.5) * (burst ? 160 : 70);
    const up = -(10 + Math.random() * (burst ? 50 : 26));
    const fall = 50 + Math.random() * 70;
    const rot = (Math.random() - 0.5) * 720;
    f.animate([
      { transform: `translate(${x}px, ${y}px) rotate(0) scale(1)`, opacity: 1 },
      { transform: `translate(${x + dx * 0.5}px, ${y + up}px) rotate(${rot * 0.4}deg) scale(.9)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${x + dx}px, ${y + fall}px) rotate(${rot}deg) scale(0)`, opacity: 0 },
    ], { duration: 600 + Math.random() * 500, easing: "cubic-bezier(.3,.5,.6,1)" })
      .onfinish = () => f.remove();
  }

  // доля стёртого: проверяем прозрачность по редкой сетке
  function erasedShare() {
    const { width: w, height: h } = cover;
    const data = ctx.getImageData(0, 0, w, h).data;
    let clear = 0;
    let all = 0;
    for (let y = 2; y < h; y += 6) {
      for (let x = 2; x < w; x += 6) {
        all++;
        if (data[(y * w + x) * 4 + 3] < 40) clear++;
      }
    }
    return clear / all;
  }

  function reveal() {
    if (scratch.classList.contains("is-scratched")) return;
    scratch.classList.add("is-scratched");
    scratch.setAttribute("aria-label", "Логин dial4581, пароль k7m2x9q");
    // остатки слоя осыпаются крошками
    const box = cover.getBoundingClientRect();
    const host = scratch.getBoundingClientRect();
    for (let i = 0; i < 40; i++) {
      flake(box.left - host.left + Math.random() * box.width,
            box.top - host.top + Math.random() * box.height, true);
    }
  }

  // точки слоя (сетка 4px), которые попадут под круг на пути from -> (x, y) и ещё не стёрты
  function coveredAlong(from, x, y) {
    const r = cover.getBoundingClientRect();
    const x0 = Math.max(0, Math.floor(Math.min(from.x, x) - BRUSH));
    const y0 = Math.max(0, Math.floor(Math.min(from.y, y) - BRUSH));
    const x1 = Math.min(r.width, Math.ceil(Math.max(from.x, x) + BRUSH));
    const y1 = Math.min(r.height, Math.ceil(Math.max(from.y, y) + BRUSH));
    if (x1 - x0 < 1 || y1 - y0 < 1) return [];
    const w = Math.round((x1 - x0) * dpr);
    const data = ctx.getImageData(Math.round(x0 * dpr), Math.round(y0 * dpr), w, Math.round((y1 - y0) * dpr)).data;
    const dx = x - from.x;
    const dy = y - from.y;
    const len2 = dx * dx + dy * dy || 1;
    const out = [];
    for (let py = y0; py < y1; py += 4) {
      for (let px = x0; px < x1; px += 4) {
        // расстояние от точки до отрезка пути
        const k = Math.max(0, Math.min(1, ((px - from.x) * dx + (py - from.y) * dy) / len2));
        if (Math.hypot(px - from.x - k * dx, py - from.y - k * dy) > BRUSH) continue;
        const i = (Math.floor((py - y0) * dpr) * w + Math.floor((px - x0) * dpr)) * 4 + 3;
        if (data[i] > 40) out.push({ x: px, y: py });
      }
    }
    return out;
  }

  function scrape(e) {
    if (scratch.classList.contains("is-scratched")) return;
    const r = cover.getBoundingClientRect();
    const host = scratch.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const from = last || { x, y };
    // какие точки слоя ещё целы в полосе от прошлой позиции до новой: из них и полетят крошки
    const live = coveredAlong(from, x, y);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineWidth = BRUSH * 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    const n = Math.min(5, Math.ceil(live.length / 8));
    for (let i = 0; i < n; i++) {
      const p = live[Math.floor(Math.random() * live.length)];
      flake(p.x + r.left - host.left, p.y + r.top - host.top, false);
    }
    last = { x, y };
    if (++moves % 12 === 0 && erasedShare() > DONE_AT) reveal();
  }

  paintCover();
  window.addEventListener("resize", () => {
    if (!scratch.classList.contains("is-scratched")) paintCover();
  });
  scratch.addEventListener("pointermove", scrape);
  scratch.addEventListener("pointerleave", () => { last = null; });
  scratch.addEventListener("click", (e) => {
    if (e.detail === 0) reveal();       // клавиатура: стираем сразу
  });


  /* ---------- 5. Скорость ---------- */

  const FILES = [
    ["Страница с картинками", 100 * 1024],
    ["Фото с цифровой камеры", 600 * 1024],
    ["Песня MP3", 4 * 1024 * 1024],
    ["Фильм на CD", 700 * 1024 * 1024],
  ];
  const SPEEDS = [
    ["28,8k", 28800],
    ["56k (на деле ~45k)", 45000],
    ["ADSL, 2004", 512000],
    ["Сегодня, 100 Мбит/с", 100e6],
  ];
  function human(sec) {
    if (sec < 1) return "мгновенно";
    if (sec < 60) return `${Math.round(sec)} с`;
    if (sec < 3600) return `${Math.round(sec / 60)} мин`;
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    if (h >= 24) return `${Math.floor(h / 24)} дн ${h % 24} ч`;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
  }
  const table = $("[data-speedtable]");
  if (table) {
    table.insertAdjacentHTML("beforeend",
      `<thead><tr><th scope="col">Что качаем</th>${SPEEDS.map(([n], i) =>
        `<th scope="col"${i === 1 ? ' class="is-hot"' : ""}>${n}</th>`).join("")}</tr></thead>` +
      `<tbody>${FILES.map(([name, bytes]) =>
        `<tr><th scope="row">${name}</th>${SPEEDS.map(([, bps], i) =>
          `<td${i === 1 ? ' class="is-hot"' : ""}>${human((bytes * 8) / bps)}</td>`).join("")}</tr>`).join("")}</tbody>`);
  }

  // Картинка 45 КБ «грузится»: сначала мутная (как interlaced GIF), потом проявляется сверху вниз
  const load = $("[data-loadimg]");
  if (load) {
    const frame = $(".loadimg__frame", load);
    const text = $("[data-load-text]", load);
    const bar = $("[data-load-bar]", load);
    const SIZE = 45 * 1024;
    let raf = 0;
    $$("[data-load]", load).forEach((btn) => {
      btn.addEventListener("click", () => {
        cancelAnimationFrame(raf);
        $$("[data-load]", load).forEach((b) => b.classList.toggle("btn--default", b === btn));
        const bps = Number(btn.dataset.load);
        const total = (SIZE * 8) / bps; // секунд «по-настоящему»
        const shown = reduceMotion ? 0.01 : Math.min(total, 14); // на слайде не дольше 14 с
        const t0 = performance.now();
        frame.style.setProperty("--low", "0%");
        frame.style.setProperty("--full", "0%");
        const step = (now) => {
          const k = clamp((now - t0) / 1000 / shown, 0, 1);
          // первые 25% данных: мутный первый проход, дальше строки чёткой картинки
          frame.style.setProperty("--low", `${clamp(k / 0.25, 0, 1) * 100}%`);
          frame.style.setProperty("--full", `${clamp((k - 0.25) / 0.75, 0, 1) * 100}%`);
          bar.style.width = `${k * 100}%`;
          const got = Math.round((SIZE * k) / 1024);
          text.textContent = k < 1
            ? `Загружено ${got} из 45 КБ… осталось ${Math.ceil(total * (1 - k))} с`
            : `Готово! На ${btn.textContent} это заняло ${human(total)}.`;
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      });
    });
  }


  /* ---------- 6. Словарик: окно «Справки» ---------- */

  const help = $("[data-helpwin]");
  if (help) {
    const tabs = $$('[role="tab"]', help);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
    // «См. также» внутри статьи переключает термин
    $$("[data-term]", help).forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        select(document.getElementById(a.dataset.term), true);
      });
    });
  }
})();

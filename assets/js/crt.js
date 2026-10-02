/* =====================================================================
   Пузатый CRT-монитор поверх окна сайта (режим «монитор 2004 года»).

   Взято из заставки игры WEBIVORE (katamari_web/src/crt/CrtScreen.ts,
   монитор в комнате). Там шейдер берёт картинку как текстуру; живую
   страницу в текстуру не превратить, поэтому эффект разделён на две части:
     1. изгиб стекла: SVG-фильтр feDisplacementMap прямо по окну сайта,
        по той же формуле barrel() и overscan, что в шейдере заставки;
     2. стекло: шейдер в двух canvas поверх окна. Нижний умножает (строки
        луча, апертурная решётка, затемнение к краям, стекло утоплено
        в пластик), верхний добавляет свет (отражение лампы, бегущая полоса).
   Строки и тени изогнуты так же, как картинка под ними.

     CRT.attach(el)   плавно включить над элементом
     CRT.detach()     плавно выключить
   ===================================================================== */

window.CRT = (() => {
  "use strict";

  // те же ручки, что screen в settings.ts заставки; строки и решётка мягче,
  // чтобы текст слайда читался на трансляции
  const S = {
    curve: 0.078, overscan: 1.03, lines: 300, scanlines: 0.42, grille: 0.3,
    noise: 0.05, inset: 0.65, insetWidth: 0.05, white: 0.94, falloff: 0.45,
  };
  const FADE = 600;   // мс: столько же, сколько окно сжимается

  const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
  const FRAG = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform vec2 res;
uniform float t, mode, k, curve, overscan, lines, scanAmt, grille, noiseAmt, inset, insetWidth, white, falloff;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec2 barrel(vec2 u){
  vec2 c = u * 2. - 1.;
  c *= 1. + curve * k * dot(c, c) * vec2(.9, 1.15);
  return c * .5 + .5;
}
void main(){
  vec2 su = (barrel(uv) - .5) / mix(1., overscan, k) + .5;
  float inside = step(0., su.x) * step(su.x, 1.) * step(0., su.y) * step(su.y, 1.);
  if (mode < .5) {
    // строки луча (гауссов профиль, как в заставке), идут по изогнутой картинке
    float f = fract(su.y * lines) - .5;
    float beam = exp(-f * f / (2. * .3 * .3));
    vec3 m = vec3(mix(1., beam, scanAmt * k));
    float px = mod(gl_FragCoord.x, 3.);
    vec3 mask = px < 1. ? vec3(1., .72, .72) : px < 2. ? vec3(.72, 1., .72) : vec3(.72, .72, 1.);
    m *= mix(vec3(1.), mask, grille * k);
    m *= 1. - .03 * k * (.5 + .5 * sin(t * 120.));
    m *= 1. - dot(uv - .5, uv - .5) * falloff * k;
    m *= 1. - noiseAmt * k * hash(uv * res + fract(t * 7.));
    // стекло утоплено в пластик: тёмный шов, тень у края, сильнее под верхней кромкой
    vec2 q = abs(uv - .5) * 2.;
    float rr = .07;
    float sd = length(max(q - (1. - rr), 0.)) + min(max(q.x, q.y) - (1. - rr), 0.) - rr;
    float fromEdge = -sd * .5;
    float rim = smoothstep(0., insetWidth, fromEdge);
    float overhang = smoothstep(1. - insetWidth * 2.2, 1., uv.y);
    float seam = smoothstep(.006, 0., fromEdge);
    float shade = mix(1., rim, inset * .75 * k) * (1. - inset * .45 * overhang * k) * (1. - inset * .8 * seam * k);
    m *= shade * mix(1., white, k);
    o = vec4(m * mix(1., inside, k), 1.);
  } else {
    // свет: тёплое отражение лампы в стекле, медленная бегущая полоса, блик
    vec3 l = vec3(.1, .065, .035) * smoothstep(.55, 0., length(uv - vec2(.12, .88))) * 1.2;
    l += vec3(.05) * smoothstep(.12, 0., abs(fract(su.y * .5 - t * .07) - .5)) * inside;
    l += vec3(.06) * smoothstep(.5, 0., length((uv - vec2(.25, .8)) * vec2(1., 1.7)));
    o = vec4(l * k, 1.);
  }
}`;

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let layers = [];
  let target = null;
  let raf = 0;
  let k = 0;            // 0 = плоский экран, 1 = полный эффект
  let goal = 0;
  let lastT = 0;
  let svg = null;

  /* ---------- 1. Изгиб: SVG-фильтр ----------
     Карта смещений у SVG всего 8 бит на канал: одним проходом строки текста
     идут ступеньками по 1–2 px. Поэтому два прохода: грубая карта и карта
     остатка (то, что грубая не досдвинула), вместе точность около 0.01 px.
     Карты строятся в полный размер окна заранее, пока страница простаивает. */

  let maps = null;         // { key, W, H, coarse, fine, s1, s2 }
  let building = "";

  // откуда брать картинку для точки (x, y) окна: barrel + overscan, как в шейдере заставки
  function shift(x, y) {
    const cx = x * 2 - 1;
    const cy = y * 2 - 1;
    const d = cx * cx + cy * cy;
    const sx = (cx * (1 + S.curve * d * 0.9)) * 0.5 / S.overscan + 0.5;
    const sy = (cy * (1 + S.curve * d * 1.15)) * 0.5 / S.overscan + 0.5;
    return [sx - x, sy - y];
  }

  // так feDisplacementMap читает канал: C / 255 - 0.5
  const encode = (v, s) => Math.max(0, Math.min(255, Math.round((v / s + 0.5) * 255)));
  const decode = (c, s) => s * (c / 255 - 0.5);

  // размер окна в режиме монитора: те же формулы, что в .is-crt .desktop (styles.css)
  function finalSize() {
    const el = document.querySelector(".desktop");
    const kk = parseFloat(getComputedStyle(el).getPropertyValue("--k")) || 1;
    return [
      Math.round(Math.min(800, innerWidth - 48) / kk),
      Math.round(Math.min(600, innerHeight - 110) / kk),
    ];
  }

  function toUrl(canvas) {
    return new Promise((ok) => canvas.toBlob((b) => ok(URL.createObjectURL(b)), "image/png"));
  }

  async function buildMaps(W, H) {
    const key = `${W}x${H}`;
    if (maps?.key === key || building === key) return;
    building = key;
    const [mx, my] = shift(1, 1).map(Math.abs);
    const s1 = 2 * Math.max(mx * W, my * H) * 1.02;
    const s2 = (s1 / 255) * 1.1;
    const a = document.createElement("canvas");
    const b = document.createElement("canvas");
    a.width = b.width = W;
    a.height = b.height = H;
    const ia = a.getContext("2d").createImageData(W, H);
    const ib = b.getContext("2d").createImageData(W, H);
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const [dx, dy] = shift((i + 0.5) / W, (j + 0.5) / H);
        const px = dx * W;
        const py = dy * H;
        const p = (j * W + i) * 4;
        const r1 = encode(px, s1);
        const g1 = encode(py, s1);
        ia.data[p] = r1;
        ia.data[p + 1] = g1;
        ia.data[p + 2] = 128;
        ia.data[p + 3] = 255;
        ib.data[p] = encode(px - decode(r1, s1), s2);
        ib.data[p + 1] = encode(py - decode(g1, s1), s2);
        ib.data[p + 2] = 128;
        ib.data[p + 3] = 255;
      }
    }
    a.getContext("2d").putImageData(ia, 0, 0);
    b.getContext("2d").putImageData(ib, 0, 0);
    const [coarse, fine] = await Promise.all([toUrl(a), toUrl(b)]);
    if (building !== key) return;
    if (maps) { URL.revokeObjectURL(maps.coarse); URL.revokeObjectURL(maps.fine); }
    maps = { key, W, H, coarse, fine, s1, s2 };
    building = "";
    if (svg) applyMaps();
  }

  function buildSvg() {
    const ns = "http://www.w3.org/2000/svg";
    svg = document.createElementNS(ns, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    // за краями изогнутой картинки чёрное стекло, а не фон комнаты
    svg.innerHTML = `
      <filter id="crt-barrel" x="0" y="0" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feImage class="crt-map" data-map="coarse" preserveAspectRatio="none" x="0" y="0" result="m1"/>
        <feImage class="crt-map" data-map="fine" preserveAspectRatio="none" x="0" y="0" result="m2"/>
        <feDisplacementMap class="crt-disp" data-s="s1" in="SourceGraphic" in2="m1" scale="0" xChannelSelector="R" yChannelSelector="G" result="b1"/>
        <feDisplacementMap class="crt-disp" data-s="s2" in="b1" in2="m2" scale="0" xChannelSelector="R" yChannelSelector="G" result="bent"/>
        <feFlood flood-color="#050505" result="black"/>
        <feMerge><feMergeNode in="black"/><feMergeNode in="bent"/></feMerge>
      </filter>`;
    document.body.append(svg);
    applyMaps();
  }

  function applyMaps() {
    if (!maps) return;
    svg.querySelectorAll(".crt-map").forEach((img) => img.setAttribute("href", maps[img.dataset.map]));
  }

  function updateFilter() {
    if (!svg || !target) return;
    const w = target.offsetWidth;
    const h = target.offsetHeight;
    svg.querySelectorAll("filter, .crt-map").forEach((el) => {
      el.setAttribute("width", w);
      el.setAttribute("height", h);
    });
    // пока окно сжимается, карта растянута: смещения масштабируем вместе с ней
    const stretch = maps ? w / maps.W : 0;
    svg.querySelectorAll(".crt-disp").forEach((d) => {
      d.setAttribute("scale", maps ? (maps[d.dataset.s] * stretch * k).toFixed(4) : "0");
    });
    target.style.filter = k > 0.001 && maps ? "url(#crt-barrel)" : "";
  }

  // карты готовим заранее и пересчитываем, если поменялся размер экрана
  function prepare() {
    if (!document.querySelector(".desktop")) return;
    const [W, H] = finalSize();
    if (W > 0 && H > 0) buildMaps(W, H);
  }
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
  idle(prepare);
  let resizeT = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(prepare, 400);
  });

  /* ---------- 2. Стекло: шейдер ---------- */

  function makeLayer(mode) {
    const canvas = document.createElement("canvas");
    canvas.className = `crt-layer ${mode ? "crt-light" : "crt-shade"}`;
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return null;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "crt");
      return s;
    };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.bindAttribLocation(prog, 0, "p");
      gl.linkProgram(prog);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    } catch {
      return null;      // нет WebGL2: останется только изгиб
    }
    // canvas прямо в <body>: иначе режимы наложения смешаются с пустой обёрткой
    document.body.append(canvas);
    return { canvas, gl, mode, u: (n) => gl.getUniformLocation(prog, n) };
  }

  function draw(now) {
    raf = 0;
    if (!target) return;
    const dt = lastT ? now - lastT : 16;
    lastT = now;
    k = reduced() ? goal : Math.max(0, Math.min(1, k + Math.sign(goal - k) * dt / FADE));
    updateFilter();
    const r = target.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    for (const L of layers) {
      const { canvas, gl, u } = L;
      const st = canvas.style;
      st.left = `${r.left}px`;
      st.top = `${r.top}px`;
      st.width = `${r.width}px`;
      st.height = `${r.height}px`;
      canvas.classList.toggle("is-on", k > 0.001);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u("res"), w, h);
      gl.uniform1f(u("t"), now / 1000);
      gl.uniform1f(u("mode"), L.mode);
      gl.uniform1f(u("k"), k);
      gl.uniform1f(u("curve"), S.curve);
      gl.uniform1f(u("overscan"), S.overscan);
      // строк столько же, сколько у трубки в заставке, на высоту экрана
      gl.uniform1f(u("lines"), S.lines);
      gl.uniform1f(u("scanAmt"), S.scanlines);
      gl.uniform1f(u("grille"), S.grille);
      gl.uniform1f(u("noiseAmt"), S.noise);
      gl.uniform1f(u("inset"), S.inset);
      gl.uniform1f(u("insetWidth"), S.insetWidth);
      gl.uniform1f(u("white"), S.white);
      gl.uniform1f(u("falloff"), S.falloff);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    if (goal === 0 && k === 0) {
      target.style.filter = "";
      layers.forEach((L) => L.canvas.classList.remove("is-on"));
      target = null;
      lastT = 0;
      return;
    }
    raf = requestAnimationFrame(draw);
  }

  function attach(el) {
    if (!layers.length) layers = [makeLayer(0), makeLayer(1)].filter(Boolean);
    if (!svg) buildSvg();
    if (target && target !== el) target.style.filter = "";
    target = el;
    goal = 1;
    prepare();
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function detach() {
    goal = 0;
    if (target && !raf) raf = requestAnimationFrame(draw);
  }

  return { attach, detach };
})();

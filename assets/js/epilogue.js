/* =====================================================================
   Слайд 06 «Послесловие»: интерактив
     Баннер Sleeper показывает настоящее время и время будильника
     (как калькулятор: +15 минут на засыпание, цикл сна 90 минут)
   ===================================================================== */

(() => {
  "use strict";

  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  document.querySelectorAll("[data-sleeper]").forEach((card) => {
    const now = card.querySelector("[data-sl-now]");
    const rows = Array.from(card.querySelectorAll("[data-sl-cycles]"));

    function tick() {
      const t = new Date();
      now.textContent = fmt(t);
      rows.forEach((el) => {
        const cycles = Number(el.dataset.slCycles);
        el.textContent = fmt(new Date(t.getTime() + (15 + cycles * 90) * 60000));
      });
    }

    tick();
    setInterval(tick, 15000);
  });
})();

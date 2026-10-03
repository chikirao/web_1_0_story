/* Два сравнения: публикация в ленте и на своём сайте, личные сайты двух эпох. */
(() => {
  "use strict";

  function setupTabs(root, selector, choose) {
    const tabs = Array.from(root.querySelectorAll(selector));
    function select(tab, focus = false) {
      tabs.forEach((item) => {
        item.setAttribute("aria-selected", String(item === tab));
        item.tabIndex = item === tab ? 0 : -1;
      });
      choose(tab);
      if (focus) tab.focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        event.stopPropagation();
        select(tabs[next], true);
      });
    });
    select(tabs[0]);
  }

  const post = document.querySelector("[data-post-demo]");
  if (post) {
    const settings = post.querySelector("[data-post-settings]");
    const page = post.querySelector("[data-personal-page]");
    const note = post.querySelector("[data-post-note]");
    setupTabs(post, "[data-post-view]", (tab) => {
      const personal = tab.dataset.postView === "personal";
      post.querySelectorAll("[data-post-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.postPanel !== tab.dataset.postView;
      });
      settings.hidden = !personal;
      note.textContent = personal
        ? "Те же гифки и тот же текст. Здесь автор выбирает фон, расположение, шрифт и соседние разделы."
        : "В ленте автор выбирает содержание публикации. Её оформление и доступные элементы задаёт платформа.";
    });
    settings.addEventListener("change", () => {
      page.dataset.theme = settings.querySelector('[name="post-theme"]:checked').value;
      const decorated = settings.querySelector("[data-post-decor-toggle]").checked;
      page.querySelectorAll("[data-post-decor]").forEach((item) => { item.hidden = !decorated; });
    });
  }

  const era = document.querySelector("[data-era-demo]");
  if (era) {
    const details = era.querySelector("[data-era-details]");
    const toggle = era.querySelector("[data-era-details-toggle]");
    setupTabs(era, "[data-era-view]", (tab) => {
      era.querySelectorAll("[data-era-panel]").forEach((panel) => {
        panel.hidden = panel.id !== tab.getAttribute("aria-controls");
      });
    });
    toggle.addEventListener("click", () => {
      details.hidden = !details.hidden;
      toggle.setAttribute("aria-expanded", String(!details.hidden));
      toggle.textContent = details.hidden ? "Что сохранилось, что изменилось?" : "Свернуть пояснение";
    });
  }
})();

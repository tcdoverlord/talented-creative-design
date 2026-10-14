(() => {
  const buttons = [...document.querySelectorAll(".category-filter")];
  const cards = [...document.querySelectorAll("#guide-library .guide-card")];
  const title = document.querySelector("#guide-list-title");
  const count = document.querySelector("#guide-count");
  const empty = document.querySelector("#guide-empty");
  const params = new URLSearchParams(location.search);
  const labels = {
    all: "All Guides", cam: "Cam Guides", hardware: "Tech Hardware Guides",
    software: "Tech Software Guides", streaming: "Streaming & OBS Guides",
    ai: "AI & Automation Guides", windows: "Windows & PC Guides",
    homelab: "Raspberry Pi & Home Lab", security: "Security & Privacy Guides",
    buying: "Buying Guides", troubleshooting: "Troubleshooting & Fixes",
    creator: "Creator Tools & Platforms"
  };
  function selectCategory(category) {
    if (!labels[category]) category = "all";
    let shown = 0;
    cards.forEach(card => {
      const match = category === "all" || (card.dataset.category || "").split(/\s+/).includes(category);
      card.hidden = !match;
      if (match) shown++;
    });
    buttons.forEach(button => {
      const active = button.dataset.category === category;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    title.textContent = labels[category];
    count.textContent = `${shown} ${shown === 1 ? "topic" : "topics"} shown`;
    empty.hidden = shown !== 0;
    const url = new URL(location.href);
    if (category === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", category);
    history.replaceState({}, "", url);
  }
  buttons.forEach(button => button.addEventListener("click", () => selectCategory(button.dataset.category)));
  selectCategory(params.get("category") || "all");
})();

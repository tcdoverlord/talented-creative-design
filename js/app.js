/* Talented Creative Design starter — edit the sample data before launch. */
const products = [
  {
    id: "dji-mic-mini",
    title: "DJI Mic Mini + OBS Studio",
    category: "Streaming",
    icon: "♫",
    summary: "A review and setup guide covering connection, audio workflow, strengths, and limitations.",
    status: "Article to write",
    href: "guides.html",
    featured: true
  },
  {
    id: "obs-audio",
    title: "Improve Your OBS Microphone Audio",
    category: "Streaming",
    icon: "≋",
    summary: "A practical walkthrough of gain, noise suppression, compression, and limiter settings.",
    status: "Tutorial outline",
    href: "guides.html",
    featured: true
  },
  {
    id: "raspberry-pi",
    title: "Raspberry Pi 5 Home Lab",
    category: "Computing",
    icon: "⌘",
    summary: "Plan storage, cooling, power, and accessories around the server you actually need.",
    status: "Guide outline",
    href: "guides.html",
    featured: true
  },
  {
    id: "budget-streaming",
    title: "Build a Budget Streaming Setup",
    category: "Creative Tools",
    icon: "✦",
    summary: "Prioritize useful essentials and compare options before buying extra equipment.",
    status: "Buying guide outline",
    href: "guides.html",
    featured: false
  },
  {
    id: "usb-vs-wireless",
    title: "USB vs. Wireless Microphones",
    category: "Streaming",
    icon: "♫",
    summary: "Compare convenience, use cases, compatibility, and cost for different creator setups.",
    status: "Comparison outline",
    href: "guides.html",
    featured: false
  },
  {
    id: "creator-accessories",
    title: "Useful Creator Desk Accessories",
    category: "Creative Tools",
    icon: "▦",
    summary: "A future roundup of accessories that solve real workspace or workflow problems.",
    status: "Collection to build",
    href: "guides.html",
    featured: false
  }
];

function productCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  article.innerHTML = `
    <div class="product-art" aria-hidden="true"><span>${product.icon}</span></div>
    <div class="product-body">
      <span class="product-kicker">${escapeHTML(product.category)}</span>
      <h3>${escapeHTML(product.title)}</h3>
      <p>${escapeHTML(product.summary)}</p>
      <div class="product-foot">
        <span class="status-tag">${escapeHTML(product.status)}</span>
        <a class="text-link" href="${escapeAttribute(product.href)}">Explore <span aria-hidden="true">→</span></a>
      </div>
    </div>`;
  return article;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function escapeAttribute(value) { return escapeHTML(value); }

const featured = document.querySelector("#featured-products");
if (featured) products.filter(p => p.featured).forEach(p => featured.append(productCard(p)));

const allProducts = document.querySelector("#all-products");
if (allProducts) {
  const search = document.querySelector("#product-search");
  const category = document.querySelector("#category-filter");
  const count = document.querySelector("#results-count");
  const empty = document.querySelector("#empty-state");
  const params = new URLSearchParams(location.search);
  if (params.has("category")) category.value = params.get("category");
  function render() {
    const term = search.value.trim().toLowerCase();
    const selected = category.value;
    const filtered = products.filter(p =>
      (selected === "All" || p.category === selected) &&
      `${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(term)
    );
    allProducts.replaceChildren(...filtered.map(productCard));
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "item" : "items"} · Sample editorial pipeline`;
    empty.hidden = filtered.length !== 0;
    allProducts.hidden = filtered.length === 0;
  }
  search.addEventListener("input", render);
  category.addEventListener("change", render);
  render();
}

const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#primary-nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("open", !open);
  });
  nav.addEventListener("click", event => {
    if (event.target.closest("a")) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    }
  });
}
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

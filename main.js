const header = document.querySelector(".site-header");
const btn = header.querySelector(".nav-toggle");
btn.addEventListener("click", () => {
  const open = header.classList.toggle("open");
  btn.setAttribute("aria-expanded", open ? "true" : "false");
});

const onScroll = () => {
  header.classList.toggle("scrolled", window.scrollY > 6);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Format price inputs as the user types; keep digits in query.
const priceInputs = ["#sl-min", "#sl-max"].map((sel) =>
  document.querySelector(sel)
);

function formatMoney(v) {
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return "";
  return "$" + Number(digits).toLocaleString();
}

priceInputs.forEach((inp) => {
  if (!inp) return;
  inp.addEventListener("input", () => {
    const caretEnd = inp.selectionEnd;
    const digits = inp.value.replace(/[^\d]/g, "");
    const formatted = formatMoney(inp.value);
    inp.value = formatted;
    // Try to keep caret near end (simple fix for most cases)
    inp.setSelectionRange(formatted.length, formatted.length);
  });
  // Ensure clean numbers go in querystring
  inp.form?.addEventListener("submit", (e) => {
    const raw = inp.value.replace(/[^\d]/g, "");
    if (raw) {
      // temporarily set the input to raw digits so ?price_min=200000
      inp.value = raw;
      setTimeout(() => (inp.value = formatMoney(raw)), 0);
    }
  });
});

// Guard: min should not exceed max
document.querySelector(".search-grid")?.addEventListener("submit", (e) => {
  const minEl = document.querySelector("#sl-min");
  const maxEl = document.querySelector("#sl-max");
  const min = Number((minEl?.value || "").replace(/[^\d]/g, "")) || 0;
  const max = Number((maxEl?.value || "").replace(/[^\d]/g, "")) || 0;
  if (min && max && min > max) {
    e.preventDefault();
    alert("Min price cannot be greater than max price.");
    minEl?.focus();
  }
});

(function () {
  const links = Array.from(document.querySelectorAll(".gallery-link"));
  const lb = document.querySelector(".lightbox");
  const lbImg = lb.querySelector(".lb-img");
  const lbCap = lb.querySelector(".lb-caption");
  const btnClose = lb.querySelector(".lb-close");
  const btnPrev = lb.querySelector(".lb-prev");
  const btnNext = lb.querySelector(".lb-next");

  let index = -1;
  let lastFocus = null;

  function openAt(i) {
    index = i;
    const link = links[index];
    lbImg.src = link.dataset.full;
    lbImg.alt = link.querySelector("img").alt || "";
    lbCap.textContent = link.dataset.caption || "";
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    lastFocus = document.activeElement;
    btnClose.focus();
    document.body.style.overflow = "hidden";
  }

  function close() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    lbImg.src = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  function next() {
    openAt((index + 1) % links.length);
  }
  function prev() {
    openAt((index - 1 + links.length) % links.length);
  }

  links.forEach((link, i) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openAt(i);
    });
    link.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openAt(i);
      }
    });
  });

  btnClose.addEventListener("click", close);
  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);

  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });

  window.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });
})();

function renderListings(reset = false) {
  if (reset) {
    listingGrid.innerHTML = "";
    page = 0;
  }
  const start = page * size;
  const items = dataListings.slice(start, start + size);

  items.forEach((item) => {
    const li = document.createElement("li");

    // Article
    const card = document.createElement("article");
    card.className = "listing-card";
    card.dataset.id = item.id;

    // Media
    const fig = document.createElement("figure");
    fig.className = "listing-media";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = `Photo of ${item.address}`;
    img.src = item.img || FALLBACK_IMG;
    img.onerror = () => {
      if (img.src !== FALLBACK_IMG) img.src = FALLBACK_IMG;
    };
    // Tiny inline SVG so there's no external dependency
    const FALLBACK_IMG =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stop-color="#1b1f27"/>
        <stop offset="1" stop-color="#0f1115"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g fill="#6ee7b7" opacity="0.9" transform="translate(320 210)">
      <path d="M-160 20 v-70 l160-120 l160 120 v70 h-80 v-80 h-160 v80z"/>
      <rect x="-30" y="30" width="60" height="70" rx="6" fill="#d9ffe9" opacity="0.85"/>
    </g>
    <text x="50%" y="85%" text-anchor="middle" fill="#a4aab6" font-size="24" font-family="system-ui, Poppins, Arial">Photo coming soon</text>
  </svg>`);

    // Badges
    const badges = document.createElement("div");
    badges.className = "badges";
    (item.badges || []).forEach((b) => {
      const s = document.createElement("span");
      s.className = "badge" + (b === "Open House" ? " alt" : "");
      s.textContent = b;
      badges.appendChild(s);
    });

    // Favorite
    const fav = document.createElement("button");
    fav.className = "fav";
    fav.type = "button";
    fav.title = "Save listing";
    fav.setAttribute("aria-label", "Save listing");
    fav.textContent = "♥";
    fav.addEventListener("click", () => {
      fav.classList.toggle("active");
      fav.setAttribute("aria-pressed", fav.classList.contains("active"));
    });

    fig.append(img, badges, fav);

    // Body
    const body = document.createElement("div");
    body.className = "listing-body";

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = item.price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

    const addr = document.createElement("div");
    addr.className = "addr";
    addr.textContent = item.address;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span title="Bedrooms">🛏 ${item.beds} bd</span>
      <span title="Bathrooms">🛁 ${item.baths} ba</span>
      <span title="Square Feet">📐 ${item.sqft.toLocaleString()} sqft</span>
    `;

    body.append(price, addr, meta);
    card.append(fig, body);
    li.append(card);
    listingGrid.appendChild(li);
  });

  page++;
  loadMoreBtn.style.display = page * size >= dataListings.length ? "none" : "";
}

const dataListings = [
  {
    id: 1,
    price: 489000,
    address: "1234 Ridgeview Ct, Pahrump, NV",
    beds: 3,
    baths: 2,
    sqft: 2140,
    badges: ["New"],
    img: "https://api-trestle.corelogic.com/trestle/Media/Property/PHOTO-Jpeg/1061915345/1/MzczLzE5MTEvMjA/MjAvNjg5NS8xNzU1Nzk3NTY0/Ty8bCbbWUylVse_uCreKMoOcy9T0OjyJ3TXgsopYsdE",
  },
  {
    id: 2,
    price: 739000,
    address: "88 Mountain Falls Dr, Pahrump, NV",
    beds: 4,
    baths: 3,
    sqft: 3120,
    badges: ["Open House"],
    img: "https://api-trestle.corelogic.com/trestle/Media/Property/PHOTO-Jpeg/1127155875/1/MzczLzE5MTEvMjA/MjAvNjg5NS8xNzU2OTU0MjQz/sFBqXcjleCeXM1N-apTM1qHCW08vLN24EeG-QgDNb8k",
  },
  {
    id: 3,
    price: 289000,
    address: "510 Desert Bloom Ave, Pahrump, NV",
    beds: 2,
    baths: 2,
    sqft: 1420,
    badges: ["Price Drop"],
    img: "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 4,
    price: 615000,
    address: "200 Spring Mountain Rd, Pahrump, NV",
    beds: 4,
    baths: 3,
    sqft: 2780,
    badges: ["New", "Pool"],
    img: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 5,
    price: 359000,
    address: "41 Sand Dune Ln, Pahrump, NV",
    beds: 3,
    baths: 2,
    sqft: 1680,
    badges: [],
    img: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 6,
    price: 925000,
    address: "9 Whispering Mesa Ct, Pahrump, NV",
    beds: 5,
    baths: 4,
    sqft: 3980,
    badges: ["Luxury"],
    img: "https://api-trestle.corelogic.com/trestle/Media/Property/PHOTO-Jpeg/1120187439/1/MzczLzE5MTEvMjA/MjAvNjg5NS8xNzU0MDAxMTE1/H_8orSY9cYD-zsvWM3SL72_UvqAdyXhPEU27YPbxCVc",
  },
];

const listingGrid = document.getElementById("listingGrid");
const loadMoreBtn = document.getElementById("loadMoreBtn");
let page = 0,
  size = 3;

function fmtPrice(num) {
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function renderListings(reset = false) {
  if (reset) {
    listingGrid.innerHTML = "";
    page = 0;
  }
  const start = page * size;
  const items = dataListings.slice(start, start + size);

  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <article class="listing-card" data-id="${item.id}">
        <figure class="listing-media">
          <img src="${item.img}" alt="Photo of ${
      item.address
    }" loading="lazy" />
          <div class="badges">
            ${item.badges
              .map(
                (b) =>
                  `<span class="badge ${
                    b === "Open House" ? "alt" : ""
                  }">${b}</span>`
              )
              .join("")}
          </div>
          <button class="fav" aria-label="Save listing" title="Save listing">♥</button>
        </figure>
        <div class="listing-body">
          <div class="price">${fmtPrice(item.price)}</div>
          <div class="addr">${item.address}</div>
          <div class="meta">
            <span title="Bedrooms">🛏 ${item.beds} bd</span>
            <span title="Bathrooms">🛁 ${item.baths} ba</span>
            <span title="Square Feet">📐 ${item.sqft.toLocaleString()} sqft</span>
          </div>
        </div>
      </article>
    `;
    listingGrid.appendChild(li);
  });

  page++;
  if (page * size >= dataListings.length) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "";
  }
}

// Favorite toggle (event delegation)
listingGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".fav");
  if (!btn) return;
  btn.classList.toggle("active");
  btn.setAttribute("aria-pressed", btn.classList.contains("active"));
});

// Load initial + more
renderListings();
loadMoreBtn?.addEventListener("click", () => renderListings());

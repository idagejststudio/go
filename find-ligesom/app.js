const apiBase = new URLSearchParams(location.search).get("api") ||
  (["localhost", "127.0.0.1"].includes(location.hostname) && location.port !== "8787"
    ? "http://localhost:8787/api"
    : "/api");
const fallbackCovers = "../design-system-reference/assets/";
const preferences = [
  ["humor", "Humoren", "humoren"],
  ["spænding", "Spændingen", "spændingen"],
  ["eventyr", "Eventyret", "eventyret"],
  ["venskab", "Venskabet", "venskabet"],
  ["fantasy", "Den magiske verden", "den magiske verden"],
  ["illustrationer", "Tegningerne", "tegningerne"],
  ["dyr", "Dyrene", "dyrene"],
];
const popularUniverses = [
  {
    query: "Harry Potter",
    label: "Harry Potter",
    title: "Harry Potter og De Vises Sten",
    coverUrl: "https://fbiinfo-present.dbc.dk/images/P-3GKMRrSD2B9VGeQD7lUQ/120px!AQxApiunQgqPUYgxll-Fm-maexDb3xixBHyxDFVxh0zxww",
  },
  {
    query: "Ternet Ninja",
    label: "Ternet Ninja",
    title: "Ternet Ninja",
    coverUrl: "https://fbiinfo-present.dbc.dk/images/twfTHgJhSdKKKIj8FjAGcw/120px!AQwURtkom4sQH-TNPrjA1vEChOBaTbSjxamm6UFolYvzyw",
  },
  {
    query: "Pippi Langstrømpe",
    label: "Pippi Langstrømpe",
    title: "Pippi Langstrømpe går om bord",
    coverUrl: "https://fbiinfo-present.dbc.dk/images/jqli-S7CT6KYYsH__ZQwXg/120px!AQxYIDqX3r4QJFGuD6a0SMKjf6xLvDRIUi6JV9KU7v_IOw",
  },
  {
    query: "Minecraft",
    label: "Minecraft",
    title: "Zombiekamp i Minecraft 4",
    coverUrl: "https://fbiinfo-present.dbc.dk/images/7aVdZ8KARdaIDm5KBpq0tQ/120px!AQyfWdu-nwRFFRSbRsVSEo3fH1D_J9Hq3BpD9mPBW0hnBQ",
  },
];
const suggestionBox = document.querySelector("[data-suggestions]");
const searchInput = document.querySelector("[data-search]");
const pickedBox = document.querySelector("[data-picked]");
const nextButton = document.querySelector("[data-next]");
const backButton = document.querySelector("[data-back]");
const title = document.querySelector("[data-title]");
const stepLabel = document.querySelector("[data-step-label]");
let selectedBook = null;
let selectedPreferences = new Set();
let currentStep = 1;
let displayedBooks = [];
let displayedTotal = null;
let searchRequest = 0;
let recommendationRequest = 0;
let selectionRequest = 0;
let searchTimer;
let searchController;
let selectionController;

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

function coverUrl(book) {
  return book.coverUrl || (book.cover ? `${fallbackCovers}${book.cover}` : "");
}

function bookCard(book) {
  const image = coverUrl(book);
  const meta = [book.author, book.age ? `Alder ${book.age}` : "", book.format === "AUDIO_BOOK_ONLINE" ? "Lydbog" : "E-bog"]
    .filter(Boolean).join(" · ");
  return `${image ? `<img src="${escapeHtml(image)}" alt="Forside til ${escapeHtml(book.title)}" loading="lazy"/>` : ""}<span><strong>${escapeHtml(book.title || "Titel mangler")}</strong><small>${escapeHtml(meta)}</small></span>`;
}

function showMessage(message, className = "no-suggestions") {
  suggestionBox.innerHTML = `<p class="${className}" role="status">${escapeHtml(message)}</p>`;
  suggestionBox.hidden = false;
}

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "GO-kataloget kunne ikke nås.");
  return payload;
}

function renderSearchResults(books) {
  displayedBooks = books;
  suggestionBox.innerHTML = books.length
    ? `<p class="catalog-count">${books.length} digitale muligheder${displayedTotal ? ` blandt ${displayedTotal} katalogresultater` : ""}</p>${books.slice(0, 8).map((book, index) => `<button class="suggestion-option" type="button" data-suggestion="${index}">${bookCard(book)}</button>`).join("")}`
    : `<p class="no-suggestions">Vi fandt ikke digitale bøger eller lydbøger med den søgning. Prøv et andet ord.</p>`;
  suggestionBox.hidden = false;
  suggestionBox.querySelectorAll("[data-suggestion]").forEach((button) => {
    button.addEventListener("click", () => selectBook(displayedBooks[Number(button.dataset.suggestion)]));
  });
}

async function searchBooks(query) {
  const normalized = query.trim();
  const request = ++searchRequest;
  searchController?.abort();
  if (!normalized) {
    suggestionBox.hidden = true;
    return;
  }
  if (normalized.length < 2) {
    showMessage("Skriv mindst to bogstaver for at søge i kataloget.");
    return;
  }
  searchController = new AbortController();
  showMessage("Søger i eReolen GO…");
  try {
    // Search only returns catalogue items whose age metadata has been checked
    // against the experience's target age range.
    const result = await api(`/search?q=${encodeURIComponent(normalized)}`, { signal: searchController.signal });
    if (request !== searchRequest) return;
    displayedTotal = result.total;
    renderSearchResults(result.results || []);
  } catch {
    if (request === searchRequest) showMessage("GO-kataloget svarer ikke lige nu. Prøv igen om lidt.");
  }
}

async function selectBook(book) {
  if (!book) return;
  const request = ++selectionRequest;
  selectionController?.abort();
  selectionController = new AbortController();
  suggestionBox.querySelectorAll("[data-suggestion]").forEach((button) => { button.disabled = true; });
  showMessage("Henter bogoplysninger…");
  try {
    const details = await api(`/work?id=${encodeURIComponent(book.id)}&type=${encodeURIComponent(book.format || "EBOOK")}`, { signal: selectionController.signal });
    if (request !== selectionRequest) return;
    selectedBook = { ...book, ...details };
    searchInput.value = book.title;
    suggestionBox.hidden = true;
    showStep(2);
    title.focus({ preventScroll: true });
  } catch (error) {
    if (request !== selectionRequest || error.name === "AbortError") return;
    if (error.message.includes("aldersgruppen")) {
      renderSearchResults(displayedBooks.filter((candidate) => candidate.id !== book.id));
      return;
    }
    renderSearchResults(displayedBooks);
    const notice = document.createElement("p");
    notice.className = "no-suggestions";
    notice.setAttribute("role", "status");
    notice.textContent = "Vi kunne ikke hente bogens oplysninger. Prøv at vælge den igen.";
    suggestionBox.prepend(notice);
  }
}

function renderPopularUniverses() {
  document.querySelector("[data-popular]").innerHTML = popularUniverses.map(({ query, label, title: bookTitle, coverUrl: image }) =>
    `<button class="popular-universe" type="button" data-query="${escapeHtml(query)}" aria-label="Søg efter bøger fra ${escapeHtml(label)}"><span class="universe-cover"><img src="${escapeHtml(image)}" alt="Forside til ${escapeHtml(bookTitle)}" loading="lazy" /></span><span class="universe-name">${escapeHtml(label)}</span></button>`).join("");
  document.querySelectorAll("[data-query]").forEach((button) => button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    searchBooks(button.dataset.query);
    searchInput.focus();
  }));
}

function renderPreferences() {
  document.querySelector("[data-preferences]").innerHTML = preferences.map(([key, label]) =>
    `<button type="button" class="preference-choice" aria-pressed="false" data-like="${key}">${escapeHtml(label)}</button>`).join("");
  document.querySelectorAll(".preference-choice").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.like;
    const isSelected = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isSelected));
    if (isSelected) selectedPreferences.delete(key); else if (selectedPreferences.size < 3) selectedPreferences.add(key);
    if (selectedPreferences.size >= 3) document.querySelectorAll(".preference-choice:not([aria-pressed='true'])").forEach((choice) => { choice.disabled = true; });
    else document.querySelectorAll(".preference-choice").forEach((choice) => { choice.disabled = false; });
    nextButton.disabled = selectedPreferences.size === 0;
  }));
}

function showStep(step) {
  currentStep = step;
  const sections = document.querySelectorAll("[data-step]");
  sections.forEach((section) => {
    section.hidden = Number(section.dataset.step) !== step;
    section.classList.remove("step-enter");
  });
  const activeSection = document.querySelector(`[data-step="${step}"]`);
  if (activeSection && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    void activeSection.offsetWidth;
    activeSection.classList.add("step-enter");
    activeSection.addEventListener("animationend", () => activeSection.classList.remove("step-enter"), { once: true });
  }
  backButton.hidden = step === 1;
  nextButton.hidden = step === 3;
  if (step === 1) {
    title.textContent = "Find noget ligesom";
    stepLabel.textContent = "Søg i eReolen GO";
    nextButton.textContent = "Næste";
    nextButton.disabled = !selectedBook;
  } else if (step === 2) {
    title.textContent = "Hvad kunne du godt lide?";
    stepLabel.textContent = "Trin 2 af 3";
    document.querySelector("[data-selected-summary]").innerHTML = `<div class="selected-work">${bookCard(selectedBook)}<p>${escapeHtml(selectedBook.description || "")}</p><div class="book-tags">${[...(selectedBook.genres || []), ...(selectedBook.subjects || []).slice(0, 3)].map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div></div>`;
    nextButton.textContent = "Find bøger";
    nextButton.disabled = selectedPreferences.size === 0;
  } else {
    title.textContent = "Vi har fundet bøger til dig";
    stepLabel.textContent = "Dine anbefalinger fra GO";
    backButton.textContent = "Prøv igen";
    renderResults();
  }
  if (step === 2) backButton.textContent = "Tilbage";
}

async function renderResults() {
  const request = ++recommendationRequest;
  const likes = [...selectedPreferences];
  const likedText = likes.map((key) => preferences.find(([id]) => id === key)?.[2]).filter(Boolean);
  const likedCopy = likedText.length < 2 ? likedText[0] : `${likedText.slice(0, -1).join(", ")} og ${likedText.at(-1)}`;
  document.querySelector("[data-recommendation-copy]").innerHTML = `Hvis du kunne lide <strong>${escapeHtml(likedCopy)}</strong> i <strong>${escapeHtml(selectedBook.title)}</strong>, tror vi, du vil kunne lide…`;
  const container = document.querySelector("[data-recommendations]");
  container.innerHTML = `<p class="results-loading" role="status">Vi leder i eReolen GO efter bøger og lydbøger til dig…</p>`;
  try {
    const payload = await api(`/recommend?id=${encodeURIComponent(selectedBook.id)}&type=${encodeURIComponent(selectedBook.format || "EBOOK")}&likes=${encodeURIComponent(likes.join(","))}`);
    if (request !== recommendationRequest) return;
    const recommendations = payload.results || [];
    document.querySelector("[data-catalog-note]").textContent = `${recommendations.length} forslag fundet i GO’s digitale katalog ud fra dine valg.`;
    container.innerHTML = recommendations.length
      ? recommendations.map((book) => `<article class="recommendation-card"><div class="recommendation-content"><div class="cover">${coverUrl(book) ? `<img src="${escapeHtml(coverUrl(book))}" alt="Forside til ${escapeHtml(book.title)}" loading="lazy"/>` : "<span class='missing-cover'>GO</span>"}</div><strong class="book-title">${escapeHtml(book.title)}</strong><span class="book-author">${escapeHtml([book.author, book.age ? `Alder ${book.age}` : "", book.format === "AUDIO_BOOK_ONLINE" ? "Lydbog" : "E-bog"].filter(Boolean).join(" · "))}</span><span class="match-reason">${escapeHtml(book.reason || "Et fund fra GO-kataloget")}</span></div><button class="save-book" type="button" aria-label="Gem ${escapeHtml(book.title)}" aria-pressed="false">♡</button></article>`).join("")
      : `<p class="results-empty">Vi fandt ikke et godt match denne gang. Prøv igen med en anden bog eller nogle andre valg.</p>`;
    document.querySelectorAll(".save-book").forEach((button) => button.addEventListener("click", () => {
      const saved = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!saved));
      button.textContent = saved ? "♡" : "♥";
    }));
  } catch {
    if (request !== recommendationRequest) return;
    container.innerHTML = `<p class="results-empty">Vi kan ikke hente forslag fra GO lige nu. Prøv igen om lidt.</p>`;
  }
}

renderPopularUniverses();
renderPreferences();
document.querySelector("[data-search-form]").addEventListener("submit", (event) => { event.preventDefault(); searchBooks(searchInput.value); });
searchInput.addEventListener("input", () => {
  searchRequest += 1;
  searchController?.abort();
  selectionRequest += 1;
  selectionController?.abort();
  if (selectedBook && searchInput.value.trim() !== selectedBook.title) {
    selectedBook = null;
    pickedBox.hidden = true;
    pickedBox.innerHTML = "";
    nextButton.disabled = true;
  }
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => searchBooks(searchInput.value), 250);
});
document.addEventListener("click", (event) => { if (!event.target.closest(".book-search-wrap")) suggestionBox.hidden = true; });
nextButton.addEventListener("click", () => { if (currentStep === 1 && selectedBook) showStep(2); else if (currentStep === 2 && selectedPreferences.size) showStep(3); });
function resetFlow() {
  searchRequest += 1;
  recommendationRequest += 1;
  selectionRequest += 1;
  searchController?.abort();
  selectionController?.abort();
  clearTimeout(searchTimer);
  selectedBook = null;
  selectedPreferences.clear();
  searchInput.value = "";
  pickedBox.hidden = true;
  pickedBox.innerHTML = "";
  suggestionBox.hidden = true;
  document.querySelectorAll(".preference-choice").forEach((button) => { button.setAttribute("aria-pressed", "false"); button.disabled = false; });
  showStep(1);
}
backButton.addEventListener("click", () => currentStep === 3 ? resetFlow() : showStep(currentStep - 1));

const background = document.querySelector(".page-backdrop");
const backgroundFrame = document.querySelector(".page-backdrop iframe");
function closeFeature() {
  document.body.classList.add("is-closed");
  background.setAttribute("aria-hidden", "false");
  backgroundFrame.contentWindow?.postMessage({ type: "focus-find-ligesom-trigger" }, "*");
}
function openFeature() {
  document.body.classList.remove("is-closed");
  background.setAttribute("aria-hidden", "true");
  document.querySelector("[data-close]").focus();
}
document.querySelector("[data-close]").addEventListener("click", closeFeature);
document.querySelector("[data-scrim]").addEventListener("click", closeFeature);
window.addEventListener("message", (event) => {
  if (event.source === backgroundFrame.contentWindow && event.data?.type === "open-find-ligesom") openFeature();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeFeature(); });

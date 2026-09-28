const apiBase = location.protocol === "file:" ? "http://localhost:8787/api" : "/api";
const goSearchBase = "https://go.bibliotek.kk.dk/search?q=";
const seedQueries = ["venskab", "eventyr", "mystik", "humor", "fantasy", "spænding"];
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

let round = 0, batches = [], removedByRound = [], roundSurvivors = [], finalCandidates = [], matchRemoved = new Set(), savedBooks = new Map(), wishlistedIds = new Set(), seenIds = new Set(), rejectedIds = new Set(), currentScreen = "intro", loadRequest = 0, savedReturnScreen = "choices";
const workDetails = new Map();

async function api(path) {
  const response = await fetch(`${apiBase}${path}`);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "GO-kataloget kunne ikke nås");
  return body;
}
const bookKey = (book) => book.id || `${book.title}|${book.author}`;
const formatLabel = (book) => book.format === "AUDIO_BOOK_ONLINE" ? "Lydbog" : "E-bog";
const bookMeta = (book) => [book.author, book.age ? `Alder ${book.age}` : "", formatLabel(book)].filter(Boolean).join(" · ");
const cover = (book) => book.coverUrl ? `<img src="${escapeHtml(book.coverUrl)}" alt="Forside til ${escapeHtml(book.title)}" loading="lazy">` : `<span class="missing-cover" aria-label="Forside mangler">GO!</span>`;
const pageCount = (book) => Number.isFinite(Number(book.pages)) && Number(book.pages) > 0 ? Number(book.pages) : [...bookKey(book)].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 201, 0) + 50;
const exclusionCount = () => removedByRound.reduce((sum, set) => sum + set.size, 0) + matchRemoved.size;
const countLabel = (count) => `${count} ${count === 1 ? "bog" : "bøger"} fravalgt`;

function show(name) {
  currentScreen = name;
  document.querySelectorAll("[data-screen]").forEach((section) => { section.hidden = section.dataset.screen !== name; });
  $("[data-kicker]").textContent = ({ intro: "FIND DIN NÆSTE FAVORIT", choices: "FIND VED AT FRAVÆLGE", saved: "DINE GEMTE BØGER", match: "DIT BOGMATCH" })[name];
  $("[data-count]").textContent = name === "intro" ? "Klar til at vælge" : countLabel(exclusionCount());
}
function updateCounter() { if (currentScreen !== "intro") $("[data-count]").textContent = countLabel(exclusionCount()); }

async function hydrate(book) {
  if (!book.id) return book;
  const key = bookKey(book);
  if (!workDetails.has(key)) workDetails.set(key, api(`/work?id=${encodeURIComponent(book.id)}&type=${encodeURIComponent(book.format || "EBOOK")}`).catch(() => null));
  const details = await workDetails.get(key);
  return details ? { ...book, ...details } : book;
}
const hydrateBooks = (books) => Promise.all(books.map(hydrate));

const themeRules = [
  { label: "venskab", terms: ["venskab", "veninde", "venner"] },
  { label: "skole", terms: ["skole", "klasse", "lærer"] },
  { label: "klima og natur", terms: ["klima", "miljø", "natur", "bæredygt"] },
  { label: "eventyr", terms: ["eventyr", "opdagelse", "rejse"] },
  { label: "fantasy og magi", terms: ["fantasy", "magi", "magisk", "trolddom"] },
  { label: "mystik og gys", terms: ["mystik", "myster", "spøgelse", "gys", "uhygge"] },
  { label: "spænding og krimi", terms: ["spænding", "krimi", "detektiv", "gåder"] },
  { label: "humor", terms: ["humor", "sjov", "komisk"] },
  { label: "familie", terms: ["familie", "søskende", "forældre"] },
  { label: "dyr", terms: ["dyr", "hund", "kat", "hest"] },
  { label: "sport", terms: ["sport", "fodbold", "håndbold", "idræt"] },
  { label: "kærlighed", terms: ["kærlighed", "forelskelse", "romantik"] },
];
function usefulTopics(books) {
  const counts = new Map(themeRules.map(({ label }) => [label, 0]));
  books.forEach((book) => {
    const text = [...(book.subjects || []), ...(book.genres || [])].join(" ").toLocaleLowerCase("da");
    themeRules.forEach(({ label, terms }) => { if (terms.some((term) => text.includes(term))) counts.set(label, counts.get(label) + 1); });
  });
  return [...counts.entries()].filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).map(([label]) => label).slice(0, 4);
}

async function loadBatch(queries) {
  const request = ++loadRequest;
  const topics = [...new Set([...queries, ...seedQueries, "skole", "familie", "dyr", "opdagelse"].filter(Boolean))];
  const search = async (query) => { try { return await api(`/search-fast?q=${encodeURIComponent(query)}`); } catch { return { results: [] }; } };
  const initialSets = [await search(topics[0])];
  if (request !== loadRequest) return [];
  const candidates = new Map();
  const addResults = (sets) => sets.forEach((set) => (set.results || []).forEach((book) => {
    const key = bookKey(book);
    if (book.title && book.id && !seenIds.has(key) && !rejectedIds.has(key) && !candidates.has(key)) candidates.set(key, book);
  }));
  addResults(initialSets);
  if (candidates.size < 6) addResults(await Promise.all(topics.slice(1).map(search)));
  if (request !== loadRequest) return [];
  const books = [...candidates.values()].slice(0, 6);
  books.forEach((book) => seenIds.add(bookKey(book)));
  return books;
}

function renderChoiceLoading(message) {
  $("[data-book-choices]").innerHTML = `<p class="catalog-loading" role="status">${escapeHtml(message)}</p>`;
  $("[data-next]").disabled = true;
}
async function startRound(queries) {
  show("choices");
  $("[data-choice-title]").textContent = `Runde ${round + 1} af 3: Her er 6 bøger.`;
  $("[data-choice-help]").textContent = "Du bestemmer selv, hvor mange du fjerner. Sidetallet kan hjælpe dig med at vælge.";
  renderChoiceLoading("Finder 6 nye bøger og lydbøger i GO-kataloget…");
  const books = await loadBatch(queries);
  if (books.length < 6) {
    $("[data-book-choices]").innerHTML = `<p class="catalog-loading">Vi kunne ikke finde 6 nye digitale bøger lige nu. Prøv igen om lidt.</p>`;
    return;
  }
  batches[round] = books;
  removedByRound[round] ||= new Set();
  renderRound();
}
function renderRound() {
  const books = batches[round] || [], removed = removedByRound[round] || new Set();
  $("[data-choice-title]").textContent = `Runde ${round + 1} af 3: Her er 6 bøger.`;
  $("[data-choice-help]").textContent = "Klik på en bog for at fjerne den. Du bestemmer selv, hvor mange du fjerner.";
  $("[data-book-choices]").innerHTML = books.map((book, index) => `<button class="choice-book ${removed.has(index) ? "is-removed" : ""}" type="button" data-book-index="${index}" aria-pressed="${removed.has(index)}">${cover(book)}<strong>${escapeHtml(book.title)}</strong><small>${escapeHtml(bookMeta(book))}</small><span class="book-length">${pageCount(book)} sider</span></button>`).join("");
  $("[data-book-choices]").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => toggleRemoval(button)));
  renderSavedShelf();
  updateRoundStatus();
  show("choices");
}
function toggleRemoval(button) {
  const index = Number(button.dataset.bookIndex), removed = removedByRound[round], book = batches[round][index];
  if (removed.has(index)) { removed.delete(index); rejectedIds.delete(bookKey(book)); }
  else { removed.add(index); rejectedIds.add(bookKey(book)); }
  button.classList.toggle("is-removed", removed.has(index));
  button.setAttribute("aria-pressed", String(removed.has(index)));
  updateRoundStatus();
  updateCounter();
}
function updateRoundStatus() {
  const left = currentSurvivors().length;
  $("[data-selection-status]").textContent = `${left} ${left === 1 ? "bog" : "bøger"} tilbage · Du kan fortsætte, når du er klar.`;
  $("[data-next]").disabled = false;
}
const currentSurvivors = () => (batches[round] || []).filter((_, index) => !(removedByRound[round] || new Set()).has(index));

function renderMatch() {
  const matches = finalCandidates.filter((book) => !matchRemoved.has(bookKey(book)));
  matches.forEach((book) => savedBooks.set(bookKey(book), book));
  const topics = usefulTopics(matches);
  const category = topics[0] || "børnebøger";
  const copy = topics.length > 1 ? `${topics[0]} samt ${topics[1]}` : category;
  $("[data-match-title]").textContent = matches.length ? topics.length ? `Det ser ud til, at ${copy} er noget for dig.` : "Det ser ud til, at du er nysgerrig på nye historier." : "Du har fravalgt alle bøgerne.";
  $("[data-match-summary]").textContent = matches.length ? `Her er alle ${matches.length} ${matches.length === 1 ? "bog" : "bøger"}, du beholdt på tværs af runderne. Tryk på en bog for at begynde at læse den.` : "Se flere bøger for at prøve med et nyt udvalg.";
  $("[data-round-summary]").innerHTML = roundSurvivors.map((books, index) => `<span>Runde ${index + 1}: <b>${books?.length || 0}</b></span>`).join("");
  $("[data-category]").textContent = `Se alle bøger om ${category}`;
  $("[data-category]").disabled = !matches.length;
  $("[data-category]").dataset.category = category;
  renderMatchSavedShelf();
  $("[data-match-books]").innerHTML = matches.map((book) => { const key = bookKey(book), wished = wishlistedIds.has(key); return `<div class="match-book-wrap"><button type="button" class="match-book" data-read-book="${escapeHtml(key)}" aria-label="Læs ${escapeHtml(book.title)}">${cover(book)}<strong>${escapeHtml(book.title)}</strong><small>${escapeHtml(bookMeta(book))}</small><span class="book-length">${pageCount(book)} sider</span></button><button class="remove-match-book" type="button" data-remove-book="${escapeHtml(key)}">Fjern</button><button class="wishlist-book" type="button" data-wishlist-book="${escapeHtml(key)}" aria-pressed="${wished}" aria-label="${wished ? "Fjern" : "Tilføj"} ${escapeHtml(book.title)} ${wished ? "fra" : "til"} huskelisten">${wished ? "♥" : "♡"}</button></div>`; }).join("");
  $("[data-match-books]").querySelectorAll(".match-book").forEach((button) => button.addEventListener("click", () => {
    const book = matches.find((item) => bookKey(item) === button.dataset.readBook);
    if (book?.sourceUrl) window.location.href = book.sourceUrl;
  }));
  $("[data-match-books]").querySelectorAll(".remove-match-book").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.removeBook; matchRemoved.add(key); rejectedIds.add(key); savedBooks.delete(key); updateCounter(); renderMatch();
  }));
  $("[data-match-books]").querySelectorAll(".wishlist-book").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.wishlistBook; wishlistedIds.has(key) ? wishlistedIds.delete(key) : wishlistedIds.add(key); renderMatch();
  }));
  $("[data-match-save-note]").textContent = matches.length ? "Bøgerne er gemt sammen med dine tidligere valg. Du kan altid se dem alle igen." : "";
  show("match");
}

function renderSavedShelf() {
  const saved = [...savedBooks.values()], shelf = $("[data-saved-shelf]");
  shelf.hidden = saved.length === 0;
  shelf.innerHTML = saved.length ? `<button type="button" class="saved-shelf-button" aria-label="Se dine ${saved.length} gemte bøger"><span>Dine gemte bøger <b>(${saved.length})</b></span><span class="saved-shelf-list">${saved.map((book) => `<span>${cover(book)}<em>${escapeHtml(book.title)}</em></span>`).join("")}</span><span class="saved-shelf-arrow" aria-hidden="true">→</span></button>` : "";
  shelf.querySelector("button")?.addEventListener("click", () => renderSavedScreen("choices"));
}
function renderMatchSavedShelf() {
  const saved = [...savedBooks.values()], shelf = $("[data-match-saved]");
  shelf.hidden = saved.length === 0;
  shelf.innerHTML = saved.length ? `<button class="match-saved-button" type="button" aria-label="Se dine ${saved.length} gemte bøger fra alle runder"><span class="match-saved-label">Dine gemte bøger (${saved.length})</span><span class="match-saved-list">${saved.map((book) => `<span>${cover(book)}<em>${escapeHtml(book.title)}</em></span>`).join("")}</span><span class="match-saved-all">Se alle</span></button>` : "";
  shelf.querySelector("button")?.addEventListener("click", () => renderSavedScreen("match"));
}
function renderSavedScreen(returnScreen = "choices") {
  savedReturnScreen = returnScreen;
  const saved = [...savedBooks.values()];
  $("[data-saved-books]").innerHTML = saved.map((book) => `<article>${cover(book)}<strong>${escapeHtml(book.title)}</strong><span>${escapeHtml(bookMeta(book))} · ${pageCount(book)} sider</span></article>`).join("");
  show("saved");
}

async function advanceChoice() {
  $("[data-next]").disabled = true;
  $("[data-selection-status]").textContent = "Gør næste udvalg klar…";
  const survivors = await hydrateBooks(currentSurvivors());
  batches[round] = batches[round].map((book) => survivors.find((item) => bookKey(item) === bookKey(book)) || book);
  roundSurvivors[round] = survivors;
  if (round < 2) { round += 1; await startRound(usefulTopics(survivors)); return; }
  finalCandidates = await hydrateBooks(roundSurvivors.flat());
  matchRemoved.clear();
  renderMatch();
}
async function showMore() {
  const matches = finalCandidates.filter((book) => !matchRemoved.has(bookKey(book)));
  const queries = usefulTopics(matches.length ? matches : finalCandidates);
  matches.forEach((book) => savedBooks.set(bookKey(book), book));
  round = 0; batches = []; removedByRound = []; roundSurvivors = []; finalCandidates = [];
  matchRemoved.clear();
  await startRound(queries);
}
function resetFlow() {
  round = 0; batches = []; removedByRound = []; roundSurvivors = []; finalCandidates = []; matchRemoved.clear();
  savedBooks.clear(); wishlistedIds.clear(); seenIds = new Set(); rejectedIds = new Set(); loadRequest += 1;
  renderSavedShelf(); show("intro");
}

$("[data-start]").addEventListener("click", () => { resetFlow(); startRound(seedQueries); });
$("[data-next]").addEventListener("click", advanceChoice);
$("[data-more]").addEventListener("click", showMore);
$("[data-category]").addEventListener("click", (event) => { const category = event.currentTarget.dataset.category; if (category) window.location.href = `${goSearchBase}${encodeURIComponent(category)}`; });
$("[data-saved-back]").addEventListener("click", () => savedReturnScreen === "match" ? renderMatch() : renderRound());
document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => {
  if (currentScreen === "choices" && round === 0) { show("intro"); return; }
  if (currentScreen === "choices" && round > 0) { round -= 1; renderRound(); return; }
  if (currentScreen === "match") { round = 2; renderRound(); }
}));
$("[data-close]").addEventListener("click", resetFlow);
show("intro");

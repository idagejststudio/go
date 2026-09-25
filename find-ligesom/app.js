const assetRoot = "../design-system-reference/assets/";
const apiBase = "http://localhost:8787/api";
const books = [
  { title: "Pippi Langstrømpe", author: "Astrid Lindgren", year: "2008", cover: "imgImage213.png", traits: ["Sjov", "Personerne", "Tegningerne"] },
  { title: "Ronja Røverdatter", author: "Astrid Lindgren", year: "2008", cover: "imgImage214.png", traits: ["Der sker virkelig meget", "Personerne", "Universet", "Spændingen"] },
  { title: "Lotte fra Spektakelmagergade", author: "Astrid Lindgren", year: "2016", cover: "imgImage219.png", traits: ["Sjov", "Personerne", "Tegningerne"] },
  { title: "Brødrene Løvehjerte", author: "Astrid Lindgren", year: "2010", cover: "imgImage193.png", traits: ["Der sker virkelig meget", "Universet", "Spændingen"] },
  { title: "Mio, min Mio", author: "Astrid Lindgren", year: "2010", cover: "imgImage192.png", traits: ["Personerne", "Tegningerne", "Universet", "Spændingen"] },
  { title: "Vi på Krageøen", author: "Astrid Lindgren", year: "2011", cover: "imgImage43.png", traits: ["Sjov", "Personerne", "Universet"] },
];
let availableBooks = [...books];
const preferences = [
  ["Sjov", "humoren"],
  ["Der sker virkelig meget", "at der sker virkelig meget"],
  ["Personerne", "personerne"],
  ["Tegningerne", "tegningerne"],
  ["Universet", "universet"],
  ["Spændingen", "spændingen"],
];
const popularTitles = ["Pippi Langstrømpe", "Ronja Røverdatter", "Lotte fra Spektakelmagergade", "Vi på Krageøen"];
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

function coverUrl(book) {
  return book.coverUrl || (book.cover?.startsWith("http") ? book.cover : assetRoot + book.cover);
}

function bookCard(book, className = "") {
  const year = book.year ? ` (${book.year})` : "";
  return `<img src="${coverUrl(book)}" alt=""/><span><strong>${book.title}</strong><small>${book.author}${year}</small></span>`;
}

function selectBook(book) {
  selectedBook = book;
  document.querySelectorAll(".popular-book").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.title === book.title));
  });
  pickedBox.innerHTML = `<div class="picked-book-card">${bookCard(book)}</div>`;
  pickedBox.hidden = false;
  suggestionBox.hidden = true;
  searchInput.value = book.title;
  nextButton.disabled = false;
}

function renderSuggestions(query) {
  const normalized = query.trim().toLocaleLowerCase("da");
  if (!normalized) {
    suggestionBox.hidden = true;
    suggestionBox.innerHTML = "";
    return;
  }
  const matches = availableBooks.filter(book => book.title.toLocaleLowerCase("da").includes(normalized) || book.author.toLocaleLowerCase("da").includes(normalized));
  suggestionBox.innerHTML = matches.length
    ? matches.map((book, index) => `<button class="suggestion-option" type="button" data-suggestion="${book.title}" ${index === 0 ? 'aria-current="true"' : ""}>${bookCard(book)}</button>`).join("")
    : `<p class="no-suggestions">Vi fandt ikke den bog endnu. Prøv et af de populære valg herunder.</p>`;
  suggestionBox.hidden = false;
  suggestionBox.querySelectorAll("[data-suggestion]").forEach(button => button.addEventListener("click", () => selectBook(books.find(book => book.title === button.dataset.suggestion))));
}

async function searchBooks(query) {
  const normalized = query.trim();
  if (!normalized) return [];
  try {
    const response = await fetch(`${apiBase}/search?q=${encodeURIComponent(normalized)}`);
    if (!response.ok) throw new Error("GO API unavailable");
    const payload = await response.json();
    const results = (payload.results || []).map(book => ({
      ...book,
      cover: book.coverUrl,
      traits: book.subjects || [],
    }));
    if (results.length) {
      availableBooks = [...results, ...books.filter(local => !results.some(book => book.title === local.title))];
      return results;
    }
  } catch {
    // The static catalog remains available when the adapter is not running.
  }
  return availableBooks.filter(book => book.title.toLocaleLowerCase("da").includes(normalized.toLocaleLowerCase("da")) || book.author.toLocaleLowerCase("da").includes(normalized.toLocaleLowerCase("da")));
}

let searchRequest = 0;
async function renderApiSuggestions(query) {
  const request = ++searchRequest;
  const normalized = query.trim();
  if (!normalized) return renderSuggestions(query);
  suggestionBox.hidden = false;
  suggestionBox.innerHTML = `<p class="no-suggestions">Søger på GO…</p>`;
  const results = await searchBooks(normalized);
  if (request !== searchRequest) return;
  const matches = results.length ? results : availableBooks.filter(book => book.title.toLocaleLowerCase("da").includes(normalized.toLocaleLowerCase("da")) || book.author.toLocaleLowerCase("da").includes(normalized.toLocaleLowerCase("da")));
  suggestionBox.innerHTML = matches.length
    ? matches.map((book, index) => `<button class="suggestion-option" type="button" data-suggestion="${book.title.replaceAll('"', '&quot;')}" ${index === 0 ? 'aria-current="true"' : ""}>${bookCard(book)}</button>`).join("")
    : `<p class="no-suggestions">Vi fandt ikke den bog endnu. Prøv et andet søgeord.</p>`;
  suggestionBox.hidden = false;
  suggestionBox.querySelectorAll("[data-suggestion]").forEach(button => button.addEventListener("click", () => selectBook(availableBooks.find(book => book.title === button.dataset.suggestion))));
}

function renderPopular() {
  document.querySelector("[data-popular]").innerHTML = popularTitles.map(bookTitle => {
    const book = books.find(candidate => candidate.title === bookTitle);
    return `<button class="popular-book" type="button" data-title="${book.title}" aria-pressed="false"><img src="${assetRoot}${book.cover}" alt="Forside til ${book.title}"/><span>${book.title}</span></button>`;
  }).join("");
  document.querySelectorAll(".popular-book").forEach(button => button.addEventListener("click", () => selectBook(books.find(book => book.title === button.dataset.title))));
}

function renderPreferences() {
  document.querySelector("[data-preferences]").innerHTML = preferences.map(([label]) => `<button type="button" class="preference-choice" aria-pressed="false" data-like="${label}">${label}</button>`).join("");
  document.querySelectorAll(".preference-choice").forEach((button, index) => button.addEventListener("click", () => {
    const isSelected = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isSelected));
    isSelected ? selectedPreferences.delete(index) : selectedPreferences.add(index);
    nextButton.disabled = selectedPreferences.size === 0;
  }));
}

function showStep(step) {
  currentStep = step;
  document.querySelectorAll("[data-step]").forEach(section => { section.hidden = Number(section.dataset.step) !== step; });
  backButton.hidden = step === 1;
  nextButton.hidden = step === 3;
  if (step === 1) {
    title.textContent = "Find noget ligesom";
    stepLabel.textContent = "Find din næste favorit";
    nextButton.textContent = "Næste";
    nextButton.disabled = !selectedBook;
  } else if (step === 2) {
    title.textContent = "Fortæl os, hvad du kunne lide";
    stepLabel.textContent = "Trin 2 af 3";
    document.querySelector("[data-selected-summary]").innerHTML = bookCard(selectedBook);
    nextButton.textContent = "Find bøger";
    nextButton.disabled = selectedPreferences.size === 0;
  } else {
    title.textContent = "Vi har fundet 3 bøger ligesom";
    stepLabel.textContent = "Dine anbefalinger";
    backButton.textContent = "Prøv igen";
    renderResults();
  }
  if (step === 2) backButton.textContent = "Tilbage";
}

function renderResults() {
  const liked = [...selectedPreferences].map(index => preferences[index][1]);
  const likedText = liked.length < 2 ? liked[0] : `${liked.slice(0, -1).join(", ")} og ${liked.at(-1)}`;
  document.querySelector("[data-recommendation-copy]").innerHTML = `Hvis du kunne lide <strong>${likedText}</strong> i <strong>${selectedBook.title}</strong>, tror vi, du vil kunne lide…`;
  const preferencesToMatch = [...selectedPreferences].map(index => preferences[index][0]);
  const recommendations = availableBooks
    .filter(book => book.title !== selectedBook.title)
    .map((book, index) => ({ book, index, score: book.traits.filter(trait => preferencesToMatch.includes(trait)).length }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 3)
    .map(item => item.book);
  document.querySelector("[data-recommendations]").innerHTML = recommendations.map(book => `<article class="recommendation-card"><div class="cover"><img src="${coverUrl(book)}" alt="Forside til ${book.title}"/></div><button class="save-book" type="button" aria-label="Gem ${book.title}" aria-pressed="false">♡</button><strong class="book-title">${book.title}</strong><span class="book-author">${book.author}${book.year ? ` (${book.year})` : ""}</span></article>`).join("");
  document.querySelectorAll(".save-book").forEach(button => button.addEventListener("click", () => {
    const isSaved = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isSaved));
    button.textContent = isSaved ? "♡" : "♥";
  }));
}

renderPopular();
renderPreferences();
document.querySelector("[data-search-form]").addEventListener("submit", async event => { event.preventDefault(); await renderApiSuggestions(searchInput.value); suggestionBox.querySelector("[data-suggestion]")?.click(); });
searchInput.addEventListener("input", () => {
  if (selectedBook && searchInput.value.trim() !== selectedBook.title) {
    selectedBook = null;
    pickedBox.hidden = true;
    pickedBox.innerHTML = "";
    document.querySelectorAll(".popular-book").forEach(button => button.setAttribute("aria-pressed", "false"));
    nextButton.disabled = true;
  }
  renderApiSuggestions(searchInput.value);
});
searchInput.addEventListener("focus", () => { if (searchInput.value) renderApiSuggestions(searchInput.value); });
document.addEventListener("click", event => { if (!event.target.closest(".book-search-wrap")) suggestionBox.hidden = true; });
nextButton.addEventListener("click", () => { if (currentStep === 1 && selectedBook) showStep(2); else if (currentStep === 2 && selectedPreferences.size) showStep(3); });
function resetFlow() {
  selectedBook = null;
  selectedPreferences.clear();
  searchInput.value = "";
  pickedBox.hidden = true;
  pickedBox.innerHTML = "";
  suggestionBox.hidden = true;
  document.querySelectorAll(".popular-book").forEach(button => button.setAttribute("aria-pressed", "false"));
  document.querySelectorAll(".preference-choice").forEach(button => button.setAttribute("aria-pressed", "false"));
  showStep(1);
}
backButton.addEventListener("click", () => currentStep === 3 ? resetFlow() : showStep(currentStep - 1));

const background = document.querySelector(".page-backdrop");
const backgroundFrame = document.querySelector(".page-backdrop iframe");
function closeFeature() {
  document.body.classList.add("is-closed");
  background.setAttribute("aria-hidden", "false");
  backgroundFrame.contentWindow?.postMessage({type: "focus-find-ligesom-trigger"}, "*");
}
function openFeature() {
  document.body.classList.remove("is-closed");
  background.setAttribute("aria-hidden", "true");
  document.querySelector("[data-close]").focus();
}
document.querySelector("[data-close]").addEventListener("click", closeFeature);
document.querySelector("[data-scrim]").addEventListener("click", closeFeature);
window.addEventListener("message", event => {
  if (event.source === backgroundFrame.contentWindow && event.data?.type === "open-find-ligesom") openFeature();
});
document.addEventListener("keydown", event => { if (event.key === "Escape") closeFeature(); });

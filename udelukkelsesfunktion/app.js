const assetRoot = "../design-system-reference/assets/";
const rounds = [
  [
    { title: "Ormehullet", author: "Merlin P. Mann", cover: "imgImage203.png", pages: 190, themes: ["venskab", "mystik", "eventyr"] },
    { title: "Ronja Røverdatter", author: "Astrid Lindgren", cover: "imgImage214.png", pages: 236, themes: ["venskab", "mod", "natur"] },
    { title: "Vi på Krageøen", author: "Astrid Lindgren", cover: "imgImage43.png", pages: 175, themes: ["venskab", "humor", "hverdag"] },
    { title: "Brødrene Løvehjerte", author: "Astrid Lindgren", cover: "imgImage193.png", pages: 274, themes: ["eventyr", "mod", "mystik"] },
    { title: "Lotte fra Spektakelmagergade", author: "Astrid Lindgren", cover: "imgImage219.png", pages: 110, themes: ["humor", "familie", "hverdag"] },
    { title: "Mio, min Mio", author: "Astrid Lindgren", cover: "imgImage192.png", pages: 205, themes: ["mystik", "eventyr", "venskab"] }
  ],
  [
    { title: "Pippi Langstrømpe", author: "Astrid Lindgren", cover: "imgImage213.png", pages: 154, themes: ["venskab", "humor", "mod"] },
    { title: "Mit forheksede liv", author: "K. L. Randis", cover: "imgBookCover.png", pages: 187, themes: ["mystik", "venskab", "magi"] },
    { title: "På eventyr i naturen", author: "Lone Hørslev", cover: "imgHomeReco.png", pages: 64, themes: ["natur", "hobby", "eventyr"] },
    { title: "Den hemmelige portal", author: "Sofia Høgh", cover: "imgImage44.png", pages: 219, themes: ["mystik", "eventyr", "venskab"] },
    { title: "Spøgelsesbyen", author: "N. R. Holm", cover: "imgImage45.png", pages: 248, themes: ["mystik", "gys", "mod"] },
    { title: "Stjerneskibet", author: "Mikkel Kruse", cover: "imgImage46.png", pages: 181, themes: ["eventyr", "venskab", "science fiction"] }
  ],
  [
    { title: "Skyggeland", author: "Julie Vester", cover: "imgImage48.png", pages: 192, themes: ["mystik", "venskab", "gys"] },
    { title: "Koden fra kælderen", author: "Maja Skov", cover: "imgImage189.png", pages: 166, themes: ["mystik", "venskab", "gåde"] },
    { title: "Måneklubben", author: "Signe Aagaard", cover: "imgImage190.png", pages: 144, themes: ["venskab", "mystik", "mod"] },
    { title: "Det usynlige kort", author: "Aksel Nørgaard", cover: "imgImage191.png", pages: 211, themes: ["mystik", "eventyr", "gåde"] },
    { title: "Ronja Røverdatter", author: "Astrid Lindgren", cover: "imgImage214.png", pages: 236, themes: ["venskab", "mod", "natur"] },
    { title: "Mio, min Mio", author: "Astrid Lindgren", cover: "imgImage192.png", pages: 205, themes: ["mystik", "eventyr", "venskab"] }
  ]
];

let round = 0;
const removedByRound = [new Set(), new Set(), new Set()];
let lengthRemoved = new Set();
let currentScreen = "intro";
let survivors = [];
let matchBooks = [];
let picked = null;
const savedBooks = new Map();
const $ = selector => document.querySelector(selector);
const exclusionCount = () => removedByRound.reduce((total, set) => total + set.size, 0) + lengthRemoved.size;
const exclusionLabel = count => `${count} ${count === 1 ? "bog" : "bøger"} fravalgt`;
const updateCounter = () => { if (currentScreen !== "intro") $("[data-count]").textContent = exclusionLabel(exclusionCount()); };
const show = name => {
  currentScreen = name;
  document.querySelectorAll("[data-screen]").forEach(section => section.hidden = section.dataset.screen !== name);
  const kicker = { intro: "FIND DIN NÆSTE FAVORIT", choices: "FIND VED AT FRAVÆLGE", saved: "DINE GEMTE BØGER", length: "FIND VED AT FRAVÆLGE", match: "DIT BOGMATCH", success: "DIT BOGMATCH" }[name];
  $("[data-kicker]").textContent = kicker;
  $("[data-count]").textContent = name === "intro" ? "Klar til at vælge" : exclusionLabel(exclusionCount());
};
const bookHtml = (book, extra = "") => `<img src="${assetRoot + book.cover}" alt="Forside til ${book.title}"><strong>${book.title}</strong><small>${book.author}</small>${extra}`;
function renderSavedShelves() {
  const saved = [...savedBooks.values()];
  document.querySelectorAll("[data-saved-shelf]").forEach(shelf => {
    shelf.hidden = saved.length === 0;
    shelf.innerHTML = saved.length ? `<button type="button" class="saved-shelf-button" aria-label="Se dine ${saved.length} gemte bøger"><span>Dine gemte bøger <b>(${saved.length})</b></span><span class="saved-shelf-list">${saved.map(book => `<span><img src="${assetRoot + book.cover}" alt=""><em>${book.title}</em></span>`).join("")}</span><span class="saved-shelf-arrow" aria-hidden="true">→</span></button>` : "";
    shelf.querySelector("button")?.addEventListener("click", renderSavedScreen);
  });
}
function renderSavedScreen() {
  const saved = [...savedBooks.values()];
  $("[data-saved-books]").innerHTML = saved.map(book => `<article><img src="${assetRoot + book.cover}" alt="Forside til ${book.title}"><strong>${book.title}</strong><span>${book.author}</span></article>`).join("");
  show("saved");
}
function renderRound() {
  const books = rounds[Math.min(round, rounds.length - 1)];
  const removed = removedByRound[round];
  $("[data-choice-title]").textContent = round ? "Her er 6 nye bøger. Fjern de 3 igen!" : "Fjern de 3 bøger, du mindst vil læse.";
  $("[data-choice-help]").textContent = "Klik på en bog for at fjerne den";
  $("[data-book-choices]").innerHTML = books.map((book, index) => `<button class="choice-book ${removed.has(index) ? "is-removed" : ""}" type="button" data-book-index="${index}" aria-pressed="${removed.has(index)}">${bookHtml(book)}</button>`).join("");
  $("[data-book-choices]").querySelectorAll("button").forEach(button => button.addEventListener("click", () => toggleRemove(button)));
  renderSavedShelves();
  updateRoundStatus(); show("choices");
}
function toggleRemove(button) {
  const id = Number(button.dataset.bookIndex);
  const removed = removedByRound[round];
  if (!removed.has(id) && removed.size === 3) return;
  removed.has(id) ? removed.delete(id) : removed.add(id);
  button.classList.toggle("is-removed", removed.has(id)); button.setAttribute("aria-pressed", String(removed.has(id)));
  updateRoundStatus(); updateCounter();
}
function updateRoundStatus() {
  const removed = removedByRound[round];
  const left = 3 - removed.size;
  $("[data-selection-status]").textContent = left ? `Vælg ${left} ${left === 1 ? "bog" : "bøger"} mere` : "Fint valgt! Du kan fortsætte.";
  $("[data-next]").disabled = left !== 0;
}
function renderLength() {
  survivors = round >= 2
    ? rounds[2].filter((_, index) => !removedByRound[2].has(index))
    : [0, 1].flatMap(group => rounds[group].filter((_, index) => !removedByRound[group].has(index)));
  $("[data-length-choices]").innerHTML = survivors.map((book, index) => `<button class="choice-book ${lengthRemoved.has(index) ? "is-removed" : ""}" type="button" data-length-index="${index}" aria-pressed="${lengthRemoved.has(index)}">${bookHtml(book, `<span class="book-length">${book.pages} sider</span>`)}</button>`).join("");
  $("[data-length-choices]").querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    const index = Number(button.dataset.lengthIndex);
    lengthRemoved.has(index) ? lengthRemoved.delete(index) : lengthRemoved.add(index);
    button.classList.toggle("is-removed", lengthRemoved.has(index)); button.setAttribute("aria-pressed", String(lengthRemoved.has(index)));
    const alive = survivors.filter((_, itemIndex) => !lengthRemoved.has(itemIndex));
    $("[data-length-status]").textContent = alive.length ? `${alive.length} ${alive.length === 1 ? "bog" : "bøger"} tilbage` : "Behold mindst én bog for at fortsætte";
    updateCounter();
  }));
  const alive = survivors.filter((_, index) => !lengthRemoved.has(index));
  $("[data-length-status]").textContent = alive.length ? `${alive.length} ${alive.length === 1 ? "bog" : "bøger"} tilbage` : "Behold mindst én bog for at fortsætte";
  show("length");
}
function themeSentence(books) {
  const counts = books.flatMap(book => book.themes).reduce((all, theme) => (all[theme] = (all[theme] || 0) + 1, all), {});
  const themes = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 2);
  return themes.length > 1 ? `${themes[0]} og ${themes[1]}` : themes[0] || "gode historier";
}
function renderMatch() {
  const visible = survivors.filter((_, index) => !lengthRemoved.has(index));
  survivors = visible.length ? visible : survivors;
  matchBooks = survivors;
  $("[data-match-title]").textContent = `Det ser ud til, at ${themeSentence(survivors)} er noget for dig.`;
  $("[data-match-books]").innerHTML = survivors.map((book, index) => `<div class="match-book-wrap"><button type="button" class="match-book" aria-pressed="false" data-match-index="${index}">${bookHtml(book)}<span class="check">✓</span></button></div>`).join("");
  renderSavedShelves();
  $("[data-match-books]").querySelectorAll(".match-book").forEach(button => button.addEventListener("click", () => {
    const isSelected = button.getAttribute("aria-pressed") === "true";
    if (isSelected) {
      button.setAttribute("aria-pressed", "false");
      picked = null;
      $("[data-pick]").disabled = true;
      return;
    }
    $("[data-match-books]").querySelectorAll(".match-book").forEach(item => item.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true"); picked = survivors[Number(button.dataset.matchIndex)]; $("[data-pick]").disabled = false;
  }));
  $("[data-pick]").disabled = true; picked = null; show("match");
}
$("[data-start]").addEventListener("click", renderRound);
$("[data-next]").addEventListener("click", () => {
  if (round === 0) { round = 1; renderRound(); return; }
  renderLength();
});
$("[data-length-next]").addEventListener("click", renderMatch);
$("[data-more]").addEventListener("click", () => {
  survivors.forEach(book => savedBooks.set(book.title, book));
  round = 2; removedByRound[2].clear(); lengthRemoved.clear(); survivors = []; renderRound();
});
$("[data-pick]").addEventListener("click", () => { $("[data-success-card]").innerHTML = `<img src="${assetRoot + picked.cover}" alt="Forside til ${picked.title}"><div><strong>${picked.title}</strong><span>${picked.author}</span></div>`; show("success"); });
function resetFlow() { round = 0; survivors = []; matchBooks = []; picked = null; savedBooks.clear(); lengthRemoved.clear(); removedByRound.forEach(set => set.clear()); renderSavedShelves(); show("intro"); }
$("[data-restart]").addEventListener("click", resetFlow);
$("[data-saved-back]").addEventListener("click", renderRound);
document.querySelectorAll("[data-back]").forEach(button => button.addEventListener("click", () => {
  if (currentScreen === "choices" && round === 0) { show("intro"); return; }
  if (currentScreen === "choices" && round === 1) { lengthRemoved.clear(); round = 0; renderRound(); return; }
  if (currentScreen === "choices" && round === 2) { survivors = matchBooks; renderMatch(); return; }
  if (currentScreen === "length") { lengthRemoved.clear(); round = 1; renderRound(); return; }
  if (currentScreen === "match") { renderLength(); }
}));
$("[data-close]").addEventListener("click", resetFlow);
show("intro");

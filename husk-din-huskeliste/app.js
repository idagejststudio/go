const API_BASE = location.protocol === "file:" ? "http://localhost:8787/api" : "/api";
// Dette er barnets eksisterende eksempel-huskeliste. Værkerne hentes altid
// frisk fra GO, så titel, forfatter, format, alder og forside er korrekte.
const wishList = [
  { id: "work-of:870970-basis:142474581", type: "EBOOK", title: "Hestekraft", author: "Carsten Flink", age: "11-13", coverUrl: "https://fbiinfo-present.dbc.dk/images/laNI9wFxTeqtkio_0FgFdQ/120px!AQ1BcVmv4FmWNLMkKLHfjV89NEedsQqeyQnfQia-6uVcGg", sourceUrl: "https://go.bibliotek.kk.dk/work/work-of%3A870970-basis%3A142474581?type=EBOOK", heading: "Hey! Det er weekend!", icon: "🎉", kicker: "KLAR TIL WEEKENDEN", note: "Du gemte den på din huskeliste for 2 uger siden.", reason: "Den er perfekt til at forsvinde ind i, når der er god tid til flere kapitler." },
  { id: "work-of:870970-basis:143130762", type: "EBOOK", title: "Krystalstenen", author: "Anne Mette Asp", age: "11-14", coverUrl: "https://fbiinfo-present.dbc.dk/images/RGYS0MmpQpmEMm3dNpW6sw/120px!AQ3PSSrFUr-llbOAFtzBfO6_YsQZj2DfQu8mlOSPmz-Slg", sourceUrl: "https://go.bibliotek.kk.dk/work/work-of%3A870970-basis%3A143130762?type=EBOOK", heading: "Kan du huske den her?", icon: "✦", kicker: "ET MAGISK GENSYN", note: "Du gemte den på din huskeliste i sidste måned.", reason: "Du ville gerne ind i en helt anden verden. Måske er det lige i dag?" },
  { id: "work-of:870970-basis:143373738", type: "EBOOK", title: "Sherlock Holmes - Baskervilles hund", author: "A. Conan Doyle", age: "10-14", coverUrl: "https://fbiinfo-present.dbc.dk/images/vPbmkxVmROSL4Pt07DTabQ/120px!AQ1QIL6P6l4wAsRIdCOxELv9qttP0KyHSSyUC2lyYUGvjA", sourceUrl: "https://go.bibliotek.kk.dk/work/work-of%3A870970-basis%3A143373738?type=EBOOK", heading: "👻 12 dage til Halloween", icon: "👻", kicker: "LIDT UHYGGELIG", note: "Den har ligget på din huskeliste længe nok til at blive lidt mystisk.", reason: "Du har faktisk en bog med en forbandelse liggende her … tør du begynde?" },
  { id: "work-of:870970-basis:142892804", type: "EBOOK", title: "AI Buddy - hey, Buddy?", author: "Charlotte T. Frobenius", age: "9-12", coverUrl: "https://fbiinfo-present.dbc.dk/images/FGUTeDaTSV2Kr4eARlONow/120px!AQ24PdYHcI4GSvPWouJI1ug1vTBrkVVNtRjHlyF2Mbd8Aw", sourceUrl: "https://go.bibliotek.kk.dk/work/work-of%3A870970-basis%3A142892804?type=EBOOK", heading: "Hey! Kan du huske den her?", icon: "🤖", kicker: "SPÆNDING PÅ LISTEN", note: "Du gemte den på din huskeliste for 3 uger siden.", reason: "Du var nysgerrig på, hvad der sker, når en AI-assistent begynder at tage tingene lidt for alvorligt." },
  { id: "work-of:870970-basis:143735095", type: "EBOOK", title: "Tårernes flod", author: "Jacob Weinreich", age: "10-14", coverUrl: "https://fbiinfo-present.dbc.dk/images/P7rwzF5lSVi-Pd8zfz2s5w/120px!AQ2rtZITMmEZa_a_Hua0eJGCwMzlXqK0ldTVicrlNPfWNw", sourceUrl: "https://go.bibliotek.kk.dk/work/work-of%3A870970-basis%3A143735095?type=EBOOK", heading: "🌧️ Regnvejr = læsevejr", icon: "🌧️", kicker: "ET SPÆNDENDE FUND", note: "Du gemte den på din huskeliste for noget tid siden.", reason: "Udenfor kan det godt regne. Herinde venter et eventyr med farer og magi." },
  { id: "work-of:870970-basis:143073084", type: "EBOOK", title: "Mysteriet om arven - nøgle til viden", author: "Lone Halkjær", age: "11-14", coverUrl: "https://fbiinfo-present.dbc.dk/images/OuXuedF6S2qkz3L2RFzsXg/120px!AQ14QxHd4NM-nqgKKXhPeiLRK0wB0XE7PVOf93laIe1LfQ", sourceUrl: "https://go.bibliotek.kk.dk/work/work-of%3A870970-basis%3A143073084?type=EBOOK", heading: "Et nyt spor fra din huskeliste", icon: "🔎", kicker: "MYSTERIUM KLAR", note: "Du gemte den, fordi du godt kan lide gåder og hemmeligheder.", reason: "Der er stadig et mysterium, der venter på at blive løst." },
];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let current = null;
let chosenTime = "";

function showStep(name) { $$('[data-step]').forEach(step => { step.hidden = step.dataset.step !== name; }); $('[data-dialog]').scrollTop = 0; }
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char])); }
function renderMeta(book) { return [book.age ? `${book.age} år` : null, book.pages ? `${book.pages} sider` : null].filter(Boolean).map(value => `<span>${escapeHtml(value)}</span>`).join(""); }
function randomItem(excludeId) { const options = wishList.filter(item => item.id !== excludeId); return options[Math.floor(Math.random() * options.length)]; }
function renderBook(book) {
  $('[data-title]').textContent = book.title;
  $('[data-author]').textContent = book.author ? `af ${book.author}` : "";
  $('[data-cover]').src = book.coverUrl || "../design-system-reference/assets/imgBookCover.png";
  $('[data-cover]').alt = `Forside til ${book.title}`;
  $('[data-meta]').innerHTML = renderMeta(book);
  $('[data-read]').href = book.sourceUrl || "#";
}

async function showBook(entry) {
  current = entry;
  $('[data-heading]').textContent = entry.heading;
  $('[data-saved-note]').textContent = entry.reason;
  $('[data-icon]').textContent = entry.icon;
  $('[data-kicker]').textContent = entry.kicker;
  $('[data-title]').textContent = "Finder din bog…";
  $('[data-author]').textContent = "";
  $('[data-reason]').textContent = entry.note;
  $('[data-meta]').innerHTML = "";
  try {
    const response = await fetch(`${API_BASE}/work?id=${encodeURIComponent(entry.id)}&type=${entry.type}`);
    if (!response.ok) throw new Error("Værket kunne ikke hentes");
    const book = await response.json();
    if (current?.id !== entry.id) return;
    current = { ...entry, ...book };
    renderBook(current);
  } catch {
    renderBook(entry);
  }
}

$("[data-another]").addEventListener("click", () => showBook(randomItem(current?.id)));
$("[data-later]").addEventListener("click", () => {
  if (!current?.title) return;
  $('[data-time-book]').textContent = `Gem ${current.title} til et øjeblik, der passer bedre.`;
  showStep("time");
});
$("[data-back]").addEventListener("click", () => showStep("nudge"));
$$('[data-time]').forEach(button => button.addEventListener("click", () => {
  chosenTime = button.dataset.time;
  $$('[data-time]').forEach(choice => choice.setAttribute("aria-pressed", String(choice === button)));
  $('[data-save-time]').disabled = false;
}));
$("[data-save-time]").addEventListener("click", () => {
  $('[data-confirm-book]').textContent = current?.title || "bogen";
  $('[data-confirm-time]').textContent = chosenTime.toLocaleLowerCase("da");
  showStep("confirmation");
});
function closeDialog() { document.body.classList.add("is-closed"); }
$("[data-close]").addEventListener("click", closeDialog);
$("[data-scrim]").addEventListener("click", closeDialog);
$("[data-done]").addEventListener("click", () => { showStep("nudge"); showBook(randomItem(current?.id)); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeDialog(); });
showBook(randomItem());

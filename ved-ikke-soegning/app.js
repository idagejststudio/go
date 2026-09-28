const A = "../design-system-reference/assets/";
const API_BASE = "http://localhost:8787/api";
const questions = [
  { question: "Vælg en snack.", prompt: "Vi forklarer ikke hvorfor.", answers: [["🍿", "Popcorn", "humor"], ["🍉", "Vandmelon", "hygge"], ["🌶️", "Stærke chips", "spænding"], ["🍫", "Chokolade", "fantasi"], ["🍕", "Kold pizza fra i går", "mysterie"]] },
  { question: "Hvilken knap trykker du på?", prompt: "Der findes kun ét helt forkert svar. Måske.", answers: [["🔴", "TRYK IKKE", "spænding"], ["🟢", "GRATIS SLIK", "humor"], ["🟣", "???", "fantasi"], ["🔵", "GØR ALT NORMALT IGEN", "hygge"]] },
  { question: "Vælg et sted at være de næste 24 timer.", prompt: "Snacks følger kun med ét af stederne.", answers: [["🏰", "Et forladt slot", "mysterie"], ["🎢", "En forlystelsespark efter lukketid", "spænding"], ["🏝️", "En øde ø med din bedste ven", "hygge"], ["🛸", "Et rumskib mod noget ukendt", "fantasi"], ["🏠", "Hjemme. Med snacks.", "hygge"]] },
  { question: "Du får én nøgle.", prompt: "Hvad håber du, den passer til?", answers: [["🔐", "Et pengeskab ingen kan åbne", "mysterie"], ["🚪", "En hemmelig dør på skolen", "spænding"], ["🏰", "Et slot i en anden verden", "fantasi"], ["📓", "En kasse med en gammel dagbog", "mysterie"], ["🤷", "Aner det ikke. Derfor vil jeg have den!", "humor"]] },
  { question: "Hurtigt! Vælg en emoji.", prompt: "Ingen forklaringer.", answers: [["💥", "", "spænding"], ["👀", "", "mysterie"], ["😂", "", "humor"], ["🫶", "", "hygge"], ["🧠", "", "mysterie"], ["🐉", "", "fantasi"]] },
  { question: "Hvor meget kaos kan du klare lige nu?", prompt: "Svar ærligt. Dit tæppe dømmer dig ikke.", answers: [["😌", "0 % – jeg har fået nok for i dag", "hygge"], ["🙂", "Lidt kan jeg godt klare", "humor"], ["😈", "Giv mig problemer", "spænding"], ["🔥", "ØDELÆG ALT", "fantasi"]] }
];
const moodProfiles = {
  spænding: { persona: "Action-jægeren", intro: "Du virker klar på højt tempo, fare og historier, hvor der sker noget med det samme." },
  mysterie: { persona: "Mysterieslugeren", intro: "Du samlede spor, hemmelige døre og ting, der ikke helt stemmer." },
  fantasi: { persona: "Fantasten", intro: "Du valgte det ukendte. Her er verdener, magi og eventyr uden helt almindelige regler." },
  humor: { persona: "Humoristen", intro: "Du har en ret sund appetit på skøre idéer, kaos og ting, der er lidt for meget." },
  hygge: { persona: "Hverdagshelten", intro: "Du valgte tryghed, venskab og et godt sted at lande. Her er historier tæt på livet." },
};
const fallbackCovers = ["imgImage202.png", "imgImage203.png", "imgImage193.png", "imgImage214.png"];
let step = 0, answers = [], advanceId, thinkingId, thinkingStageIds = [], catalogPromise, isAdvancing = false;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value || "").replace(/[&<>\"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
const thinkingStages = [
  ["VI LAVER MEGET VIGTIGE BEREGNINGER", "Hmmmm… interessant.", "Vi kigger på snacks, kaos og de meget vigtige emojis."],
  ["ANALYSERER DINE SVAR", "Det her siger faktisk en del…", "Især det med den mærkelige knap. Det noterer vi lige."],
  ["FINDER DIT NÆSTE EVENTYR", "Vi har næsten noget.", "Bare lige ét sidste helt uvidenskabeligt tjek."],
];
function show(screen) { $$('[data-screen]').forEach(element => element.hidden = element.dataset.screen !== screen); window.scrollTo(0, 0); }
function renderQuestion() {
  const current = questions[step];
  const count = `Spørgsmål ${step + 1} af ${questions.length}`;
  $('[data-question]').textContent = current.question;
  $('[data-prompt]').textContent = current.prompt;
  $$('[data-count]').forEach(element => element.textContent = count);
  $('[data-progress]').style.width = `${((step + 1) / questions.length) * 100}%`;
  $('[data-answers]').innerHTML = current.answers.map(([emoji, label], index) => `<button class="idk-answer ${label ? '' : 'emoji-answer'} ${answers[step] === index ? 'is-selected' : ''}" type="button" data-answer="${index}" aria-pressed="${answers[step] === index}" style="--accent:${['var(--idk-yellow)','var(--idk-pink)','var(--idk-blue)','var(--idk-lilac)'][index % 4]}">${label ? `<span class="answer-icon">${emoji}</span><span>${label}</span>` : `<span class="emoji-only">${emoji}</span>`}</button>`).join('');
  const wrap = $('[data-question-wrap]'); wrap.classList.remove('is-leaving', 'is-changing'); requestAnimationFrame(() => wrap.classList.add('is-changing'));
}
function stopPendingAdvance() { clearTimeout(advanceId); isAdvancing = false; $('[data-question-wrap]').classList.remove('is-leaving'); }
function selectAnswer(index) {
  if (isAdvancing) return;
  answers[step] = index;
  const selected = $(`[data-answer="${index}"]`);
  selected.classList.add('is-selected');
  selected.setAttribute('aria-pressed', 'true');
  isAdvancing = true;
  advanceId = window.setTimeout(() => {
    const wrap = $('[data-question-wrap]');
    wrap.classList.add('is-leaving');
    advanceId = window.setTimeout(() => {
      isAdvancing = false;
      if (step < questions.length - 1) { step++; renderQuestion(); }
      else showThinking();
    }, 220);
  }, 450);
}
function setThinkingStage(index) {
  const [eyebrow, title, copy] = thinkingStages[index];
  $('[data-thinking-eyebrow]').textContent = eyebrow;
  $('[data-thinking-title]').textContent = title;
  $('[data-thinking-copy]').textContent = copy;
}
function clearThinking() {
  clearTimeout(thinkingId);
  thinkingStageIds.forEach(clearTimeout);
  thinkingStageIds = [];
  catalogPromise = undefined;
}
function winningMood() {
  const scores = { spænding: 0, mysterie: 0, fantasi: 0, humor: 0, hygge: 0 };
  answers.forEach((answer, index) => scores[questions[index].answers[answer][2]]++);
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}
async function fetchCatalog(profile) {
  const response = await fetch(`${API_BASE}/bogtype?persona=${encodeURIComponent(profile.persona)}`);
  if (!response.ok) throw new Error("GO-kataloget svarede ikke");
  const data = await response.json();
  if (!Array.isArray(data.shelves) || !data.shelves.some(shelf => shelf.books?.length)) throw new Error("Ingen katalogresultater");
  return data;
}
function showThinking() {
  clearThinking();
  const mood = winningMood();
  catalogPromise = fetchCatalog(moodProfiles[mood]);
  show('thinking');
  setThinkingStage(0);
  thinkingStageIds = [
    window.setTimeout(() => setThinkingStage(1), 1300),
    window.setTimeout(() => setThinkingStage(2), 2700),
  ];
  thinkingId = window.setTimeout(() => renderResults(mood), 4000);
}
function fallbackCatalog(profile) {
  return { shelves: [{ title: "Et par gode steder at starte", query: "bøger", reason: profile.intro, books: [
    { title: "Ormehullet", author: "Merlin P. Mann", coverUrl: `${A}imgImage202.png`, sourceUrl: "../design-system-reference/vaerk.html", format: "EBOOK" },
    { title: "Brødrene Løvehjerte", author: "Astrid Lindgren", coverUrl: `${A}imgImage193.png`, sourceUrl: "../design-system-reference/vaerk.html", format: "EBOOK" },
    { title: "Ronja Røverdatter", author: "Astrid Lindgren", coverUrl: `${A}imgImage214.png`, sourceUrl: "../design-system-reference/vaerk.html", format: "AUDIO_BOOK_ONLINE" },
  ] }] };
}
function nextUnused(books, used) {
  return books.find(book => book?.id ? !used.has(book.id) : !used.has(book?.title));
}
function pickCard({ label, line, book, style }, index) {
  const cover = book.coverUrl || `${A}${fallbackCovers[index % fallbackCovers.length]}`;
  const href = book.sourceUrl || "https://go.bibliotek.kk.dk/search";
  return `<a class="result-pick ${style}" href="${escapeHTML(href)}" target="_blank" rel="noopener"><div class="pick-intro"><span class="pick-stamp">${label}</span><p class="pick-line">${line}</p></div><div class="pick-cover"><img src="${escapeHTML(cover)}" alt="Forside til ${escapeHTML(book.title)}" /></div><div class="pick-meta"><h2>${escapeHTML(book.title)}</h2><p>Af ${escapeHTML(book.author || "ukendt forfatter")}</p><span>${escapeHTML(book.reason || "Fundet i eReolen GO!-kataloget")}</span></div></a>`;
}
async function renderResults(mood) {
  const profile = moodProfiles[mood];
  let catalog;
  try { catalog = await catalogPromise; }
  catch { catalog = fallbackCatalog(profile); }
  if (!$('.idk-thinking').hidden) {
    $('[data-result-note]').textContent = profile.intro;
    const shelves = catalog.shelves.filter(shelf => shelf.books?.length).slice(0, 2);
    const firstShelf = shelves[0]?.books || [];
    const secondShelf = shelves[1]?.books || [];
    const used = new Set();
    const safe = nextUnused(firstShelf, used) || nextUnused([...firstShelf, ...secondShelf], used);
    if (safe) used.add(safe.id || safe.title);
    const weird = nextUnused(firstShelf, used) || nextUnused([...firstShelf, ...secondShelf], used) || safe;
    if (weird) used.add(weird.id || weird.title);
    const wildcard = nextUnused(secondShelf, used) || nextUnused([...firstShelf, ...secondShelf], used) || weird || safe;
    const picks = [
      { label: "DEN SIKRE", line: "Den her tror vi ret meget på.", book: safe, style: "pick-safe" },
      { label: "DEN LIDT MÆRKELIGE", line: "Stol på os.", book: weird, style: "pick-weird" },
      { label: "WILDCARD", line: "Den her havde du ALDRIG selv fundet.", book: wildcard, style: "pick-wild" },
    ].filter(pick => pick.book);
    $('[data-picks]').innerHTML = picks.map(pickCard).join("");
    show('results');
  }
}
function goBack() {
  clearThinking(); stopPendingAdvance();
  if (!$('.idk-question-screen').hidden) {
    if (step > 0) { step--; renderQuestion(); }
    else show('intro');
    return;
  }
  step = questions.length - 1;
  show('quiz');
  renderQuestion();
}
function restart() { clearThinking(); stopPendingAdvance(); step = 0; answers = []; show('quiz'); renderQuestion(); }
$('[data-start]').addEventListener('click', restart);
$$('[data-back]').forEach(button => button.addEventListener('click', goBack));
$$('[data-restart]').forEach(button => button.addEventListener('click', restart));
$$('[data-exit]').forEach(button => button.addEventListener('click', () => { clearThinking(); stopPendingAdvance(); show('intro'); }));
document.addEventListener('click', event => { const button = event.target.closest('[data-answer]'); if (button) selectAnswer(Number(button.dataset.answer)); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { clearThinking(); stopPendingAdvance(); show('intro'); } });

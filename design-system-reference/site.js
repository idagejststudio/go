const A = "./assets/";
const page = document.body.dataset.page || "home";
const app = document.querySelector("#app");
const searchQuery = new URLSearchParams(window.location.search).get("q") || "astrid lindgren";
const escapeHTML = value => value.replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));

const bookData = [
  ["Pippi Langstrømpe", "Astrid Lindgren", "imgImage213.png", "Lydbog"],
  ["Ronja Røverdatter", "Astrid Lindgren", "imgImage214.png", "E-bog"],
  ["Lotte fra Spektakelmagergade", "Astrid Lindgren", "imgImage219.png", "Lydbog"],
  ["Brødrene Løvehjerte", "Astrid Lindgren", "imgImage193.png", "E-bog"],
  ["Mio, min Mio", "Astrid Lindgren", "imgImage192.png", "Lydbog"],
  ["Vi på Krageøen", "Astrid Lindgren", "imgImage43.png", "E-bog"],
];

function header() {
  return `<div class="topbar">Bibliotekerne</div><header class="navigation">
    <a class="brand" href="./" aria-label="eReolen GO! forsiden"><img src="${A}go-logo.svg" alt="GO!" /></a>
    <button class="theme-toggle" type="button" aria-label="Skift farvetema"><span class="toggle-knob"><img src="${A}sun.svg" alt="" /></span></button>
    <nav class="nav-actions" aria-label="Hurtigmenu">
      <a class="round-button help-button" href="#footer" aria-label="Hjælp"><img src="${A}help.svg" alt="" /></a>
      <a class="round-button search-button" href="./soegning.html" aria-label="Søg"><img src="${A}search.svg" alt="" /></a>
      <a class="minside-link" href="./min-side.html">Min side</a><button class="round-button profile-trigger account-button" type="button" aria-label="Brugerprofil"><img src="${A}profile.svg" alt="" /></button>
    </nav>
  </header>`;
}

function searchbar() {
  return `<div class="search-strip"><form class="search-box" action="./soegning.html"><input name="q" aria-label="Søg efter bøger" placeholder="Søg" value="${page === "search" ? escapeHTML(searchQuery) : ""}" /><button aria-label="Søg"><img src="${A}search.svg" alt="" /></button></form><a class="recently-played" href="./vaerk.html"><span>Hop tilbage</span><span class="play-icon">▶</span><span class="book-thumb">GO!</span></a></div>`;
}

function categoryCards() {
  const cats = [["Kærlighed","category-love.png"],["Spænding","category-suspense.png"],["Gys","category-gys.png"],["Venskab","category-friendship.png"],["Gaming","category-gaming.png"],["Orla Prisen","category-orla.png"],["Science Fiction","category-last.png"]];
  return `<section class="categories"><div class="category-track">${cats.map(([n,img])=>`<a class="category-card" href="./kategori.html"><div class="category-image"><img src="${A+img}" alt="" /><button class="audio-button" type="button" aria-label="Lyt til ${n}" aria-pressed="false"><img src="${A}audio.svg" alt="" /></button></div><h2>${n}</h2></a>`).join("")}</div></section>`;
}

function cards(list = bookData, className = "") {
  return `<div class="book-grid ${className}">${list.map(([title,author,cover,type],i)=>`<a class="book-card" href="./vaerk.html"><div class="cover-wrap"><img src="${A+cover}" alt="Forside til ${title}" /><button class="favorite" aria-label="Gem ${title}" type="button">♡</button></div><div class="book-info"><strong>${title}</strong><span>${author}</span><div class="book-tags"><span>${type}</span><span>${i%2 ? "Blå titel" : "Nyhed"}</span></div></div></a>`).join("")}</div>`;
}

function footer() {
  return `<footer class="site-footer" id="footer"><div class="footer-brand"><img src="${A}go-logo.svg" alt="eReolen GO!"/><p>Læs, lyt og oplev gode historier – helt gratis gennem dit bibliotek.</p></div><div><h3>Om eReolen GO!</h3><a href="#footer">Sådan bruger du eReolen GO!</a><a href="#footer">Hjælp og support</a><a href="#footer">Tilgængelighed</a></div><div><h3>Bibliotekerne</h3><a href="#footer">Find dit bibliotek</a><a href="#footer">Opret bruger</a><a href="#footer">Kontakt</a></div><div class="footer-bottom">En del af eReolen · Bibliotekerne</div></footer>`;
}

function modal() {
  return `<div class="scrim" data-scrim hidden></div><section class="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="contact-copy" data-dialog hidden>
    <button class="close-button" type="button" aria-label="Luk brugerprofil" data-close><img src="${A}profile-close.svg" alt="" /></button><h1 id="dialog-title">Brugerprofil</h1>
    <form class="profile-form" data-profile-form novalidate><div class="field support-field"><label for="support-id">Support ID</label><input id="support-id" name="supportId" type="text" value="PZZ9XF" readonly /><p class="hint">Dit support-ID til brug ved henvendelser vedr. eReolen GO!</p></div>
    <div class="contact-copy" id="contact-copy">For at vi kan kontakte dig, når du har reservationer klar til lån, bedes du udfylde dit mobilnummer eller e-mailadresse i felterne nedenfor</div>
    <div class="field phone-field"><label for="phone">Mobil</label><div class="input-wrap"><span class="country-code">+45</span><input id="phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" aria-label="Dansk mobilnummer" /></div><p class="hint">Indtast et dansk mobilnummer</p></div>
    <div class="field email-field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" aria-label="Emailadresse" /></div><p class="form-message" aria-live="polite" data-message></p><button class="save-button" type="submit">GEM</button></form></section>`;
}

function home() {
  return `${searchbar()}${categoryCards()}<main class="page home-page">
    <section class="hero-bundle"><h1>Karla anbefaler Mit forheksede liv</h1><div class="bundle-scene"><img class="bundle-art" src="${A}imgGys6.png" alt="Karla anbefaler en bog"/><div class="recommender-card"><span>Srishti</span><strong>anbefaler</strong><img src="${A}imgBookCover.png" alt="Mit forheksede liv"/><button class="scene-play" aria-label="Afspil anbefaling">▶</button></div><a class="featured-book" href="./vaerk.html"><img src="${A}imgImage203.png" alt="Ormehullet af Merlin P. Mann"/><strong>Ormehullet</strong><span>Af Merlin P. Mann (2020)</span></a></div></section>
    <section class="editorial spot"><img src="${A}imgScreenshot20230926At12451.png" alt="Børn læser sammen på biblioteket"/><div><p class="eyebrow">BOGBATTLE</p><h2>Hold kæft, det er sjovt!</h2><p>Det er endelig blevet forår. Alt spirer og gror og får nyt liv. Vi får lyst til at komme ud og være aktive i naturen. Her er inspiration til både aktiviteter og den efterfølgende hyggestund i sofaen.</p><a class="pill-button" href="./kategori.html">Læs mere</a></div></section>
    <section class="video-feature"><p class="eyebrow">SE MED</p><h2>Gode historier er endnu bedre sammen</h2><div class="video-image" style="background-image:url('${A}imgImage203.png')"><button class="video-play" aria-label="Afspil video">▶</button></div></section>
    <section class="shelf"><div class="section-heading"><div><p class="eyebrow">NYT PÅ EREOLEN GO!</p><h2>Find din næste favorit</h2></div><a href="./filtre.html">Se alle bøger →</a></div>${cards()}</section>
    <section class="editorial craft"><img src="${A}imgHomeReco.png" alt="Børnebogen Nattik om eventyr i naturen"/><div><p class="eyebrow">INSPIRATION</p><h2>På eventyr i naturen</h2><p>Naturen er fyldt med alle mulige ting fx blade, blomster og sten, der kan bruges til små og store hobbyprojekter. Her er inspiration at hente.</p><a class="pill-button" href="./kategori.html">Læs mere</a></div></section>
    <section class="shelf"><div class="section-heading"><div><p class="eyebrow">POPULÆRE LIGE NU</p><h2>Bøger børn taler om</h2></div><a href="./filtre.html">Se alle →</a></div>${cards([...bookData].reverse())}</section>
  </main>`;
}

function work() {
  return `<main class="page work-page"><a class="back-link" href="./">← TILBAGE</a><section class="work-hero"><div class="work-cover"><img src="${A}imgImage33.png" alt="Vi snakker ikke om Jonathan af Katrine Skovgaard"/></div><button class="favorite work-favorite" aria-label="Gem i huskeliste">♡</button><div class="work-title"><h1>Vi snakker ikke<br/>om Jonathan</h1><p class="author">AF JENNY HAN</p></div><div class="work-actions"><button class="secondary-action">Prøv Lydbogen</button><button class="primary-action">Lån Lydbogen</button></div><div class="format-switch"><button class="selected">Lydbog</button><button>E-bog</button><button>Bog</button></div></section>
    <section class="detail-panel"><div class="description-copy"><p class="eyebrow">BESKRIVELSE</p><p>Hver gang Belly holder sommerferie ved havet, har hun altid haft et lille ønske om, at en af hendes venner, brødrene Conrad og Jeremiah, ville bemærke hende på samme måde, som hun bemærker dem. Men de har bare været venner. Så en sommer begynder tingene at ændre sig. De lange blikke. De pludseligt generte smil. Der blomstrer endelig følelser op – problemet er bare, at det ikke kun er én af brødrene, der viser interesse. Det er dem begge, og Belly aner ikke, hvad hun skal gøre.</p><p>Dette er bind 1 i trilogien Sommer, en romantisk serie om Belly og hendes svære valg mellem Conrad og Jeremiah.</p><p>Jenny Han er bl.a. også kendt for bøgerne om Lara Jean.</p></div><aside><p class="eyebrow">EMNEORD</p><div class="tags"><span>Forelskelse</span><span>Unge</span><span>Romaner</span><span>Young Adult</span><span>Følelser</span><span>Kærlighed</span></div><p class="eyebrow detail-label">SERIE</p><p>Nr. 1 i serien: Sommer</p><p class="eyebrow detail-label">ALDER</p><p>Fra ca. 12 år</p></aside></section>
    <section class="detail-panel details-panel"><div><p class="eyebrow">DETALJER</p><h2>Om bogen</h2><dl><div><dt>Ebogsformat</dt><dd>EPUB</dd></div><div><dt>Alder</dt><dd>Fra 11 år</dd></div><div><dt>Målgruppe</dt><dd>Børnematerialer</dd></div><div><dt>Forlag</dt><dd>Høst</dd></div><div><dt>Udgave</dt><dd>1. e-bogsudgave</dd></div><div><dt>ISBN</dt><dd>9788702340402</dd></div><div><dt>Genre</dt><dd>Humor</dd></div><div><dt>Sprog</dt><dd>Dansk</dd></div><div><dt>Type</dt><dd>Ebog</dd></div></dl></div></section>
    <section class="shelf"><div class="section-heading"><div><p class="eyebrow">MERE SOM DENNE</p><h2>Du vil måske også kunne lide</h2></div></div>${cards()}</section></main>`;
}

function account() {
  const loanCovers = ["imgImage43.png","imgImage44.png","imgImage45.png","imgImage46.png"];
  const savedCovers = ["imgImage189.png","imgImage191.png","imgImage190.png","imgImage193.png"];
  const coverRail = (covers, expiry = false) => `<div class="account-cover-rail">${covers.map((cover,i)=>`<a class="account-cover" href="./vaerk.html"><img src="${A+cover}" alt="Bog ${i+1} i din samling"/><button class="favorite" type="button" aria-label="Gem bog ${i+1}" aria-pressed="false">♡</button>${expiry?"<small>Udløber 29 dage</small>":""}</a>`).join("")}</div>`;
  return `${searchbar()}<main class="page account-page"><div class="account-heading"><div><p class="eyebrow">MIN SIDE</p><h1>Christine Louise Poulsen</h1><button type="button" class="account-settings profile-trigger">Brugerindstillinger</button></div><a class="secondary-action" href="./">Log ud</a></div>
    <section class="account-shelf loan-shelf"><div class="section-heading"><div><h2>Bøger jeg har lånt <span>(8)</span></h2></div><div class="rail-controls"><button data-scroll="-1" aria-label="Forrige bøger">←</button><button data-scroll="1" aria-label="Næste bøger">→</button><button class="pill-button find-similar-trigger" type="button" data-open-find-similar>Find noget ligesom</button></div></div>${coverRail(loanCovers,true)}</section>
    <section class="quota-grid"><article class="quota-card"><p>Kvote</p><div><span><b>4 af 10</b><small>E-bøger</small></span><span><b>0 af 10</b><small>Lydbøger</small></span></div></article><article class="quota-card"><p>Blå titler</p><div><span><b>2</b><small>E-bøger</small></span><span><b>2</b><small>Lydbøger</small></span></div></article></section>
    <section class="account-shelf"><div class="section-heading"><div><h2>Bøger, jeg vil huske til senere <span>(9)</span></h2></div><button class="text-button">Se alle →</button></div>${coverRail(savedCovers)}</section>
    <section class="account-shelf"><div class="section-heading"><div><h2>Mine favoritter</h2></div><button class="text-button">Se alle →</button></div>${coverRail(["imgImage192.png","imgImage48.png","imgImage43.png","imgImage45.png"])}</section></main>`;
}

function category() {
 return `${searchbar()}${categoryCards()}<main class="page category-page"><div class="category-intro"><p class="eyebrow">GÅ PÅ OPDAGELSE</p><h1>Science<br class="mobile-only"/> Fiction</h1><p>Tag med på eventyr i fremtiden, ud i rummet og ind i verdener, hvor alt kan ske.</p><a class="pill-button" href="./filtre.html">Find science fiction</a></div>
 <section class="editorial category-bundle"><img src="${A}imgSciFiBackdrop.png" alt="En lysende hval svømmer gennem et stjernehav"/><div><p class="eyebrow">UNIVERSETS MYSTERIER</p><h2>Sci-fi er mere end rumrejser</h2><p>Uendelige universer, fremmede verdener og historier, der får fantasien til at flyve. Her finder du science fiction for alle aldre.</p><a class="pill-button" href="./filtre.html">Gå på opdagelse</a></div></section>
 <section class="shelf"><div class="section-heading"><div><p class="eyebrow">SCIENCE FICTION</p><h2>Populære bøger</h2></div><a href="./filtre.html">Se alle →</a></div>${cards()}</section>
 <section class="editorial spot time-travel"><img src="${A}imgScreenshot20230926At12451.png" alt="Børn på eventyr sammen"/><div><p class="eyebrow">TID OG EVENTYR</p><h2>Gode bøger om vilde tidsrejser!</h2><p>Hvor sejt ville det lige være, hvis man kunne rejse i tiden? Mød vikinger, konger og superstjerner i bøgerne, der tager dig med på tur.</p><a class="pill-button" href="./filtre.html">Læs mere</a></div></section>
 <section class="category-video"><p class="eyebrow">VIDEOANBEFALING</p><h2>Carl anbefaler: X fra det ydre rum</h2><div class="video-image" style="background-image:url('${A}imgGys8.png')"><button class="video-play" aria-label="Afspil video">▶</button></div></section>
 <section class="shelf"><div class="section-heading"><div><p class="eyebrow">FLERE EVENTYR</p><h2>Læs videre i universet</h2></div><a href="./filtre.html">Se alle →</a></div>${cards([...bookData].reverse())}</section></main>`;
}

function filters() {
 return `${searchbar()}<main class="page results-page"><div class="result-heading"><div><p class="eyebrow">BØGER OG LYDBØGER</p><h1>Viser <span data-result-count>21.310</span> bøger</h1></div><button class="filter-toggle" data-filter-toggle>Filtrer <span>☷</span></button></div><div class="filter-layout"><aside class="filters-panel" data-filter-panel><div class="filter-title"><h2>Filtrer bøger</h2><button data-filter-close aria-label="Luk filtre">×</button></div><label class="filter-search">Søg i emner<input placeholder="Fx fantasy eller venskab"/></label>${[["Format","Lydbøger","E-bøger","Bøger"],["Alder","0–6 år","7–9 år","10–12 år","13–15 år"],["Sprog","Dansk","Engelsk"],["Tilgængelighed","Ledige nu","Blå titler"]].map(([title,...items])=>`<details open><summary>${title}<span>⌄</span></summary>${items.map((item,i)=>`<label class="check-row"><input type="checkbox"/><span>${item}</span><small>${[426,968,216][i%3]}</small></label>`).join("")}</details>`).join("")}<button class="pill-button apply-filters" data-apply>Vis bøger</button></aside><div class="results-content"><div class="result-toolbar"><span>Sortér efter</span><select aria-label="Sortér"><option>Anbefalet</option><option>Nyeste</option><option>Titel</option></select></div>${cards()}</div></div></main>`;
}

function searchPage() {
 return `${searchbar()}<main class="page search-page"><div class="result-heading"><div><p class="eyebrow">SØGERESULTATER</p><h1>Resultater for “${escapeHTML(searchQuery)}”</h1></div><button class="filter-toggle" data-filter-toggle>Filtrer <span>☷</span></button></div><div class="search-columns"><section class="search-suggestions"><p class="eyebrow">FORFATTERE</p><a href="./filtre.html" class="suggestion selected">Astrid Lindgren <span>Forfatter</span></a><a href="./filtre.html" class="suggestion">Astrid Lindgren-Jensen <span>Forfatter</span></a><hr/><p class="eyebrow">TITLER</p><a class="suggestion" href="./vaerk.html">Astrid Lindgrens klogebog <span>E-bog</span></a><a class="suggestion" href="./vaerk.html">Vi på Krageøen <span>Lydbog</span></a></section><section class="search-results"><div class="section-heading"><div><p class="eyebrow">BØGER OG LYDBØGER</p><h2>Populære resultater</h2></div><a href="./filtre.html">Filtrer resultater →</a></div>${cards()}</section></div></main>`;
}

const render = {home,work,account,category,filters,search: searchPage};
app.innerHTML = `<div class="home">${header()}${(render[page] || home)()}${footer()}</div>${modal()}`;

document.querySelectorAll(".favorite").forEach(button => button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); button.classList.toggle("is-saved"); button.setAttribute("aria-pressed", String(button.classList.contains("is-saved"))); button.textContent = button.classList.contains("is-saved") ? "♥" : "♡"; }));
document.querySelectorAll("[data-scroll]").forEach(button => button.addEventListener("click", () => { button.closest(".section-heading").nextElementSibling.scrollBy({left: Number(button.dataset.scroll) * 320, behavior: "smooth"}); }));
document.querySelector("[data-open-find-similar]")?.addEventListener("click", () => {
  if (window.parent !== window) window.parent.postMessage({type: "open-find-ligesom"}, "*");
  else window.location.href = "../find-ligesom/index.html";
});
window.addEventListener("message", event => {
  if (event.source === window.parent && event.data?.type === "focus-find-ligesom-trigger") document.querySelector("[data-open-find-similar]")?.focus();
});
document.querySelectorAll(".format-switch button").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".format-switch button").forEach(item => { item.classList.remove("selected"); item.setAttribute("aria-pressed", "false"); }); button.classList.add("selected"); button.setAttribute("aria-pressed", "true"); }));
document.querySelectorAll(".video-play").forEach(button => button.addEventListener("click", () => { button.textContent = button.textContent === "▶" ? "Ⅱ" : "▶"; }));
document.querySelectorAll(".scene-play").forEach(button => button.addEventListener("click", () => { button.textContent = button.textContent === "▶" ? "Ⅱ" : "▶"; }));
document.querySelectorAll(".audio-button").forEach(button => button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); const active = button.getAttribute("aria-pressed") !== "true"; button.setAttribute("aria-pressed", String(active)); button.classList.toggle("is-playing", active); }));
document.querySelector(".theme-toggle")?.addEventListener("click", event => { const active = document.body.classList.toggle("theme-dark"); event.currentTarget.setAttribute("aria-pressed", String(active)); });
const toggle = document.querySelector("[data-filter-toggle]");
if (toggle) { toggle.setAttribute("aria-expanded", "false"); toggle.addEventListener("click", () => { const panel = document.querySelector("[data-filter-panel]"); if (!panel) { window.location.href = "./filtre.html"; return; } panel.classList.toggle("is-open"); toggle.setAttribute("aria-expanded", String(panel.classList.contains("is-open"))); }); }
document.querySelector("[data-filter-close]")?.addEventListener("click", () => { document.querySelector("[data-filter-panel]").classList.remove("is-open"); toggle?.setAttribute("aria-expanded", "false"); toggle?.focus(); });
document.querySelector("[data-apply]")?.addEventListener("click", () => { document.querySelector("[data-filter-panel]").classList.remove("is-open"); toggle?.setAttribute("aria-expanded", "false"); const count = document.querySelector("[data-result-count]"); if(count) count.textContent = "2.486"; });
document.querySelector(".work-actions .primary-action")?.addEventListener("click", event => { event.currentTarget.textContent = "✓ Lydbogen er lånt"; event.currentTarget.setAttribute("aria-pressed", "true"); });
document.querySelector(".work-actions .secondary-action")?.addEventListener("click", event => { const button = event.currentTarget; const active = button.getAttribute("aria-pressed") === "true"; button.setAttribute("aria-pressed", String(!active)); button.textContent = active ? "Prøv Lydbogen" : "Ⅱ Afspiller uddrag"; });

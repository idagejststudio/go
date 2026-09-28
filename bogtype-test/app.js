const A = "../design-system-reference/assets/";
const API_BASE = new URLSearchParams(location.search).get("api") ||
  (["localhost", "127.0.0.1"].includes(location.hostname) && location.port !== "8787"
    ? "http://localhost:8787/api"
    : "/api");
const books = [
  ["Ormehullet", "Susanna Hartmann", "imgImage202.png"], ["Jagten på sandheden", "Kasper Hoff", "imgImage203.png"], ["Nedtælling", "Teri Terry", "imgImage48.png"], ["Den sultne larve Aldrigmæt", "Eric Carle", "imgImage193.png"], ["Mio, min Mio", "Astrid Lindgren", "imgImage192.png"], ["Pippi Langstrømpe", "Astrid Lindgren", "imgImage213.png"], ["Ronja Røverdatter", "Astrid Lindgren", "imgImage214.png"], ["Lotte fra Spektakelmagergade", "Astrid Lindgren", "imgImage219.png"]
];
const types = {
  Fantasten:{icon:"✦", color:"var(--sky)", heading:"Virkeligheden er overvurderet.", copy:"Den virkelige verden er fin nok … men hvorfor nøjes? Du vil have magi, mærkelige væsner, vilde verdener og ting, der måske kan ske i virkeligheden.", power:"Du kan forsvinde ind i en anden verden uden overhovedet at rejse dig fra sofaen.", shelf:"Når Fantasten har trængt for meget af en kedelig hverdag", shelfTwo:"Når Fantasten er klar til en rejse, langt langt væk", books:[0,1,2,3]},
  "Action-jægeren":{icon:"⚡",color:"var(--lavender)",heading:"Mere fart. Mere fare. Mere NU!",copy:"En historie må gerne starte med et brag. Helst allerede på første side.",power:"Du mærker spændingen, før den sker.",shelf:"Når Action-jægeren er klar til fuld fart",books:[1,2,0,6]},
  "Føle-følesen":{icon:"♥",color:"var(--lemon)",heading:"Fiktive personer. Ægte følelser.",copy:"Du læser med hele hjertet og går ikke af vejen for en lille tåre i øjenkrogen.",power:"Du kan mærke præcis, hvordan alle har det.",shelf:"Når Føle-følesen vil mærke det hele",books:[3,4,5,6]},
  "Mysterieslugeren":{icon:"?",color:"var(--mint)",heading:"Der er noget, der ikke stemmer…",copy:"Du samler spor, stiller spørgsmål og læser altid lige én side mere.",power:"Du kan lugte et plot-twist på lang afstand.",shelf:"Når Mysterieslugeren mangler spor",books:[0,1,2,7]},
  Humoristen:{icon:"☻",color:"var(--sky)",heading:"Skørt? Ja tak! Kaos? Endnu bedre.",copy:"Du elsker bøger, der får dig til at fnise midt i bussen – og det er helt okay.",power:"Du får selv de kedeligste dage til at smile.",shelf:"Når Humoristen trænger til et grin",books:[5,7,1,6]},
  Hverdagshelten:{icon:"☀",color:"var(--lemon)",heading:"Det vildeste sker lige midt i hverdagen.",copy:"Du kan godt lide historier om mennesker, der føles ægte – og store ting, der starter med små valg.",power:"Du opdager det særlige i det helt almindelige.",shelf:"Når Hverdagshelten vil læse noget, der føles ægte",books:[5,6,7,3]},
  Vidensslugeren:{icon:"⌕",color:"var(--lavender)",heading:"Jeg har lige ét spørgsmål mere…",copy:"Du vil vide hvordan, hvorfor og hvad der mon sker, hvis man lige undersøger det lidt mere.",power:"Du gør nysgerrighed til en superkraft.",shelf:"Når Vidensslugeren vil opdage noget nyt",books:[1,0,2,4]}
};
const questions = [
  {q:"Du finder en hemmelig dør. Hvad er bag den?",a:[["Spor og ledetråde", "Mysterieslugeren"],["En tunnel til et nyt sted","Fantasten"],["En ny opdagelse","Vidensslugeren"],["En verden med magi","Fantasten"],["Et sted som mit liv","Hverdagshelten"]]},
  {q:"Hvem er hovedpersonen?",visual:true,a:[["En rumfarer","Fantasten","🧑‍🚀","var(--lavender)"],["En superagent","Action-jægeren","🦸","var(--mint)"],["En sportsstjerne","Action-jægeren","⚽","var(--sky)"],["En almindelig person","Hverdagshelten","🧑","var(--lemon)"]]},
  {q:"Du får en superkraft. Hvilken?",a:[["Se når nogen lyver","Mysterieslugeren"],["Rejse til nye verdener","Fantasten"],["Mærke andres følelser","Føle-følesen"],["Løbe hurtigere end en bil","Action-jægeren"],["Få alle til at grine","Humoristen"],["Gøre en svær dag bedre","Hverdagshelten"]]},
  {q:"Din ven har nyheder. Hvad håber du?",a:[["En hemmelighed om en ven","Føle-følesen"],["En vild plan for os","Action-jægeren"],["En umulig opdagelse","Vidensslugeren"],["Noget pinligt og sjovt","Humoristen"],["Et mærkeligt spor","Mysterieslugeren"],["Noget jeg kan genkende","Hverdagshelten"]]},
  {q:"Hvor vil du være i en historie?",visual:true,a:[["Et hjem med drama","Føle-følesen","🏠","var(--lemon)"],["En fremmed planet","Fantasten","🪐","var(--sky)"],["Et gammelt slot","Mysterieslugeren","🏰","var(--lavender)"],["En almindelig by","Hverdagshelten","🏙️","var(--mint)"]]},
  {q:"Hvad er bedst ved en ny bog?",a:[["En helt ny verden","Fantasten"],["Ikke at kende slutningen","Mysterieslugeren"],["At møde en person, jeg holder af","Føle-følesen"],["At grine højt","Humoristen"],["At lære noget nyt","Vidensslugeren"],["At kunne genkende livet","Hverdagshelten"]]}
];
let step=0, picks=[], isAdvancing=false, catalogLoadId=0;
const $ = s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
function show(name){ $$('[data-screen]').forEach(x=>x.hidden=x.dataset.screen!==name); window.scrollTo(0,0); }
function drawQuiz(animate = false){ const item=questions[step], visual=$("[data-visual-answers]"), quizBody=$(".quiz-body"); $("[data-question]").textContent=item.q; $$('[data-count]').forEach(x=>x.textContent=`Spørgsmål ${step+1} af ${questions.length}`); $('[data-progress]').style.width=`${((step+1)/questions.length)*100}%`; $('[data-answers]').hidden=!!item.visual; visual.hidden=!item.visual; const html=item.a.map((a,i)=> item.visual?`<button class="visual-choice ${picks[step]===i?'is-selected':''}" type="button" data-answer="${i}"><span style="background:${a[3]}">${a[2]}</span><strong>${a[0]}</strong></button>`:`<button class="answer ${picks[step]===i?'is-selected':''}" type="button" data-answer="${i}">${a[0]}</button>`).join(""); (item.visual?visual:$('[data-answers]')).innerHTML=html; $('[data-next]').classList.toggle('is-ready',picks[step]!==undefined); if (animate) { quizBody.classList.remove('is-entering'); requestAnimationFrame(() => quizBody.classList.add('is-entering')); } }
function advanceAfterChoice(){
  if (isAdvancing || picks[step] === undefined) return;
  isAdvancing = true;
  const quizBody = $(".quiz-body");
  quizBody.classList.add("is-advancing");
  window.setTimeout(() => {
    quizBody.classList.add("is-leaving");
    window.setTimeout(() => {
      if (step === questions.length - 1) result();
      else { step++; drawQuiz(true); }
      quizBody.classList.remove("is-advancing", "is-leaving");
      isAdvancing = false;
    }, 180);
  }, 500);
}
function choose(index){ picks[step] = index; drawQuiz(); advanceAfterChoice(); }
const escapeHTML = value => String(value || "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));

function localBook(index) {
  const [title, author, cover] = books[index];
  const reasons = [
    "En gåde med spor, venskab og mod.",
    "Du kan gætte med, mens sporene dukker op.",
    "Højt tempo og en kamp mod tiden.",
    "En fin fortælling om at vokse og forandre sig.",
    "En magisk rejse med mod og venskab.",
    "En modig pige, der gør hverdagen til et eventyr.",
    "Venskab, mod og et stort eventyr.",
    "En sjov hverdagshistorie med masser af fantasi."
  ];
  return { title, author, coverUrl: A + cover, format: "E-bog", reason: reasons[index] };
}

function renderTypeBook(book) {
  const format = book.format === "AUDIO_BOOK_ONLINE" ? "Lydbog" : book.format || "E-bog";
  return `<a class="book-card" href="../design-system-reference/vaerk.html"><div class="cover-wrap"><img src="${escapeHTML(book.coverUrl || A + book.cover)}" alt="Forside til ${escapeHTML(book.title)}"/></div><div class="book-info"><strong>${escapeHTML(book.title)}</strong><span>${escapeHTML(book.author || "Ukendt forfatter")} · ${format}</span>${book.reason ? `<em>${escapeHTML(book.reason)}</em>` : ""}</div></a>`;
}

function renderFallbackCatalog(name) {
  const t=types[name];
  $('[data-shelf-heading]').textContent=t.shelf;
  $('[data-shelf-heading-two]').textContent=t.shelfTwo || `Når ${name} er klar til sit næste eventyr`;
  $('[data-books]').innerHTML=t.books.map(localBook).map(renderTypeBook).join('');
  $('[data-books-two]').innerHTML=t.books.map(book => localBook((book + 4) % books.length)).map(renderTypeBook).join('');
}

async function loadCatalog(name, loadId) {
  const state = $('[data-catalog-state]');
  state?.classList.remove('is-fallback');
  if (state) state.textContent = 'Finder bøger, der passer til din bogtype…';
  try {
    const catalog = await fetch(`${API_BASE}/bogtype?persona=${encodeURIComponent(name)}`, { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error('GO API unavailable');
      const data = await response.json();
      return data;
    });
    if (loadId !== catalogLoadId) return;
    const [primary, secondary] = catalog.shelves || [];
    if (!primary?.books?.length || !secondary?.books?.length) throw new Error('No catalogue books');
    $('[data-shelf-heading]').textContent = primary.title;
    $('[data-shelf-heading-two]').textContent = secondary.title;
    $('[data-books]').innerHTML = primary.books.map(renderTypeBook).join('');
    $('[data-books-two]').innerHTML = secondary.books.map(renderTypeBook).join('');
    if (state) state.textContent = 'Nye læsetips, der passer til din bogtype';
  } catch {
    if (loadId !== catalogLoadId) return;
    state?.classList.add('is-fallback');
    if (state) state.textContent = 'Viser udvalgte titler – prøv igen senere for flere forslag';
  }
}

function renderType(name, showResult = false){
  const t=types[name];
  $('[data-result-name]').textContent=name;
  $('[data-result-heading]').textContent=t.heading;
  $('[data-result-copy]').textContent=t.copy;
  $('[data-superpower]').textContent=t.power;
  $('[data-result-mark]').textContent=t.icon;
  $('[data-result-mark]').style.background=t.color;
  renderFallbackCatalog(name);
  $('[data-type-list]').innerHTML=Object.entries(types).filter(([n])=>n!==name).map(([n,x])=>`<button class="type-chip" type="button" data-type="${n}"><span style="background:${x.color}">${x.icon}</span><div><strong>${n}</strong><small>${x.heading}</small></div></button>`).join('');
  if(showResult) show('result');
  loadCatalog(name, ++catalogLoadId);
}
function result(){ const scores={}; picks.forEach((pick,i)=>{ const type=questions[i].a[pick][1]; scores[type]=(scores[type]||0)+1; }); const [name]=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0]||["Fantasten"]; renderType(name, true); }
$("[data-start]").addEventListener('click',()=>{step=0;picks=[];show('quiz');drawQuiz();});
document.addEventListener('click',e=>{ const answer=e.target.closest('[data-answer]'); if(answer) choose(Number(answer.dataset.answer)); const type=e.target.closest('[data-type]'); if(type){ renderType(type.dataset.type); window.scrollTo({top:0,behavior:'smooth'}); }});
$("[data-next]").addEventListener('click', advanceAfterChoice);
$("[data-back]").addEventListener('click',()=>{if(step) {step--;drawQuiz();} else show('intro');});
$$('[data-restart]').forEach(x=>x.addEventListener('click',()=>{picks=[];step=0;show('quiz');drawQuiz();}));
$$('[data-exit]').forEach(x=>x.addEventListener('click',()=>show('intro')));
$("[data-dismiss-check]")?.addEventListener('click', () => $(".type-check").classList.add('is-dismissed'));
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&picks[step]!==undefined&&!$('.quiz-screen').hidden) $('[data-next]').click(); if(e.key==='Escape')show('intro');});

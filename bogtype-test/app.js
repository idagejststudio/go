const A = "../design-system-reference/assets/";
const API_BASE = "http://localhost:8787/api";
const books = [
  ["Ormehullet", "Susanna Hartmann", "imgImage202.png"], ["Jagten på sandheden", "Kasper Hoff", "imgImage203.png"], ["Nedtælling", "Teri Terry", "imgImage48.png"], ["Brødrene Løvehjerte", "Astrid Lindgren", "imgImage193.png"], ["Mio, min Mio", "Astrid Lindgren", "imgImage192.png"], ["Pippi Langstrømpe", "Astrid Lindgren", "imgImage213.png"], ["Ronja Røverdatter", "Astrid Lindgren", "imgImage214.png"], ["Lotte fra Spektakelmagergade", "Astrid Lindgren", "imgImage219.png"]
];
const types = {
  Fantasten:{icon:"✦", color:"var(--sky)", heading:"Virkeligheden er overvurderet.", copy:"Den virkelige verden er fin nok … men hvorfor nøjes? Du vil have magi, mærkelige væsner, vilde verdener og ting, der måske kan ske i virkeligheden.", power:"Du kan forsvinde ind i en anden verden uden overhovedet at rejse dig fra sofaen.", shelf:"Når Fantasten har trængt for meget af en kedelig hverdag", shelfTwo:"Når Fantasten er klar til en rejse, langt langt væk", books:[0,1,2,3]},
  "Action-jægeren":{icon:"⚡",color:"var(--lavender)",heading:"Mere fart. Mere fare. Mere NU!",copy:"En historie må gerne starte med et brag. Helst allerede på første side.",power:"Du mærker spændingen, før den sker.",shelf:"Når Action-jægeren er klar til fuld fart",books:[1,2,0,6]},
  "Føle-følesen":{icon:"♥",color:"var(--lemon)",heading:"Fiktive personer. Ægte følelser.",copy:"Du læser med hele hjertet og går ikke af vejen for en lille tåre i øjenkrogen.",power:"Du kan mærke præcis, hvordan alle har det.",shelf:"Når Føle-følesen vil mærke det hele",books:[3,4,5,6]},
  "Mysterie­løseren":{icon:"?",color:"var(--mint)",heading:"Der er noget, der ikke stemmer…",copy:"Du samler spor, stiller spørgsmål og læser altid lige én side mere.",power:"Du kan lugte et plot-twist på lang afstand.",shelf:"Når Mysterieløseren mangler spor",books:[0,1,2,7]},
  Humoristen:{icon:"☻",color:"var(--sky)",heading:"Skørt? Ja tak! Kaos? Endnu bedre.",copy:"Du elsker bøger, der får dig til at fnise midt i bussen – og det er helt okay.",power:"Du får selv de kedeligste dage til at smile.",shelf:"Når Humoristen trænger til et grin",books:[5,7,1,6]},
  Vidensslugeren:{icon:"⌕",color:"var(--lavender)",heading:"Jeg har lige ét spørgsmål mere…",copy:"Du vil vide hvordan, hvorfor og hvad der mon sker, hvis man lige undersøger det lidt mere.",power:"Du gør nysgerrighed til en superkraft.",shelf:"Når Vidensslugeren vil opdage noget nyt",books:[1,0,2,4]}
};
const typeSearchTerms = {
  Fantasten: "fantasy",
  "Action-jægeren": "spænding",
  "Føle-følesen": "kærlighed",
  "Mysterie­løseren": "mystik",
  Humoristen: "humor",
  Vidensslugeren: "eventyr",
};
const apiTypeBooks = new Map();
const questions = [
  {q:"Du finder en dør, du aldrig har set før. Hvad håber du, der er bag den?",a:[["Et rum fyldt med spor", "Mysterie­løseren"],["En hemmelig tunnel, der fører langt væk","Fantasten"],["Noget ingen andre har opdaget før","Vidensslugeren"],["En anden verden, hvor alt kan ske","Fantasten"]]},
  {q:"Hvem vil du vælge som hovedperson?",visual:true,a:[["En rumrejsende","Fantasten","🧑‍🚀","var(--lavender)"],["En superagent","Action-jægeren","🦸","var(--mint)"],["En sportsstjerne","Action-jægeren","⚽","var(--sky)"]]},
  {q:"Du får en superkraft. Hvilken vælger du?",a:[["Du kan altid se, når nogen lyver","Mysterie­løseren"],["Du kan rejse til verdener, der ikke findes","Fantasten"],["Du kan altid mærke, hvordan andre har det","Føle-følesen"],["Du kan løbe hurtigere end en bil","Action-jægeren"],["Du kan få hvem som helst til at grine","Humoristen"]]},
  {q:"Din ven siger: “Jeg har noget VILDT at fortælle dig.” Hvad håber du, det er?",a:[["En hemmelighed om nogen, I kender","Føle-følesen"],["Noget vildt, I skal gøre sammen","Action-jægeren"],["At de har opdaget noget, der burde være umuligt","Vidensslugeren"],["Noget virkelig pinligt, der lige er sket","Humoristen"],["Noget mystisk, de har opdaget","Mysterie­løseren"]]},
  {q:"Hvilket sted ville du helst være i en historie?",visual:true,a:[["I et hjem med familiedrama","Føle-følesen","🏠","var(--lemon)"],["En fremmed planet","Fantasten","🪐","var(--sky)"],["Et gammelt slot","Mysterie­løseren","🏰","var(--lavender)"]]},
  {q:"Hvad er det BEDSTE ved at begynde på en ny bog?",a:[["At opdage en helt ny verden","Fantasten"],["At jeg ikke ved, hvad der kommer til at ske","Mysterie­løseren"],["At møde nogen, jeg kommer til at holde af","Føle-følesen"],["At den får mig til at trække på smilebåndet","Humoristen"],["At opdage noget nyt","Vidensslugeren"]]},
  {q:"Du får lov til at bestemme slutningen. Hvad vælger du?",a:[["Helten klarer det i ALLERSIDSTE sekund","Action-jægeren"],["Det hele ender på den mest åndssvage måde","Humoristen"],["Den sidste side afslører, at alt ikke var, som vi troede","Mysterie­løseren"],["De personer, der har været uvenner, finder hinanden igen","Føle-følesen"]]}
];
let step=0, picks=[], isAdvancing=false;
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
async function getApiBooksForType(name) {
  if (apiTypeBooks.has(name)) return apiTypeBooks.get(name);
  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(typeSearchTerms[name])}`);
    if (!response.ok) throw new Error("GO API unavailable");
    const results = (await response.json()).results || [];
    apiTypeBooks.set(name, results);
    return results;
  } catch {
    apiTypeBooks.set(name, []);
    return [];
  }
}

function localBook(index) {
  const [title, author, cover] = books[index];
  return { title, author, coverUrl: A + cover, sourceUrl: "../design-system-reference/vaerk.html" };
}

function renderTypeBook(book) {
  const href = book.sourceUrl || "../design-system-reference/vaerk.html";
  return `<a class="book-card" href="${href}"><div class="cover-wrap"><img src="${book.coverUrl || A + book.cover}" alt="Forside til ${book.title}"/></div><div class="book-info"><strong>${book.title}</strong><span>${book.author}</span></div></a>`;
}

async function renderType(name, showResult = false){
  const t=types[name];
  const apiBooks = await getApiBooksForType(name);
  const primaryBooks = apiBooks.length ? apiBooks.slice(0, 4) : t.books.map(localBook);
  const secondBooks = apiBooks.length > 4 ? apiBooks.slice(4, 8) : t.books.map(book => localBook((book + 4) % books.length));
  const bookCards=list=>list.map(renderTypeBook).join('');
  $('[data-result-name]').textContent=name;
  $('[data-result-heading]').textContent=t.heading;
  $('[data-result-copy]').textContent=t.copy;
  $('[data-superpower]').textContent=t.power;
  $('[data-shelf-heading]').textContent=t.shelf;
  $('[data-shelf-heading-two]').textContent=t.shelfTwo || `Når ${name} er klar til sit næste eventyr`;
  $('[data-result-mark]').textContent=t.icon;
  $('[data-result-mark]').style.background=t.color;
  $('[data-books]').innerHTML=bookCards(primaryBooks);
  $('[data-books-two]').innerHTML=bookCards(secondBooks);
  $('[data-type-list]').innerHTML=Object.entries(types).filter(([n])=>n!==name).map(([n,x])=>`<button class="type-chip" type="button" data-type="${n}"><span style="background:${x.color}">${x.icon}</span><div><strong>${n}</strong><small>${x.heading}</small></div></button>`).join('');
  if(showResult) show('result');
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

# GO prototype API

Fælles server-side adapter for de statiske prototyper. Adapteren søger i det offentlige GO-site for Københavns Biblioteker (`https://go.bibliotek.kk.dk`) med en anonym headless browser. Der bruges ikke login, bearer-token eller FBI-credentials. Søgeresultaterne begrænses til e-bøger og online-lydbøger.

## Start

Kræver Node.js 18 eller nyere:

```bash
cd go-api
npm start
```

API'et kører på `http://localhost:8787`.

Adapteren bruger systemets Google Chrome på macOS, hvis den findes. På andre maskiner kan browserens sti sættes med `BROWSER_PATH`.

## Endpoints

```text
GET /api/health
GET /api/search?q=Amalie%20Riemer
GET /api/work?id=work-of:870970-basis:143316947&type=EBOOK
GET /api/recommend?id=work-of:870970-basis:143316947&type=EBOOK&likes=humor,eventyr
GET /api/bogtype?persona=Fantasten
GET /api/mock
```

`/api/bogtype` er til bogtype-testen. Den henter to aktuelle, kuraterede hylder
for den valgte persona og returnerer de normaliserede GO-data inkl. forside,
format og link til det rigtige værk.

Alle katalogresultater valideres mod GO's aldersmetadata og begrænses til
værker, hvis fulde aldersinterval ligger inden for **9–15 år**. Værker uden
aldersmetadata eller med et interval uden for dette område returneres ikke.

Responsen normaliseres til:

```json
{
  "id": "work-of:...",
  "title": "...",
  "author": "...",
  "description": "...",
  "subjects": ["..."],
  "genres": ["..."],
  "age": "9-12",
  "pages": 184,
  "format": "EBOOK",
  "coverUrl": "https://...",
  "sourceUrl": "https://go.bibliotek.kk.dk/work/..."
}
```

Adapteren cacher svar i fem minutter. Sæt `MOCK_FALLBACK=1`, hvis prototypen skal kunne vise eksempeldata, når GO midlertidigt ikke kan nås.

## Brug fra en prototype

```js
const response = await fetch("http://localhost:8787/api/search?q=" + encodeURIComponent(query));
const { results } = await response.json();
```

Søgning og værksider renderes i en ren browser-context uden cookies eller login. Adapteren læser kun den synlige DOM, som en anonym bruger får. Det gør løsningen egnet til prototypen, men den er stadig afhængig af GO's offentlige side-layout; dette er ikke en officiel eReolen API.

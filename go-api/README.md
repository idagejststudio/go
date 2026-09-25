# GO prototype API

Fælles server-side adapter for de statiske prototyper. Adapteren bruger en anonym headless browser til at åbne GO's offentligt tilgængelige sider og ingen login, bearer-token eller FBI-credentials.

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
GET /api/work?id=work-of:870970-basis:143316947
GET /api/mock
```

Responsen normaliseres til:

```json
{
  "id": "work-of:...",
  "title": "...",
  "author": "...",
  "description": "...",
  "subjects": ["..."],
  "age": "9-12",
  "coverUrl": "https://...",
  "sourceUrl": "https://www.go.aakb.dk/work/..."
}
```

Adapteren cacher svar i fem minutter. Sæt `MOCK_FALLBACK=1`, hvis prototypen skal kunne vise eksempeldata, når GO midlertidigt ikke kan nås.

## Brug fra en prototype

```js
const response = await fetch("http://localhost:8787/api/search?q=" + encodeURIComponent(query));
const { results } = await response.json();
```

Søgning og værksider renderes i en ren browser-context uden cookies eller login. Adapteren læser kun den synlige DOM, som en anonym bruger får. Det gør løsningen egnet til prototypen, men den er stadig afhængig af GO's offentlige side-layout.

import http from "node:http";
import { URL } from "node:url";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const PORT = Number(process.env.PORT || 8787);
const TARGET_AGE_MIN = 9;
const TARGET_AGE_MAX = 15;
// The concept follows the Copenhagen GO site used by the eReolen GO design.
const GO_BASE_URL = process.env.GO_BASE_URL || "https://go.bibliotek.kk.dk";
const CACHE_TTL_MS = 5 * 60 * 1000;
const WORKSPACE_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cache = new Map();
let browser;
let browserContext;

const mockBooks = [
  {
    id: "mock:ormehullet",
    title: "Ormehullet",
    author: "Merlin P. Mann",
    description: "En eventyrlig fortælling om venskab, mod og mystik.",
    subjects: ["venskab", "mystik", "eventyr"],
    age: "9-12",
    coverUrl: null,
    sourceUrl: null,
  },
];

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

async function servePrototypeFile(pathname, res) {
  const allowed = [
    "/bogtype-test/", "/design-system-reference/", "/find-ligesom/",
    "/husk-din-huskeliste/", "/udelukkelsesfunktion/", "/ved-ikke-soegning/",
  ];
  if (!allowed.some((prefix) => pathname.startsWith(prefix))) return false;
  const filePath = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  if (!Object.hasOwn(mimeTypes, extname(filePath))) return false;
  const candidate = resolve(WORKSPACE_ROOT, `.${decodeURIComponent(filePath)}`);
  if (!candidate.startsWith(`${WORKSPACE_ROOT}/`)) return false;
  try {
    const file = await readFile(candidate);
    res.writeHead(200, { "content-type": mimeTypes[extname(candidate)] || "application/octet-stream" });
    res.end(file);
    return true;
  } catch {
    return false;
  }
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry || entry.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}

async function fetchGo(path) {
  const response = await fetch(`${GO_BASE_URL}${path}`, {
    headers: { accept: "text/html,application/xhtml+xml" },
  });
  if (!response.ok) throw new Error(`GO returned HTTP ${response.status}`);
  return response.text();
}

function browserExecutablePath() {
  if (process.env.BROWSER_PATH) return process.env.BROWSER_PATH;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find(existsSync);
}

async function getBrowserContext() {
  if (!browser || !browser.isConnected()) {
    const executablePath = browserExecutablePath();
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: ["--disable-dev-shm-usage"],
    });
    browserContext = await browser.newContext();
  }
  return browserContext;
}

async function withPublicGoPage(path, readPage) {
  const context = await getBrowserContext();
  const page = await context.newPage();
  try {
    await page.goto(`${GO_BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    return await readPage(page);
  } finally {
    await page.close();
  }
}

function parseWorkId(href) {
  if (!href) return null;
  let pathname = href;
  try { pathname = decodeURIComponent(new URL(href, GO_BASE_URL).pathname); } catch {}
  const match = pathname.match(/\/work\/(work-of:\d+-basis:\d+)/i);
  return match?.[1] || null;
}

function parseWorkLabel(label) {
  const value = label?.replace(/^Tilgå værket\s+/i, "").trim();
  if (!value) return { title: null, author: null };
  const separator = value.lastIndexOf(" af ");
  return separator === -1
    ? { title: value, author: null }
    : { title: value.slice(0, separator), author: value.slice(separator + 4) };
}

async function searchInPublicGo(query) {
  return withPublicGoPage(`/search?q=${encodeURIComponent(query)}`, async (page) => {
    // The empty-state shell can render before Next.js finishes hydrating the
    // actual catalogue query, so wait for results or let that request settle.
    await page.waitForFunction(() => /Viser\s+[\d.]+\s+resultater/i.test(document.body.innerText) || Boolean(document.querySelector('a[href*="/work/"]')), null, { timeout: 8000 }).catch(() => {});
    const pageText = await page.locator("body").innerText();
    const totalMatch = pageText.match(/Viser\s+([\d.]+)\s+resultater/i);
    const total = totalMatch ? Number(totalMatch[1].replaceAll(".", "")) : null;
    // GO can silently fall back to its entire catalogue for an unrecognized
    // query (for example, a random string plus punctuation). Do not show that
    // unfiltered list as if it matched the book the child entered.
    if (total >= 10000) return { results: [], total: null };
    const links = await page.locator('a[href*="/work/"]').evaluateAll((elements) => elements.slice(0, 80).map((element) => ({
      href: element.getAttribute("href"),
      label: element.getAttribute("aria-label") || element.textContent?.trim(),
      coverUrl: element.querySelector("img")?.getAttribute("src") || null,
    })));
    const results = links.map((link) => {
      const { title, author } = parseWorkLabel(link.label);
      const id = parseWorkId(link.href);
      const format = new URL(link.href, "https://catalog.invalid").searchParams.get("type");
      return {
        id,
        title,
        author,
        description: null,
        subjects: [],
        age: null,
        coverUrl: link.coverUrl,
        format,
        sourceUrl: id ? `${GO_BASE_URL}/work/${encodeURIComponent(id)}?type=${encodeURIComponent(format || "EBOOK")}` : null,
      };
    }).filter((book) => book.id && book.title && ["EBOOK", "AUDIO_BOOK_ONLINE"].includes(book.format));
    return { results, total };
  });
}

async function workFromPublicGo(id, format = "EBOOK") {
  return withPublicGoPage(`/work/${encodeURIComponent(id)}?type=${encodeURIComponent(format)}`, async (page) => {
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 20000 });
    return page.locator("body").evaluate((body) => {
      const text = (element) => element?.textContent?.replace(/\s+/g, " ").trim() || null;
      const heading = (value) => [...body.querySelectorAll("h2")].find((element) => text(element)?.toLowerCase() === value);
      const definition = (term) => {
        const element = [...body.querySelectorAll("dt")].find((item) => text(item)?.toLowerCase() === term);
        return text(element?.nextElementSibling);
      };
      const descriptionHeading = heading("beskrivelse");
      const subjectHeading = [...body.querySelectorAll("dt")].find((element) => text(element)?.toLowerCase() === "emneord");
      const genreHeading = [...body.querySelectorAll("dt")].find((element) => text(element)?.toLowerCase() === "genre");
      const yearHeading = [...body.querySelectorAll("dt")].find((element) => text(element)?.toLowerCase() === "udgivelsesår");
      const extent = definition("sidetal") || definition("omfang");
      const cover = [...body.querySelectorAll("img")].find((element) => /forsidebillede/i.test(element.getAttribute("alt") || ""));
      return {
        title: text(body.querySelector("h1")),
        author: text(body.querySelector("h2 a")),
        description: text(descriptionHeading?.parentElement?.querySelector(".wysiwyg p") || descriptionHeading?.nextElementSibling),
        subjects: [...(subjectHeading?.nextElementSibling?.querySelectorAll("a") || [])].map(text).filter(Boolean),
        genres: text(genreHeading?.nextElementSibling)?.split(/[,;]\s*/).filter(Boolean) || [],
        year: text(yearHeading?.nextElementSibling),
        age: definition("alder"),
        pages: extent ? Number(extent.match(/\d+/)?.[0]) || null : null,
        coverUrl: cover?.getAttribute("src") || cover?.getAttribute("data-src") || null,
      };
    });
  });
}

// Next.js streams data as self.__next_f.push([1, "..."]). Decode those
// strings without executing any page JavaScript.
function extractRscText(html) {
  const chunks = [];
  const pattern = /self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g;
  for (const match of html.matchAll(pattern)) {
    try {
      chunks.push(JSON.parse(match[1]));
    } catch {
      // Ignore malformed/non-data Next.js chunks.
    }
  }
  return chunks.join("\n");
}

function readJsonObject(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) {
      try {
        return JSON.parse(text.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function extractWorkObjects(rsc) {
  const works = [];
  let cursor = 0;
  while ((cursor = rsc.indexOf('{"workId"', cursor)) !== -1) {
    const work = readJsonObject(rsc, cursor);
    if (work) works.push(work);
    cursor += 9;
  }
  return works;
}

function first(values) {
  return Array.isArray(values) ? values[0] ?? null : values ?? null;
}

function displayValues(values) {
  return (Array.isArray(values) ? values : []).map((value) =>
    typeof value === "string" ? value : value?.display,
  ).filter(Boolean);
}

function normalizeWork(work, format = "EBOOK") {
  const representation = work.bestRepresentation || work.manifestations?.all?.[0] || work;
  const cover = representation.cover || work.cover || {};
  const author = first(work.creators)?.display || null;
  return {
    id: work.workId || representation.pid || null,
    title: first(work.titles?.full || representation.titles?.full),
    author,
    description: first(work.abstract),
    subjects: displayValues(representation.subjects?.all || work.subjects?.all),
    genres: displayValues(representation.genres?.all || work.genres?.all),
    year: first(representation.publication?.year || representation.publicationYear || work.publication?.year),
    age: first(representation.audience?.ages || work.audience?.ages)?.display || null,
    pages: Number(first(representation.extent?.pages || representation.pages || work.extent?.pages || work.pages)) || null,
    coverUrl: cover.large?.url || cover.medium?.url || cover.thumbnail || null,
    sourceUrl: work.workId
      ? `${GO_BASE_URL}/work/${encodeURIComponent(work.workId)}?type=${encodeURIComponent(format)}`
      : null,
    materialType: representation.materialTypes?.[0]?.materialTypeSpecific?.display || null,
  };
}

async function search(query) {
  const key = `search:${query.toLocaleLowerCase("da")}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const response = await searchInPublicGo(query);
  // Search cards do not expose audience metadata. Enrich the visible results
  // from their work pages before returning them, so every consumer gets the
  // same 9–15 age guard rather than having to implement its own filter.
  // Fetching every visible result page creates dozens of concurrent browser
  // navigations for a single keystroke. Only enrich the leading candidates;
  // the work endpoint still validates age when a child selects a result.
  const candidates = response.results.slice(0, 8);
  const enriched = await Promise.all(candidates.map(async (book) => {
    try { return { ...book, ...(await getWork(book.id, book.format)) }; }
    catch { return null; }
  }));
  const results = enriched.filter((book) => isInTargetAge(book?.age) && matchesCatalogQuery(book, query));
  return cacheSet(key, {
    query,
    ...response,
    results,
    ageFilter: `${TARGET_AGE_MIN}-${TARGET_AGE_MAX}`,
    source: "public-go-browser",
  });
}

// Search cards already contain the information needed to start the
// exclusion flow. Unlike search(), this route deliberately avoids opening a
// detail page for every result before responding; the chosen books are
// enriched later through /api/work.
async function searchFast(query) {
  const key = `search-fast:${query.toLocaleLowerCase("da")}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const response = await searchInPublicGo(query);
  return cacheSet(key, {
    query,
    ...response,
    results: response.results.slice(0, 30),
    source: "public-go-browser-fast",
  });
}

async function getWork(id, format = "EBOOK") {
  const safeFormat = ["EBOOK", "AUDIO_BOOK_ONLINE"].includes(format) ? format : "EBOOK";
  const key = `work:${id}:${safeFormat}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const work = await workFromPublicGo(id, safeFormat);
  return cacheSet(key, {
    id,
    ...work,
    subjects: work.subjects || [],
    format: safeFormat,
    sourceUrl: `${GO_BASE_URL}/work/${encodeURIComponent(id)}?type=${safeFormat}`,
    source: "public-go-browser",
  });
}

const recommendationSearches = {
  humor: ["sjove bøger", "humor"],
  spænding: ["spænding"],
  eventyr: ["eventyr"],
  venskab: ["venskab"],
  fantasy: ["fantasy"],
  illustrationer: ["billedbøger"],
  dyr: ["dyr"],
};

// Curated discovery routes for the book-type experience. The searches are
// intentionally broad enough to surface a changing catalogue, while each
// shelf retains a clear reading mood instead of pretending to know a child’s
// exact preference from a short quiz.
const bookTypeProfiles = {
  "Fantasten": {
    shelves: [
      { title: "Når Fantasten trænger til noget magisk", queries: ["fantasy", "magiske verdener"], reason: "Magi og verdener, hvor alt kan ske" },
      { title: "Når Fantasten vil rejse langt væk", queries: ["science fiction", "eventyr"], reason: "Fremtid, fjerne planeter og store eventyr" },
    ],
  },
  "Action-jægeren": {
    shelves: [
      { title: "Når Action-jægeren har brug for fuld fart", queries: ["action", "spænding"], reason: "Højt tempo, fare og mod" },
      { title: "Når Action-jægeren er klar til en mission", queries: ["hemmelige agenter", "science fiction"], reason: "Missioner, teknologi og kampen mellem godt og ondt" },
    ],
  },
  "Føle-følesen": {
    shelves: [
      { title: "Når Føle-følesen har lyst til at mærke det hele", queries: ["kærlighed", "venskab"], reason: "Kærlighed, venskab og store følelser" },
      { title: "Når Føle-følesen har brug for et varmt kram", queries: ["familie", "sorg"], reason: "Nære familier og historier, der godt må gøre lidt ondt" },
    ],
  },
  "Mysterieslugeren": {
    shelves: [
      { title: "Når Mysterieslugeren mangler et spor", queries: ["krimi", "mysterier"], reason: "Mysterier, spor og hemmeligheder" },
      { title: "Når Mysterieslugeren vil gætte med", queries: ["gåder", "detektiv"], reason: "Hvem-har-gjort-det og skarpe hjerner" },
    ],
  },
  "Humoristen": {
    shelves: [
      { title: "Når Humoristen trænger til et godt grin", queries: ["humor", "sjove bøger"], reason: "Skæve historier og latter" },
      { title: "Når Humoristen gerne vil have kaos", queries: ["tegneserier", "satire"], reason: "Tegninger, comedy og skøre påfund" },
    ],
  },
  "Hverdagshelten": {
    shelves: [
      { title: "Når Hverdagshelten vil genkende noget fra sit eget liv", queries: ["realisme", "familie"], reason: "Virkelige liv, familier og relaterbare valg" },
      { title: "Når Hverdagshelten har brug for en fortælling tæt på", queries: ["skole", "venskab"], reason: "Hverdag, venskaber og ting, man kender" },
    ],
  },
  "Vidensslugeren": {
    shelves: [
      { title: "Når Vidensslugeren vil opdage noget nyt", queries: ["fakta", "videnskab"], reason: "Virkeligheden, videnskab og nye opdagelser" },
      { title: "Når Vidensslugeren vil lave noget selv", queries: ["gør det selv", "opfindelser"], reason: "DIY, idéer og ting, der kan prøves af" },
    ],
  },
};

async function booksForType(persona) {
  const profile = bookTypeProfiles[persona];
  if (!profile) return null;
  const shelves = await Promise.all(profile.shelves.map(async (shelf) => {
    const queries = shelf.queries || [shelf.query];
    const searches = await Promise.all(queries.map((query) => search(query)));
    const seen = new Set();
    return {
      ...shelf,
      query: queries.join(", "),
      books: searches.flatMap(({ results }) => results).filter((book) => {
        if (!book.id || seen.has(book.id)) return false;
        seen.add(book.id);
        return true;
      }).slice(0, 4).map((book) => ({ ...book, reason: shelf.reason })),
    };
  }));
  return { persona, shelves, source: "public-go-catalog" };
}

function normalizeTerms(values = []) {
  return values.map((value) => value.toLocaleLowerCase("da").replace(/[.:]/g, "").trim()).filter(Boolean);
}

function ageRange(value) {
  const match = String(value || "").match(/(\d+)\s*[-–]\s*(\d+)/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

function isInTargetAge(age) {
  const range = ageRange(age);
  return Boolean(range && range[0] >= TARGET_AGE_MIN && range[1] <= TARGET_AGE_MAX);
}

function matchesCatalogQuery(book, query) {
  const ignored = new Set(["den", "det", "de", "en", "et", "og", "i", "på", "af", "med", "til", "fra", "år"]);
  const tokenize = (value) => (normalizeTerms([value || ""])[0] || "")
    .split(/[^a-zæøå0-9]+/i)
    .filter((term) => term.length > 1 && !/^\d+$/.test(term) && !ignored.has(term));
  const queryTerms = tokenize(query);
  if (!queryTerms.length) return true;
  const searchable = new Set(tokenize([
    book.title,
    book.author,
    ...(book.subjects || []),
    ...(book.genres || []),
  ].filter(Boolean).join(" ")));
  const matched = queryTerms.filter((term) => searchable.has(term)).length;
  return matched / queryTerms.length >= (queryTerms.length > 2 ? 0.6 : 1);
}

async function recommend(id, likes, format = "EBOOK") {
  const selected = await getWork(id, format);
  const keys = likes.filter((like) => recommendationSearches[like]);
  if (!keys.length) return { selected, results: [] };

  const selectedAge = ageRange(selected.age);
  const ageHint = selectedAge
    ? `${Math.max(TARGET_AGE_MIN, selectedAge[0])}-${Math.min(TARGET_AGE_MAX, selectedAge[1] + 1)}`
    : "9-15";
  const preferenceQueries = keys.flatMap((key) => recommendationSearches[key].map((term) => `${term} ${ageHint}`));
  const queries = [...new Set(preferenceQueries)];
  // Recommendation discovery only needs titles, ids and cover art. Defer
  // metadata lookups until after merging/ranking instead of enriching every
  // result of every query.
  const resultSets = await Promise.all(queries.map((query) => searchFast(query)));
  const candidates = new Map();
  const addCandidates = (sets, terms, preferenceMatch) => sets.forEach((set, queryIndex) => set.results.forEach((book, rank) => {
    if (!book.id || book.id === id) return;
    const current = candidates.get(book.id) || { ...book, queryMatches: [], preferenceMatches: [], rankScore: 0 };
    current.queryMatches.push(terms[queryIndex]);
    if (preferenceMatch) current.preferenceMatches.push(...keys.filter((key) => recommendationSearches[key].some((term) => terms[queryIndex].startsWith(term))));
    current.rankScore += Math.max(0, 24 - rank) + (preferenceMatch ? 24 : 0);
    candidates.set(book.id, current);
  }));
  addCandidates(resultSets, queries, true);
  const franchiseTerms = normalizeTerms(selected.subjects.slice(0, 1)).filter((term) => term.length >= 5);
  const eligibleCandidates = () => [...candidates.values()]
    .filter((candidate) => !franchiseTerms.some((term) => normalizeTerms([candidate.title])[0]?.includes(term)));
  const readDetails = async (candidateList) => Promise.all(candidateList.map(async (candidate) => {
    try { return { ...candidate, ...(await getWork(candidate.id, candidate.format)) }; }
    catch { return candidate; }
  }));
  const ignoredTerms = new Set([...franchiseTerms, "romaner", "piger", "børn", "venner"]);
  const sourceTerms = new Set(normalizeTerms([...selected.subjects.slice(1), ...selected.genres]).filter((term) => !ignoredTerms.has(term)));
  const rankDetails = (details) => details.map((book) => {
    const bookTerms = normalizeTerms([...book.subjects || [], ...book.genres || []]);
    const shared = bookTerms.filter((term) => sourceTerms.has(term));
    const sourceAge = ageRange(selected.age);
    const candidateAge = ageRange(book.age);
    const sameAge = sourceAge && candidateAge && candidateAge[0] <= sourceAge[1] && sourceAge[0] <= candidateAge[1];
    const ageMismatch = sourceAge && candidateAge
      && (candidateAge[1] <= sourceAge[0] || candidateAge[0] >= sourceAge[1]);
    return { ...book, shared, ageMismatch, score: book.rankScore + shared.length * 16 + (sameAge ? 12 : 0) };
  }).filter((book) => isInTargetAge(book.age) && !book.ageMismatch).sort((a, b) => b.score - a.score);
  let details = await readDetails(eligibleCandidates().slice(0, 8));
  let ranked = rankDetails(details);
  // If preference matches are too narrow after age/franchise filtering, use
  // the source work's genre as a low-priority fallback to fill the shelf.
  const fallbackGenre = selected.genres.find((genre) => genre && !queries.includes(genre)) || selected.genres[0];
  if (ranked.length < 3 && fallbackGenre && !queries.includes(fallbackGenre)) {
    const existingIds = new Set(candidates.keys());
    addCandidates([await searchFast(fallbackGenre)], [fallbackGenre], false);
    const added = eligibleCandidates().filter((candidate) => !existingIds.has(candidate.id));
    details = [...details, ...await readDetails(added.slice(0, 8))];
    ranked = rankDetails(details);
  }

  return {
    selected,
    results: ranked.slice(0, 3).map((book) => ({
      ...book,
      reason: book.preferenceMatches[0]
        ? `Fundet via ${recommendationSearches[book.preferenceMatches[0]][0]}`
        : book.shared[0] ? `Har også ${book.shared[0].toLocaleLowerCase("da")}` : "Et nyt fund til din læseliste",
    })),
    source: "public-go-catalog",
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === "/") {
      res.writeHead(302, { location: "/design-system-reference/" });
      return res.end();
    }
    if (await servePrototypeFile(url.pathname, res)) return;
    if (url.pathname === "/api/health") return json(res, 200, { ok: true });
    if (url.pathname === "/api/mock") return json(res, 200, { results: mockBooks, ageFilter: `${TARGET_AGE_MIN}-${TARGET_AGE_MAX}` });

    if (url.pathname === "/api/search") {
      const query = url.searchParams.get("q")?.trim();
      if (!query) return json(res, 400, { error: "Parameteren q mangler" });
      return json(res, 200, await search(query));
    }

    if (url.pathname === "/api/search-fast") {
      const query = url.searchParams.get("q")?.trim();
      if (!query) return json(res, 400, { error: "Parameteren q mangler" });
      return json(res, 200, await searchFast(query));
    }

    if (url.pathname === "/api/work") {
      const id = url.searchParams.get("id")?.trim();
      const format = url.searchParams.get("type") || "EBOOK";
      if (!id || !/^work-of:\d{6}-basis:\d+$/.test(id)) {
        return json(res, 400, { error: "id skal være et gyldigt GO work-id" });
      }
      const work = await getWork(id, format);
      if (!isInTargetAge(work.age)) return json(res, 404, { error: "Værket er uden for aldersgruppen 9-15 år" });
      return json(res, 200, work);
    }

    if (url.pathname === "/api/recommend") {
      const id = url.searchParams.get("id")?.trim();
      const likes = (url.searchParams.get("likes") || "").split(",").map((value) => value.trim()).filter(Boolean);
      if (!id || !/^work-of:\d{6}-basis:\d+$/.test(id)) {
        return json(res, 400, { error: "id skal være et gyldigt GO work-id" });
      }
      const selected = await getWork(id, url.searchParams.get("type") || "EBOOK");
      if (!isInTargetAge(selected.age)) return json(res, 404, { error: "Værket er uden for aldersgruppen 9-15 år" });
      return json(res, 200, await recommend(id, likes, url.searchParams.get("type") || "EBOOK"));
    }

    if (url.pathname === "/api/bogtype") {
      const persona = url.searchParams.get("persona")?.trim();
      const result = await booksForType(persona);
      if (!result) return json(res, 400, { error: "Ukendt bogtype" });
      return json(res, 200, result);
    }

    return json(res, 404, { error: "Ukendt endpoint" });
  } catch (error) {
    if (process.env.MOCK_FALLBACK === "1") {
      return json(res, 200, { results: mockBooks, source: "mock-fallback", error: error.message });
    }
    return json(res, 502, { error: "Kunne ikke hente data fra GO", detail: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`GO prototype API lytter på http://localhost:${PORT}`);
});

async function closeBrowser() {
  await browser?.close();
  browser = undefined;
  browserContext = undefined;
}

process.once("SIGINT", async () => { await closeBrowser(); process.exit(0); });
process.once("SIGTERM", async () => { await closeBrowser(); process.exit(0); });

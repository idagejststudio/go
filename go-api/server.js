import http from "node:http";
import { URL } from "node:url";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

const PORT = Number(process.env.PORT || 8787);
const GO_BASE_URL = "https://www.go.aakb.dk";
const CACHE_TTL_MS = 5 * 60 * 1000;
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
    age: null,
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
  const match = href?.match(/\/work\/work-of%3A(\d+-basis(?:%3A|:)\d+)/i);
  return match ? `work-of:${match[1].replace(/%3A/i, ":")}` : null;
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
    await page.locator('a[href^="/work/"]').first().waitFor({ state: "visible", timeout: 20000 });
    const links = await page.locator('a[href^="/work/"]').evaluateAll((elements) => elements.slice(0, 24).map((element) => ({
      href: element.getAttribute("href"),
      label: element.getAttribute("aria-label") || element.textContent?.trim(),
      coverUrl: element.querySelector("img")?.getAttribute("src") || null,
    })));
    return links.map((link) => {
      const { title, author } = parseWorkLabel(link.label);
      const id = parseWorkId(link.href);
      return {
        id,
        title,
        author,
        description: null,
        subjects: [],
        age: null,
        coverUrl: link.coverUrl,
        sourceUrl: id ? `${GO_BASE_URL}/work/${encodeURIComponent(id)}?type=EBOOK` : null,
      };
    }).filter((book) => book.id);
  });
}

async function workFromPublicGo(id) {
  return withPublicGoPage(`/work/${encodeURIComponent(id)}?type=EBOOK`, async (page) => {
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
      const cover = [...body.querySelectorAll("img")].find((element) => /forsidebillede/i.test(element.getAttribute("alt") || ""));
      return {
        title: text(body.querySelector("h1")),
        author: text(body.querySelector("h2 a")),
        description: text(descriptionHeading?.parentElement?.querySelector(".wysiwyg p") || descriptionHeading?.nextElementSibling),
        subjects: [...(subjectHeading?.nextElementSibling?.querySelectorAll("a") || [])].map(text).filter(Boolean),
        age: definition("alder"),
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

function normalizeWork(work) {
  const representation = work.bestRepresentation || work.manifestations?.all?.[0] || work;
  const cover = representation.cover || work.cover || {};
  const author = first(work.creators)?.display || null;
  return {
    id: work.workId || representation.pid || null,
    title: first(work.titles?.full || representation.titles?.full),
    author,
    description: first(work.abstract),
    subjects: displayValues(representation.subjects?.all || work.subjects?.all),
    age: first(representation.audience?.ages || work.audience?.ages)?.display || null,
    coverUrl: cover.large?.url || cover.medium?.url || cover.thumbnail || null,
    sourceUrl: work.workId
      ? `${GO_BASE_URL}/work/${encodeURIComponent(work.workId)}?type=EBOOK`
      : null,
    materialType: representation.materialTypes?.[0]?.materialTypeSpecific?.display || null,
  };
}

async function search(query) {
  const key = `search:${query.toLocaleLowerCase("da")}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const results = await searchInPublicGo(query);
  return cacheSet(key, { query, results, source: "public-go-browser" });
}

async function getWork(id) {
  const key = `work:${id}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const work = await workFromPublicGo(id);
  return cacheSet(key, {
    id,
    ...work,
    subjects: work.subjects || [],
    sourceUrl: `${GO_BASE_URL}/work/${encodeURIComponent(id)}?type=EBOOK`,
    source: "public-go-browser",
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === "/api/health") return json(res, 200, { ok: true });
    if (url.pathname === "/api/mock") return json(res, 200, { results: mockBooks });

    if (url.pathname === "/api/search") {
      const query = url.searchParams.get("q")?.trim();
      if (!query) return json(res, 400, { error: "Parameteren q mangler" });
      return json(res, 200, await search(query));
    }

    if (url.pathname === "/api/work") {
      const id = url.searchParams.get("id")?.trim();
      if (!id || !/^work-of:\d{6}-basis:\d+$/.test(id)) {
        return json(res, 400, { error: "id skal være et gyldigt GO work-id" });
      }
      return json(res, 200, await getWork(id));
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

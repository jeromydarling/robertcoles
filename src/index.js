/**
 * Robert Coles — A Memorial & Reader's Companion
 * Cloudflare Worker: serves the static site (via the ASSETS binding) and a
 * live API that pulls from the Internet Archive and Open Library.
 *
 * Design principle: EVERY binding is optional. With no bindings at all the
 * site still works and the archive proxy still runs (using the built-in
 * Cache API). Each provisioned binding lights up one more capability:
 *   DB         (D1)        – canonical catalog & search log
 *   CACHE      (KV)        – durable cross-request cache for archive responses
 *   MEDIA      (R2)        – cached cover images
 *   AI         (Workers AI)– embeddings + grounded answers
 *   VECTORIZE  (Vectorize) – semantic search over the corpus
 */

import { CATALOG, CATEGORIES } from "./catalog.js";
import { MAP_POINTS, MAP_ARCS, MAP_BOUNDS, LEGEND } from "./places.js";

const UA = "RobertColesMemorial/1.0 (+archive integration; respectful caching)";
const IA = "https://archive.org";
const DAY = 86400;

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------
const json = (data, init = {}) =>
  new Response(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", ...(init.headers || {}) },
    status: init.status || 200,
  });

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Layered cache: edge Cache API → KV (if present) → origin fetch. */
async function cached(env, key, ttl, producer) {
  const cacheKey = new Request(`https://cache.coles.local/${encodeURIComponent(key)}`);
  const edge = caches.default;
  const hit = await edge.match(cacheKey);
  if (hit) return hit.json();

  if (env.CACHE) {
    const kv = await env.CACHE.get(key, "json");
    if (kv) {
      await edge.put(cacheKey, json(kv, { headers: { "cache-control": `public, max-age=${ttl}` } }));
      return kv;
    }
  }

  const value = await producer();
  const resp = json(value, { headers: { "cache-control": `public, max-age=${ttl}` } });
  await edge.put(cacheKey, resp.clone());
  if (env.CACHE) await env.CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
  return value;
}

async function iaFetch(url) {
  const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
  if (!r.ok) throw new Error(`archive.org ${r.status} for ${url}`);
  return r.json();
}

// ---------------------------------------------------------------------------
// Internet Archive integration
// ---------------------------------------------------------------------------

/** Search the Archive's catalog of Coles items. */
async function archiveSearch(env, q, rows = 60) {
  const creator = env.ARCHIVE_CREATOR || "Coles, Robert";
  const query = q
    ? `(${q}) AND creator:("${creator}")`
    : `creator:("${creator}")`;
  const fl = ["identifier", "title", "year", "mediatype", "subject", "publisher", "access-restricted-item"]
    .map((f) => `fl[]=${f}`).join("&");
  const url = `${IA}/advancedsearch.php?q=${encodeURIComponent(query)}&${fl}&rows=${rows}&sort[]=year+asc&output=json`;
  return cached(env, `search:${query}:${rows}`, DAY, async () => {
    const data = await iaFetch(url);
    return (data.response?.docs || []).map((d) => ({
      identifier: d.identifier,
      title: Array.isArray(d.title) ? d.title[0] : d.title,
      year: d.year,
      mediatype: d.mediatype,
      restricted: !!d["access-restricted-item"],
      subjects: [].concat(d.subject || []).slice(0, 8),
      publisher: Array.isArray(d.publisher) ? d.publisher[0] : d.publisher,
    }));
  });
}

/** Resolve a catalog work to its best Archive identifier. */
async function resolveIdentifier(env, work) {
  if (work.archiveId) return work.archiveId;
  return cached(env, `resolve:${work.slug}`, 7 * DAY, async () => {
    const terms = (work.archiveQuery || work.title)
      .split(/\s+/).filter((w) => w.length > 2).map((w) => `title:(${w})`).join(" AND ");
    const results = await archiveSearch(env, `${terms} AND mediatype:(texts)`, 8);
    if (!results.length) return null;
    // Prefer an item whose title best overlaps; fall back to first.
    const want = work.title.toLowerCase();
    const best = results.find((r) => (r.title || "").toLowerCase().includes(want.slice(0, 12))) || results[0];
    return best.identifier;
  });
}

/** Full item metadata. */
async function archiveMetadata(env, id) {
  return cached(env, `meta:${id}`, 7 * DAY, async () => {
    const m = await iaFetch(`${IA}/metadata/${id}`);
    const md = m.metadata || {};
    return {
      identifier: id,
      title: md.title,
      description: cleanDesc(md.description),
      publisher: md.publisher,
      date: md.date || md.year,
      subjects: [].concat(md.subject || []).slice(0, 12),
      pages: md.imagecount,
      language: md.language,
      restricted: md["access-restricted-item"] === "true" || md.collection?.includes?.("inlibrary"),
      server: m.server, dir: m.dir,
      readUrl: `${IA}/details/${id}`,
      coverUrl: `/img/cover/${id}`,
    };
  });
}

function cleanDesc(d) {
  if (!d) return null;
  const text = Array.isArray(d) ? d.join(" ") : d;
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 1200);
}

/** Search inside a book's full text. Falls back to a reader deep-link. */
async function searchInside(env, id, q) {
  const meta = await archiveMetadata(env, id);
  const fallback = { id, query: q, matches: [], readerUrl: `${IA}/details/${id}?q=${encodeURIComponent(q)}` };
  if (!meta.server || !meta.dir) return fallback;
  try {
    const url = `https://${meta.server}/fulltext/inside.php?item_id=${id}&doc=${id}&path=${meta.dir}&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { "user-agent": UA } });
    if (!r.ok) return fallback;
    const data = await r.json();
    const matches = (data.matches || []).slice(0, 20).map((m) => ({
      text: (m.text || "").replace(/\{\{\{|\}\}\}/g, ""),
      page: m.par?.[0]?.page,
    }));
    return { id, query: q, count: data.matches?.length || 0, matches, readerUrl: fallback.readerUrl };
  } catch {
    return fallback;
  }
}

/** Cover image: R2-cached when MEDIA is bound, else edge-cached passthrough. */
async function coverImage(env, id, ctx) {
  const key = `cover/${id}.jpg`;
  if (env.MEDIA) {
    const obj = await env.MEDIA.get(key);
    if (obj) return new Response(obj.body, { headers: { "content-type": "image/jpeg", "cache-control": `public, max-age=${30 * DAY}`, "x-cache": "r2" } });
  }
  const src = await fetch(`${IA}/services/img/${id}`, { headers: { "user-agent": UA }, cf: { cacheTtl: DAY, cacheEverything: true } });
  if (!src.ok) return new Response("cover unavailable", { status: 502 });
  if (env.MEDIA) {
    const buf = await src.arrayBuffer();
    ctx.waitUntil(env.MEDIA.put(key, buf, { httpMetadata: { contentType: "image/jpeg" } }));
    return new Response(buf, { headers: { "content-type": "image/jpeg", "cache-control": `public, max-age=${30 * DAY}`, "x-cache": "miss" } });
  }
  return new Response(src.body, { headers: { "content-type": src.headers.get("content-type") || "image/jpeg", "cache-control": `public, max-age=${30 * DAY}` } });
}

// ---------------------------------------------------------------------------
// Catalog (D1 if present, else the bundled CATALOG)
// ---------------------------------------------------------------------------
async function getCatalog(env) {
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT slug,title,subtitle,series,volume,year,category,award,blurb,archive_id AS archiveId,archive_query AS archiveQuery FROM works ORDER BY year ASC, volume ASC"
      ).all();
      if (results?.length) return results;
    } catch { /* fall through to bundled catalog */ }
  }
  return CATALOG;
}

/** The fully-enriched library: catalog joined with live archive data. */
async function buildLibrary(env) {
  return cached(env, "library:v1", DAY, async () => {
    const works = await getCatalog(env);
    const out = [];
    // Resolve in small batches to be gentle on the API.
    for (let i = 0; i < works.length; i += 5) {
      const batch = works.slice(i, i + 5);
      const enriched = await Promise.all(batch.map(async (w) => {
        try {
          const id = await resolveIdentifier(env, w);
          if (!id) return { ...w, archive: null };
          const meta = await archiveMetadata(env, id);
          return {
            ...w,
            archive: {
              identifier: id,
              coverUrl: `/img/cover/${id}`,
              readUrl: meta.readUrl,
              restricted: meta.restricted,
              description: meta.description,
              subjects: meta.subjects,
              searchUrl: `/api/archive/inside?id=${id}&q=`,
            },
          };
        } catch {
          return { ...w, archive: null };
        }
      }));
      out.push(...enriched);
    }
    return { count: out.length, categories: CATEGORIES, works: out };
  });
}

// ---------------------------------------------------------------------------
// "Ask the Archive" — RAG over Vectorize + Workers AI (optional)
// ---------------------------------------------------------------------------
const EMBED_MODEL = "@cf/baai/bge-base-en-v1.5";
const CHAT_MODEL = "@cf/meta/llama-3.1-8b-instruct";

async function embed(env, text) {
  const r = await env.AI.run(EMBED_MODEL, { text: [text] });
  return r.data[0];
}

async function reindex(env) {
  if (!env.AI || !env.VECTORIZE) return { ok: false, reason: "AI and VECTORIZE bindings are required" };
  const works = await getCatalog(env);
  const vectors = [];
  for (const w of works) {
    let extra = "";
    try {
      const id = await resolveIdentifier(env, w);
      if (id) extra = (await archiveMetadata(env, id)).description || "";
    } catch { /* description is optional context */ }
    const text = [w.title, w.subtitle, w.blurb, extra].filter(Boolean).join(". ");
    const values = await embed(env, text);
    vectors.push({
      id: w.slug,
      values,
      metadata: { slug: w.slug, title: w.title, year: w.year, category: w.category, blurb: w.blurb },
    });
  }
  await env.VECTORIZE.upsert(vectors);
  return { ok: true, indexed: vectors.length };
}

async function ask(env, question) {
  if (!env.AI || !env.VECTORIZE) {
    return json({
      error: "Ask the Archive is not configured.",
      hint: "Provision Workers AI (AI) and Vectorize (VECTORIZE), then POST /api/admin/reindex.",
    }, { status: 503 });
  }
  const qv = await embed(env, question);
  const { matches = [] } = await env.VECTORIZE.query(qv, { topK: 5, returnMetadata: true });
  const context = matches.map((m, i) =>
    `[${i + 1}] ${m.metadata.title} (${m.metadata.year}) — ${m.metadata.blurb}`).join("\n");
  const sys =
    "You are a knowledgeable, gentle guide to the life and writings of Robert Coles, the child psychiatrist and author of Children of Crisis. Answer using ONLY the provided context about his books. Cite books by title. If the context is insufficient, say so and suggest which of his works to read. Keep a warm, literary tone.";
  const r = await env.AI.run(CHAT_MODEL, {
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
    max_tokens: 600,
  });
  return json({
    question,
    answer: r.response,
    sources: matches.map((m) => ({ slug: m.metadata.slug, title: m.metadata.title, year: m.metadata.year, score: m.score })),
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;

    try {
      if (p === "/api/health") {
        return json({
          ok: true,
          site: env.SITE_NAME,
          bindings: {
            DB: !!env.DB, CACHE: !!env.CACHE, MEDIA: !!env.MEDIA,
            AI: !!env.AI, VECTORIZE: !!env.VECTORIZE,
          },
          mapbox: !!env.MAPBOX_TOKEN,
          note: "Unbound features degrade gracefully; the archive proxy works regardless.",
        });
      }

      // Public client config (the Mapbox token is a publishable pk.* token,
      // domain-restricted at Mapbox; safe to hand to the browser).
      if (p === "/api/config") {
        return json({ mapboxToken: env.MAPBOX_TOKEN || "" }, {
          headers: { "cache-control": "public, max-age=600" },
        });
      }

      // The geography of the fieldwork, for the Journeys map.
      if (p === "/api/map") {
        return json({ points: MAP_POINTS, arcs: MAP_ARCS, bounds: MAP_BOUNDS, legend: LEGEND }, {
          headers: { "cache-control": "public, max-age=86400" },
        });
      }

      if (p === "/api/works" || p === "/api/library") {
        return json(await buildLibrary(env));
      }

      if (p.startsWith("/api/works/")) {
        const slug = p.split("/").pop();
        const works = await getCatalog(env);
        const w = works.find((x) => x.slug === slug);
        if (!w) return json({ error: "not found" }, { status: 404 });
        const id = await resolveIdentifier(env, w);
        const meta = id ? await archiveMetadata(env, id) : null;
        return json({ ...w, archive: meta });
      }

      if (p === "/api/archive/search") {
        const q = url.searchParams.get("q") || "";
        return json({ query: q, results: await archiveSearch(env, q) });
      }

      if (p.startsWith("/api/archive/item/")) {
        return json(await archiveMetadata(env, p.split("/").pop()));
      }

      if (p === "/api/archive/inside") {
        const id = url.searchParams.get("id");
        const q = url.searchParams.get("q") || "";
        if (!id || !q) return json({ error: "id and q are required" }, { status: 400 });
        if (env.DB) ctx.waitUntil(logSearch(env, id, q));
        return json(await searchInside(env, id, q));
      }

      if (p === "/api/ask" && request.method === "POST") {
        const { question } = await request.json().catch(() => ({}));
        if (!question) return json({ error: "question is required" }, { status: 400 });
        return ask(env, question);
      }

      if (p === "/api/admin/reindex" && request.method === "POST") {
        if (env.ADMIN_KEY && request.headers.get("x-admin-key") !== env.ADMIN_KEY)
          return json({ error: "unauthorized" }, { status: 401 });
        return json(await reindex(env));
      }

      if (p.startsWith("/img/cover/")) {
        return coverImage(env, p.split("/").pop().replace(/\.jpg$/, ""), ctx);
      }

      if (p.startsWith("/api/")) return json({ error: "unknown endpoint" }, { status: 404 });

      // Anything else is a static asset.
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
    } catch (err) {
      return json({ error: "internal", detail: String(err?.message || err) }, { status: 500 });
    }
  },

  // Nightly: refresh the library cache and (if configured) the vector index.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      if (env.CACHE) await env.CACHE.delete("library:v1");
      await buildLibrary(env);                 // rewarm
      if (env.AI && env.VECTORIZE) await reindex(env);
    })());
  },
};

async function logSearch(env, id, q) {
  try {
    await env.DB.prepare("INSERT INTO search_log (identifier, query, ts) VALUES (?, ?, ?)")
      .bind(id, q, Date.now()).run();
  } catch { /* logging is best-effort */ }
}

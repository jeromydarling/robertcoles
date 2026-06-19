# Robert Coles — A Memorial & Reader's Companion

A memorial site for **Robert Coles** (1929–2026), the Pulitzer Prize–winning
child psychiatrist and author of *Children of Crisis* — built on **Cloudflare
Workers**, with a **living catalog pulled in real time from the Internet
Archive**.

The static site explores his life and writing in depth (with *Children of
Crisis* at the center); the Worker adds a dynamic **Library** that fetches every
book's cover, description, and read/borrow link straight from the archives, lets
you **search inside** the books, and answers questions through an optional
**"Ask the Archive"** guide.

---

## Architecture — using every corner of Cloudflare

| Cloudflare primitive | Binding | What it does here | Required? |
|---|---|---|---|
| **Workers + Static Assets** | `ASSETS` | Serves `public/`; `/api/*` and `/img/*` run the Worker first | ✅ core |
| **Cache API** | *(built-in)* | Edge-caches archive.org responses & covers — no setup | ✅ core |
| **D1** | `DB` | Canonical, editable catalog + full-text search log | optional |
| **KV** | `CACHE` | Durable cross-request cache for archive/Open Library JSON | optional |
| **R2** | `MEDIA` | Stores cover images so we don't hot-link the Archive | optional |
| **Workers AI** | `AI` | Embeddings + grounded answers (`bge-base`, `llama-3.1-8b`) | optional |
| **Vectorize** | `VECTORIZE` | Semantic index over the corpus for "Ask the Archive" | optional |
| **Cron Triggers** | *(config)* | Nightly refresh of the library cache + vector index | optional |

**Graceful degradation is the design rule:** with *zero* optional bindings the
site deploys and the live archive catalog still works (via the Cache API). Each
binding you provision lights up one more capability. Check what's active any time
at **`/api/health`**.

### What we pull from "the archives" (and what we don't)

We pull, live: the full item list (`advancedsearch.php`), per-book metadata and
descriptions (`/metadata/<id>`), cover images (`/services/img/<id>`), and
full-text **search-inside** results. Most of Coles's books are **borrow-only
(Controlled Digital Lending)**, so we **link into the Archive's reader rather
than rehosting copyrighted text** — correct legally, and the better experience.
*The Atlantic*'s essays are paywalled and linked only.

---

## Project layout

```
.
├── wrangler.jsonc          # Worker + assets + (commented) optional bindings
├── package.json            # scripts: dev, deploy, check, db:*, vectorize:*
├── src/
│   ├── index.js            # the Worker: router, archive integration, RAG, cron
│   ├── catalog.js          # bundled bibliography (runtime fallback + seed source)
│   └── places.js           # fieldwork geography served to the Journeys map
├── db/
│   ├── schema.sql          # D1 schema
│   ├── seed.sql            # AUTO-GENERATED from catalog.js
│   └── gen-seed.mjs        # regenerates seed.sql
└── public/                 # the static site (served by ASSETS)
    ├── index.html  life.html  children-of-crisis.html
    ├── library.html         # dynamic, archive-fed catalog
    ├── journeys.html        # interactive Mapbox map of the fieldwork
    ├── works.html  method.html  archive.html
    └── assets/{css,js}/     # incl. journeys.js (map) and library.js
```

### API endpoints

| Route | Purpose |
|---|---|
| `GET /api/health` | Which bindings are active (incl. `mapbox`) |
| `GET /api/config` | Public client config — the Mapbox token |
| `GET /api/map` | Fieldwork geography (GeoJSON points + migration arcs) |
| `GET /api/works` | Full catalog enriched with live archive data (cached) |
| `GET /api/works/:slug` | One work + its archive metadata |
| `GET /api/archive/search?q=` | Proxy of archive.org advanced search |
| `GET /api/archive/item/:id` | Proxy of the archive.org metadata API |
| `GET /api/archive/inside?id=&q=` | Full-text search inside a book |
| `GET /img/cover/:id` | Cover image (R2/edge-cached) |
| `POST /api/ask` | "Ask the Archive" (needs `AI` + `VECTORIZE`) |
| `POST /api/admin/reindex` | Rebuild the vector index (header `x-admin-key`) |

---

## Develop & deploy

Deployment is handled by **Cloudflare Workers Builds** (the dashboard's native
Git integration): every push to this repo runs `wrangler deploy` on Cloudflare's
side and publishes to `https://robertcoles.<subdomain>.workers.dev`. No GitHub
secrets or Actions are involved.

```bash
npm install
npm run dev          # local preview: http://localhost:8787
npm run check        # offline bundle + config validation (no auth needed)
# `git push` → Cloudflare Workers Builds deploys automatically
```

> Note: live archive.org calls require outbound network. They work in
> `wrangler dev` and in production; they're blocked only inside restricted CI
> sandboxes, where the catalog degrades to `archive: null` gracefully.

### Already provisioned

**D1** (`robert-coles`) and **KV** (`robert-coles-CACHE`) are created, seeded
(22 works), and wired into `wrangler.jsonc`. R2 is not enabled on the account,
so the `MEDIA` block stays commented and cover images stream through the edge
cache instead (no functional loss).

**The Journeys map** needs a Mapbox *publishable* token. Because the repo is
git-deployed (and GitHub blocks committing `pk.…` tokens), set it as an
encrypted **Worker secret** in the dashboard rather than in `wrangler.jsonc`:
*Workers & Pages → robertcoles → Settings → Variables and Secrets → Add →
Secret → name `MAPBOX_TOKEN`*. Secrets survive Workers Builds redeploys. Until
it's set, the map shows a notice and the textual itinerary still works.

**Ask the Archive** (Workers AI + Vectorize) ships commented out so the git
build deploys cleanly. To turn it on, create the index once and uncomment the
`ai` + `vectorize` blocks in `wrangler.jsonc`, then push:

```bash
npx wrangler vectorize create robert-coles-corpus --dimensions=768 --metric=cosine
```

### Provisioning the remaining optional bindings

Run only the ones you want, paste each returned id into `wrangler.jsonc`, and
uncomment that block.

```bash
# D1 — editable catalog
npm run db:create            # → copy database_id into wrangler.jsonc
npm run db:schema
npm run db:seed              # seed.sql is generated from catalog.js

# KV — durable cache
npm run kv:create            # → copy id into wrangler.jsonc

# R2 — cover cache
npm run r2:create

# Workers AI + Vectorize — "Ask the Archive"
npm run vectorize:create     # 768-dim, cosine (matches bge-base-en-v1.5)
# uncomment the "ai" and "vectorize" blocks, then after deploy:
npx wrangler secret put ADMIN_KEY
WORKER_URL=https://<your-worker-url> ADMIN_KEY=<key> npm run reindex

# Cron — nightly refresh: uncomment the "triggers" block, then deploy
```

To regenerate the D1 seed after editing the catalog:

```bash
node db/gen-seed.mjs
```

---

## A note on accuracy

An independent, non-commercial tribute. Biographical facts come from published
obituaries and reference works (cited on the **Archive** page). Book summaries
are interpretive; lines marked *"in the spirit of"* paraphrase recurring themes
rather than quoting a single sourced sentence. Catalog data is fetched live from
the Internet Archive and Open Library. Corrections welcome.

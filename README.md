# Robert Coles — A Memorial & Reader's Companion

A quiet, archival memorial site honoring **Robert Coles** (1929–2026), the
Pulitzer Prize–winning child psychiatrist and author of *Children of Crisis*.
The site explores his life and his writings in depth — with the five-volume
*Children of Crisis* at its center — and sends readers onward to where his work
actually lives in the archives.

## Pages

| Page | File | What's there |
|------|------|--------------|
| Home | `index.html` | Memorial hero, the man in brief, gateway to the site |
| A Life | `life.html` | Full biography and an illustrated timeline |
| Children of Crisis | `children-of-crisis.html` | A volume-by-volume reading of the five-volume masterwork |
| The Larger Work | `works.html` | The rest of his ~50 books — the trilogy, teaching/service, portraits |
| The Art of Listening | `method.html` | His documentary method |
| The Archive | `archive.html` | Where to read him (Internet Archive, UNC & MSU papers, *The Atlantic*) + sources |

## Tech

Plain, dependency-free **HTML + CSS + a little JavaScript**. No build step.
Fonts load from Google Fonts with graceful serif fallbacks; the site is fully
readable with JavaScript disabled.

```
.
├── index.html
├── life.html
├── children-of-crisis.html
├── works.html
├── method.html
├── archive.html
└── assets/
    ├── css/style.css
    └── js/main.js
```

## Running it locally

Any static file server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying

It's a static site, so it can be hosted anywhere — **GitHub Pages**,
**Cloudflare Pages**, Netlify, etc. For GitHub Pages, enable Pages on this
branch (or `main`) and point it at the repository root.

## A note on accuracy

This is an independent, non-commercial tribute. Biographical facts are drawn
from published obituaries and reference works (cited on the **Archive** page).
Book summaries are interpretive readings meant to guide readers to the
originals; quotations marked *"in the spirit of"* paraphrase recurring themes
in Coles's writing rather than quoting a single sourced sentence. Corrections
in the service of accuracy are welcome.

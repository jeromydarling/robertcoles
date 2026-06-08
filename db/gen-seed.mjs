// Generates db/seed.sql from src/catalog.js so the D1 seed never drifts from
// the bundled catalog. Run: node db/gen-seed.mjs
import { CATALOG } from "../src/catalog.js";
import { writeFileSync } from "node:fs";

const esc = (v) => (v === undefined || v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const num = (v) => (v === undefined || v === null ? "NULL" : Number(v));

const rows = CATALOG.map((w) =>
  `INSERT INTO works (slug,title,subtitle,series,volume,year,category,award,blurb,archive_id,archive_query) VALUES (` +
  [esc(w.slug), esc(w.title), esc(w.subtitle), esc(w.series), num(w.volume), num(w.year),
   esc(w.category), esc(w.award), esc(w.blurb), esc(w.archiveId), esc(w.archiveQuery)].join(", ") + `);`
).join("\n");

const out = `-- AUTO-GENERATED from src/catalog.js by db/gen-seed.mjs — do not edit by hand.\nDELETE FROM works;\n${rows}\n`;
writeFileSync(new URL("./seed.sql", import.meta.url), out);
console.log(`Wrote db/seed.sql with ${CATALOG.length} works.`);

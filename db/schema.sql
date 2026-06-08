-- Robert Coles — D1 schema.
-- The Worker runs fine without D1 (it falls back to the bundled catalog), but
-- provisioning D1 makes the catalog editable and enables the search log.

DROP TABLE IF EXISTS works;
CREATE TABLE works (
  slug          TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  series        TEXT,
  volume        INTEGER,
  year          INTEGER,
  category      TEXT,
  award         TEXT,
  blurb         TEXT,
  archive_id    TEXT,        -- known Internet Archive identifier, if any
  archive_query TEXT         -- query used to resolve the identifier at runtime
);
CREATE INDEX idx_works_year ON works(year);
CREATE INDEX idx_works_category ON works(category);

DROP TABLE IF EXISTS timeline;
CREATE TABLE timeline (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  year  TEXT NOT NULL,
  title TEXT NOT NULL,
  body  TEXT
);

DROP TABLE IF EXISTS quotes;
CREATE TABLE quotes (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  text   TEXT NOT NULL,
  source TEXT
);

DROP TABLE IF EXISTS search_log;
CREATE TABLE search_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT,
  query      TEXT,
  ts         INTEGER
);

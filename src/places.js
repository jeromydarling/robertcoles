// The geography of the fieldwork. Coordinates are approximate, chosen to mark
// the places and peoples Coles lived among while making "Children of Crisis"
// (1960–1977) and the later trilogy. Served to the map at /api/map.

// Palette keyed to each strand of the work (mirrors the site's CSS tones).
export const LEGEND = [
  { key: "desegregation", label: "Vol. I · The desegregating South", color: "#7a2e22" },
  { key: "rural", label: "Vol. II · Migrants, sharecroppers, mountaineers", color: "#9a7b3f" },
  { key: "migration", label: "Vol. III · The South goes North", color: "#3f5e7a" },
  { key: "margins", label: "Vol. IV · Eskimos, Chicanos, Indians", color: "#4f7a3f" },
  { key: "privilege", label: "Vol. V · Privileged ones", color: "#6a4a7a" },
  { key: "global", label: "The trilogy · children of the wider world", color: "#2e6f6a" },
];

const COLOR = Object.fromEntries(LEGEND.map((l) => [l.key, l.color]));

// [lng, lat]
const P = [
  // ---- Vol. I — the desegregating South ----------------------------------
  ["New Orleans, Louisiana", -90.0701, 29.9511, "desegregation", "1960", "children-of-crisis-i",
    "Where it began. Coles watched six-year-old Ruby Bridges walk through a mob into William Frantz Elementary, and started visiting her at home. The encounter became his life's work."],
  ["Atlanta, Georgia", -84.388, 33.749, "desegregation", "1961", "children-of-crisis-i",
    "Following the first Black students to integrate previously all-white schools across the Deep South, and the white families on the other side of the door."],

  // ---- Vol. II — migrants, sharecroppers, mountaineers -------------------
  ["Mississippi Delta", -90.179, 33.519, "rural", "1964", "migrants-sharecroppers-mountaineers",
    "Among sharecropping families bound to land they would never own — listening for how poverty shapes a child's sense of the possible."],
  ["Appalachia, Eastern Kentucky", -83.193, 37.249, "rural", "1965", "migrants-sharecroppers-mountaineers",
    "The mountain hollows: families of the coal country, their inherited dignity and religious depth set against hard scarcity."],
  ["Belle Glade, Florida", -80.667, 26.684, "rural", "1966", "migrants-sharecroppers-mountaineers",
    "The migrant stream — farmworker children who follow the harvest with no place to call home."],

  // ---- Vol. III — the South goes North -----------------------------------
  ["Boston, Massachusetts", -71.0589, 42.3601, "migration", "1968", "the-south-goes-north",
    "A northern destination. Coles followed Southern families — Black and white — into the projects and tenements, where the promised land turned colder than expected."],
  ["Chicago, Illinois", -87.6298, 41.8781, "migration", "1969", "the-south-goes-north",
    "The Great Migration from the inside: children making sense of uprooting, arrival, and the indifference of the industrial city."],

  // ---- Vol. IV — Eskimos, Chicanos, Indians ------------------------------
  ["Hopi Mesas, Arizona", -110.55, 35.90, "margins", "1973", "eskimos-chicanos-indians",
    "On the mesa, where a child reads land and sky as ways of knowing — heritage and the sacred as serious as any textbook."],
  ["Rio Grande Valley, Texas", -98.4936, 29.4241, "margins", "1974", "eskimos-chicanos-indians",
    "Mexican-American children of the Southwest, anchored by language and family against the press of the dominant culture."],
  ["Northwest Alaska (Kotzebue)", -162.596, 66.898, "margins", "1975", "eskimos-chicanos-indians",
    "Inuit and Alaska Native children of the far north, reading ice and weather with an inherited fluency."],

  // ---- Vol. V — privileged ones ------------------------------------------
  ["Houston, Texas", -95.3698, 29.7604, "privilege", "1976", "privileged-ones",
    "The other end of the ledger: the children of oil wealth and old money, and the deep, unspoken assumption Coles named — entitlement."],
  ["Northeast enclaves", -71.30, 42.30, "privilege", "1977", "privileged-ones",
    "Beacon Hill to the prep schools — privilege studied with the same unflinching attention he had given the poor."],

  // ---- Documentary collaboration -----------------------------------------
  ["Northern New Mexico", -105.95, 36.18, "rural", "1972", "the-old-ones-of-new-mexico",
    "With photographer Alex Harris: the elders ('los viejos') of the high New Mexico villages — a companion to the children's work."],

  // ---- The trilogy — children of the wider world -------------------------
  ["Belfast, Northern Ireland", -5.93, 54.597, "global", "1980s", "the-political-life-of-children",
    "For The Political Life of Children: what a child of the Troubles already understands about nation, fear, and power."],
  ["Soweto, South Africa", 27.86, -26.267, "global", "1980s", "the-political-life-of-children",
    "Under apartheid — children carrying a politics far heavier than their years, much as Ruby Bridges once had."],
  ["Rio de Janeiro, Brazil", -43.1729, -22.9068, "global", "1980s", "the-spiritual-life-of-children",
    "For The Spiritual Life of Children: the questions of God and meaning a favela child asks, taken with full seriousness."],
];

export const MAP_POINTS = {
  type: "FeatureCollection",
  features: P.map(([place, lng, lat, key, year, work, blurb], i) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: { id: i, place, year, category: key, color: COLOR[key], work, blurb },
  })),
};

// Migration journeys for Vol. III, drawn as curved arcs (the client builds the
// curve). South → North.
export const MAP_ARCS = [
  { from: [-90.0701, 29.9511], to: [-87.6298, 41.8781], label: "New Orleans → Chicago" },
  { from: [-90.179, 33.519], to: [-87.6298, 41.8781], label: "Mississippi Delta → Chicago" },
  { from: [-84.388, 33.749], to: [-71.0589, 42.3601], label: "Atlanta → Boston" },
];

export const MAP_BOUNDS = [[-170, -30], [30, 70]];

// The canonical, hand-curated bibliography. This is the source of truth that
// ships with the Worker so the catalog is rich even before D1 is provisioned
// or the archive.org index has been refreshed. At runtime each entry is
// enriched with live archive.org data (cover, description, read/borrow link).
//
// archiveId, when known, points straight at the item on the Internet Archive.
// When unknown, `archiveQuery` is resolved to an identifier at request time
// (cached), so the catalog stays correct without hard-coding fragile ids.

export const CATALOG = [
  // ---- Children of Crisis (the five-volume masterwork) --------------------
  {
    slug: "children-of-crisis-i",
    title: "Children of Crisis",
    subtitle: "A Study of Courage and Fear",
    series: "Children of Crisis", volume: 1, year: 1967,
    category: "children-of-crisis",
    blurb: "The foundation. Black children pioneering school desegregation in the South — and the white children and adults on the other side of the door — rendered without melodrama and with extraordinary moral attention.",
    archiveQuery: "Children of Crisis A Study of Courage and Fear Coles"
  },
  {
    slug: "migrants-sharecroppers-mountaineers",
    title: "Migrants, Sharecroppers, Mountaineers",
    subtitle: "Children of Crisis, Volume II",
    series: "Children of Crisis", volume: 2, year: 1971,
    category: "children-of-crisis", award: "Pulitzer Prize, 1973",
    blurb: "The rural poor of the South and Appalachia — migrant farmworkers, sharecroppers, mountain families — and how poverty shapes a child's sense of the possible. One of the two volumes that shared the 1973 Pulitzer.",
    archiveQuery: "Migrants Sharecroppers Mountaineers Coles"
  },
  {
    slug: "the-south-goes-north",
    title: "The South Goes North",
    subtitle: "Children of Crisis, Volume III",
    series: "Children of Crisis", volume: 3, year: 1972,
    category: "children-of-crisis", award: "Pulitzer Prize, 1973",
    blurb: "The great migration from the inside, as Southern families — Black and white — reach the industrial North and meet a colder hardship. The Pulitzer-winning companion to Volume II.",
    archiveQuery: "The South Goes North Coles Children of Crisis"
  },
  {
    slug: "eskimos-chicanos-indians",
    title: "Eskimos, Chicanos, Indians",
    subtitle: "Children of Crisis, Volume IV",
    series: "Children of Crisis", volume: 4, year: 1977,
    category: "children-of-crisis",
    blurb: "Children too often left out of the national story — Native American, Inuit and Alaska Native, and Mexican-American — and how heritage, land, and language anchor a child's identity.",
    archiveQuery: "Eskimos Chicanos Indians Coles Children of Crisis"
  },
  {
    slug: "privileged-ones",
    title: "Privileged Ones",
    subtitle: "The Well-Off and the Rich in America · Children of Crisis, Volume V",
    series: "Children of Crisis", volume: 5, year: 1977,
    category: "children-of-crisis",
    blurb: "Having spent a decade among the poor, Coles trains the same unflinching attention on the children of wealth — and gives the language a word for what he finds: entitlement.",
    archiveQuery: "Privileged Ones Coles Children of Crisis"
  },

  // ---- Women of Crisis (with Jane Coles) ----------------------------------
  {
    slug: "women-of-crisis-i",
    title: "Women of Crisis",
    subtitle: "Lives of Struggle and Hope",
    year: 1978, category: "documentary",
    blurb: "With Jane Coles. The women whose voices the original series carried but did not foreground, given the center of the frame.",
    archiveQuery: "Women of Crisis Lives of Struggle and Hope Coles"
  },
  {
    slug: "women-of-crisis-ii",
    title: "Women of Crisis II",
    subtitle: "Lives of Work and Dreams",
    year: 1980, category: "documentary",
    blurb: "With Jane Coles. The second volume of the Coleses' joint portrait of American women's working lives.",
    archiveQuery: "Women of Crisis Lives of Work and Dreams Coles"
  },

  // ---- The great trilogy --------------------------------------------------
  {
    slug: "the-moral-life-of-children",
    title: "The Moral Life of Children",
    year: 1986, category: "trilogy",
    archiveId: "morallifeofchild00cole_1",
    blurb: "How children form a conscience — their startling capacity for moral seriousness, courage, and ethical struggle, often outpacing the adults around them.",
    archiveQuery: "The Moral Life of Children Coles"
  },
  {
    slug: "the-political-life-of-children",
    title: "The Political Life of Children",
    year: 1986, category: "trilogy",
    blurb: "How children absorb nation, power, class, and conflict — what a child in Belfast, Soweto, or Boston already understands about the political world.",
    archiveQuery: "The Political Life of Children Coles"
  },
  {
    slug: "the-spiritual-life-of-children",
    title: "The Spiritual Life of Children",
    year: 1990, category: "trilogy",
    blurb: "The questions children ask about God, death, and meaning — taken seriously, across faiths, as genuine theology rather than charming naivety.",
    archiveQuery: "The Spiritual Life of Children Coles"
  },

  // ---- Teaching & service -------------------------------------------------
  {
    slug: "the-call-of-stories",
    title: "The Call of Stories",
    subtitle: "Teaching and the Moral Imagination",
    year: 1989, category: "teaching-service",
    archiveId: "callofstoriestea0000cole_b0m9",
    blurb: "From his famous Harvard course: a case for reading novels as moral instruction — how Tolstoy, Chekhov, O'Connor, and Williams teach us to imagine other lives.",
    archiveQuery: "The Call of Stories Teaching and the Moral Imagination Coles"
  },
  {
    slug: "the-call-of-service",
    title: "The Call of Service",
    subtitle: "A Witness to Idealism",
    year: 1993, category: "teaching-service",
    blurb: "On the moral life of those who give themselves to others — volunteers, activists, teachers — and the satisfactions and temptations of idealism.",
    archiveQuery: "The Call of Service A Witness to Idealism Coles"
  },
  {
    slug: "the-moral-intelligence-of-children",
    title: "The Moral Intelligence of Children",
    year: 1997, category: "teaching-service",
    blurb: "A practical, widely read distillation of what his fieldwork taught him about raising a child of good character.",
    archiveQuery: "The Moral Intelligence of Children Coles"
  },

  // ---- Portraits & biographies -------------------------------------------
  {
    slug: "erik-h-erikson",
    title: "Erik H. Erikson",
    subtitle: "The Growth of His Work",
    year: 1970, category: "portrait",
    blurb: "His study of the mentor who gave his fieldwork its intellectual home.",
    archiveQuery: "Erik H Erikson The Growth of His Work Coles"
  },
  {
    slug: "walker-percy",
    title: "Walker Percy",
    subtitle: "An American Search",
    year: 1978, category: "portrait",
    blurb: "On the novelist-physician whose Southern, searching Catholicism Coles deeply admired.",
    archiveQuery: "Walker Percy An American Search Coles"
  },
  {
    slug: "flannery-oconnors-south",
    title: "Flannery O'Connor's South",
    year: 1980, category: "portrait",
    blurb: "A reading of the writer whose unsparing moral vision he taught for decades.",
    archiveQuery: "Flannery O'Connor's South Coles"
  },
  {
    slug: "dorothy-day",
    title: "Dorothy Day",
    subtitle: "A Radical Devotion",
    year: 1987, category: "portrait",
    blurb: "The Catholic Worker founder he claimed as a spiritual mother, drawn from their long acquaintance.",
    archiveQuery: "Dorothy Day A Radical Devotion Coles"
  },
  {
    slug: "simone-weil",
    title: "Simone Weil",
    subtitle: "A Modern Pilgrimage",
    year: 1987, category: "portrait",
    blurb: "On the philosopher-mystic whose attention to affliction mirrored his own.",
    archiveQuery: "Simone Weil A Modern Pilgrimage Coles"
  },
  {
    slug: "anna-freud",
    title: "Anna Freud",
    subtitle: "The Dream of Psychoanalysis",
    year: 1992, category: "portrait",
    blurb: "A tribute to the pioneer of child analysis who encouraged his early work.",
    archiveQuery: "Anna Freud The Dream of Psychoanalysis Coles"
  },

  // ---- For young readers --------------------------------------------------
  {
    slug: "the-story-of-ruby-bridges",
    title: "The Story of Ruby Bridges",
    year: 1995, category: "childrens",
    blurb: "Thirty-five years after he first saw her, Coles gave Ruby Bridges back to the children of a new generation. Illustrated by George Ford.",
    archiveQuery: "The Story of Ruby Bridges Coles"
  },
  {
    slug: "the-old-ones-of-new-mexico",
    title: "The Old Ones of New Mexico",
    year: 1973, category: "documentary",
    blurb: "A documentary collaboration with photographer Alex Harris — Coles's interviews paired with images of the elders of northern New Mexico.",
    archiveQuery: "The Old Ones of New Mexico Coles"
  }
];

export const CATEGORIES = {
  "children-of-crisis": "Children of Crisis",
  "trilogy": "The Moral / Political / Spiritual Trilogy",
  "teaching-service": "Teaching & Service",
  "portrait": "Portraits & Biographies",
  "documentary": "Documentary Collaborations",
  "childrens": "For Young Readers"
};

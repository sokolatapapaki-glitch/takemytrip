// -----------------------------------------------------------------------------
// Activity catalogues (DATA ONLY)
// -----------------------------------------------------------------------------
// The activity object/array literals for each destination with a catalogue:
// Rome (ROME_ACTIVITIES) and Paris (PARIS_ACTIVITIES). Types and the planner's
// functions live in app/components/ActivityCombinations/core. The small builders
// below (at/everyDay/…) only construct these literals, so they stay with the data
// they build. Consumed by core/activities.data.ts and core/cities.data.ts, which
// re-export these under their historical names so every existing import keeps
// working.
// Self-contained: this file imports NOTHING so it never participates in the
// planner's type/value module graph. The core re-applies the `Activity` type when
// it imports these catalogues (see core/activities.data.ts + core/cities.data.ts).

// An opening window for a single day (matches the planner's DayHours shape).
type Window = { open: number; close: number };

// --- program helpers (construct the catalogue literals below) ----------------
export const CLOSED: Window = { open: 0, close: 0 }; // shut that day
const ALL_DAY: Window = { open: 0, close: 24 }; // open round the clock
const at = (open: number, close: number): Window => ({ open, close });
// Same window every day of the week.
const everyDay = (h: Window): Window[] => Array<Window>(7).fill(h);
// Mon–Sat one window, Sunday another (e.g. shorter or closed).
const weekdaysThenSun = (week: Window, sun: Window): Window[] => [
  week, week, week, week, week, week, sun,
];

// Attach the takemytrip-aligned metadata fields (empty/null for now) to a
// hand-authored catalogue entry. Fresh arrays per call so no two entries share
// the same empty array reference. The core re-applies the Activity type on import.
const withMeta = <T,>(a: T) => ({
  ...a,
  id: null,
  prices: null,
  websites: [],
  googleMapUrl: null,
  notes: [],
  tags: [],
  best_time: null,
  restaurants: [],
  emoji: null,
});

// -----------------------------------------------------------------------------
// Rome — the full 50-activity catalogue.
// -----------------------------------------------------------------------------
// `priority` (0–10) = how must-see an activity is for a typical tourist. World
// landmarks (Colosseum, Vatican) sit at 9–10; iconic-but-quick sights at 7–9;
// solid stops at 5–6; niche / skippable ones at 2–4. The "Tourist priority"
// filter (filters.data) scores it heavily, so the planner fills a trip's limited
// slots with the high-priority sights first.
const ROME_BASE = [
  // Open daily 08:30–19:00 year-round.
  { name: "Colosseum & Roman Forum", description: "Tour the ancient arena and the ruins of the old city centre.", hours: 3, cost: 18, coords: { lat: 41.8902, lng: 12.4922 }, program: everyDay(at(8.5, 19)), cultural: 9, foodie: 0, adventurous: 4, relaxing: 2, priority: 10 },
  // Mon–Sat 09:00–18:00; CLOSED on Sundays (and most religious holidays).
  { name: "Vatican Museums & Sistine Chapel", description: "Walk the galleries up to Michelangelo's ceiling.", hours: 4, cost: 20, coords: { lat: 41.9065, lng: 12.4536 }, program: weekdaysThenSun(at(9, 18), CLOSED), cultural: 10, foodie: 0, adventurous: 2, relaxing: 1, priority: 10 },
  // Open every day 07:00–19:00.
  { name: "St. Peter's Basilica", description: "Visit the basilica and climb the dome for city views.", hours: 2, cost: 0, coords: { lat: 41.9022, lng: 12.4539 }, program: everyDay(at(7, 19)), cultural: 8, foodie: 0, adventurous: 3, relaxing: 3, priority: 9 },
  // A public square fountain — open 24 hours, every day.
  { name: "Trevi Fountain", description: "See the baroque fountain and toss a coin.", hours: 1, cost: 0, coords: { lat: 41.9009, lng: 12.4833 }, program: everyDay(ALL_DAY), cultural: 5, foodie: 0, adventurous: 1, relaxing: 4, priority: 9 },
  // Mon–Sat 09:00–19:00, shorter on Sunday (09:00–18:00).
  { name: "Pantheon", description: "Step inside the best-preserved Roman temple.", hours: 1, cost: 5, coords: { lat: 41.8986, lng: 12.4769 }, program: weekdaysThenSun(at(9, 19), at(9, 18)), cultural: 8, foodie: 0, adventurous: 1, relaxing: 4, priority: 9 },
  // Evening tour 17:00–21:00; CLOSED on Mondays. Flagged as a lunch option, but
  // it only opens in the evening so it won't qualify for the midday slot.
  { name: "Trastevere food tour", description: "Guided tasting through the cobbled old quarter.", hours: 3, cost: 55, coords: { lat: 41.8893, lng: 12.4699 }, program: [CLOSED, at(17, 21), at(17, 21), at(17, 21), at(17, 21), at(17, 21), at(17, 21)], cultural: 4, foodie: 10, adventurous: 3, relaxing: 5, priority: 6, is_lunch: true },
  // Gelaterie and coffee bars: open daily 11:00–23:30 — open over midday, so it
  // can serve as the lunch slot.
  { name: "Gelato & espresso tasting", description: "Sample classic Roman gelaterie and coffee bars.", hours: 1, cost: 25, coords: { lat: 41.9003, lng: 12.4759 }, program: everyDay(at(11, 23.5)), cultural: 2, foodie: 9, adventurous: 1, relaxing: 7, priority: 6, is_lunch: true },
  // Park + bike rental 09:00–19:00 daily; rental CLOSED on Mondays.
  { name: "Villa Borghese bike ride", description: "Rent a bike and loop the city's big central park.", hours: 2, cost: 12, coords: { lat: 41.9142, lng: 12.4923 }, program: [CLOSED, at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19)], cultural: 2, foodie: 1, adventurous: 8, relaxing: 6, priority: 4 },
  // Open-air market, mornings only: 07:00–14:00 Mon–Sat, CLOSED Sundays. Open
  // over midday on weekdays, so it can fill the lunch slot.
  { name: "Campo de' Fiori market", description: "Browse the morning produce and street-food stalls.", hours: 1, cost: 0, coords: { lat: 41.8956, lng: 12.4722 }, program: weekdaysThenSun(at(7, 14), CLOSED), cultural: 4, foodie: 8, adventurous: 2, relaxing: 5, priority: 5, is_lunch: true },
  // Catacombs tour 09:00–17:00; CLOSED on Wednesdays.
  { name: "Catacombs of San Callisto", description: "Descend into the early-Christian underground tunnels.", hours: 2, cost: 10, coords: { lat: 41.8589, lng: 12.5103 }, program: [at(9, 17), at(9, 17), CLOSED, at(9, 17), at(9, 17), at(9, 17), at(9, 17)], cultural: 9, foodie: 0, adventurous: 6, relaxing: 1, priority: 6 },
  // Cooking class, single afternoon session 15:00–18:00 daily.
  { name: "Pasta-making cooking class", description: "Hands-on class rolling fresh pasta with a local chef.", hours: 3, cost: 65, coords: { lat: 41.8919, lng: 12.4646 }, program: everyDay(at(15, 18)), cultural: 3, foodie: 10, adventurous: 4, relaxing: 4, priority: 5 },
  // Rooftop aperitivo bar, evenings 18:00–24:00 every day.
  { name: "Rooftop aperitivo", description: "Sip a spritz with sunset views over the rooftops.", hours: 2, cost: 30, coords: { lat: 41.9011, lng: 12.4707 }, program: everyDay(at(18, 24)), cultural: 1, foodie: 7, adventurous: 2, relaxing: 9, priority: 5 },
  // Riverside thermal spa, open daily 10:00–22:00.
  { name: "Terme spa & wellness", description: "Unwind in the thermal pools and steam rooms.", hours: 3, cost: 45, coords: { lat: 41.8847, lng: 12.4712 }, program: everyDay(at(10, 22)), cultural: 0, foodie: 1, adventurous: 1, relaxing: 10, priority: 4 },

  // ===========================================================================
  // Extended catalogue (37 more, for a 50-activity total). Grouped by district
  // so routes through one cluster stay direct. Opening hours vary (all-day
  // monuments, weekday/weekend-only sites, evening bars, one-session classes),
  // and several midday-open foodie spots are flagged is_lunch.
  // ===========================================================================

  // --- Ancient Rome cluster (~41.890, 12.490) -------------------------------
  { name: "Palatine Hill ruins", description: "Wander the imperial palaces above the Forum.", hours: 2, cost: 18, coords: { lat: 41.8894, lng: 12.4875 }, program: everyDay(at(8.5, 19)), cultural: 8, foodie: 0, adventurous: 4, relaxing: 3, priority: 7 },
  { name: "Capitoline Museums", description: "The world's oldest public museums on the Campidoglio.", hours: 3, cost: 16, coords: { lat: 41.8932, lng: 12.4828 }, program: [CLOSED, at(9.5, 19.5), at(9.5, 19.5), at(9.5, 19.5), at(9.5, 19.5), at(9.5, 19.5), at(9.5, 19.5)], cultural: 10, foodie: 0, adventurous: 1, relaxing: 2, priority: 7 },
  { name: "Baths of Caracalla", description: "Towering ruins of an imperial bath complex.", hours: 2, cost: 8, coords: { lat: 41.8790, lng: 12.4923 }, program: weekdaysThenSun(at(9, 19), at(9, 14)), cultural: 8, foodie: 0, adventurous: 3, relaxing: 3, priority: 6 },
  { name: "Domus Aurea guided tour", description: "Nero's buried golden palace, weekends only.", hours: 2, cost: 22, coords: { lat: 41.8910, lng: 12.4955 }, program: [CLOSED, CLOSED, CLOSED, CLOSED, at(9, 18), at(9, 18), at(9, 18)], cultural: 9, foodie: 0, adventurous: 5, relaxing: 1, priority: 6 },
  { name: "Circus Maximus & Aventine", description: "Stroll the old chariot track up to the orange garden.", hours: 1, cost: 0, coords: { lat: 41.8866, lng: 12.4856 }, program: everyDay(ALL_DAY), cultural: 5, foodie: 0, adventurous: 3, relaxing: 6, priority: 5 },
  { name: "Bocca della Verità", description: "The famous marble 'mouth of truth' at the portico.", hours: 1, cost: 2, coords: { lat: 41.8881, lng: 12.4815 }, program: everyDay(at(9.5, 17.5)), cultural: 6, foodie: 0, adventurous: 2, relaxing: 4, priority: 6 },

  // --- Centro Storico cluster (~41.899, 12.477) -----------------------------
  { name: "Piazza Navona", description: "Baroque square with Bernini's Four Rivers fountain.", hours: 1, cost: 0, coords: { lat: 41.8992, lng: 12.4731 }, program: everyDay(ALL_DAY), cultural: 6, foodie: 1, adventurous: 1, relaxing: 6, priority: 8 },
  { name: "Spanish Steps & Keats House", description: "Climb the steps and visit the poets' museum.", hours: 1, cost: 6, coords: { lat: 41.9059, lng: 12.4828 }, program: weekdaysThenSun(at(10, 18), CLOSED), cultural: 6, foodie: 0, adventurous: 2, relaxing: 5, priority: 8 },
  { name: "Galleria Doria Pamphilj", description: "An opulent private collection on Via del Corso.", hours: 2, cost: 14, coords: { lat: 41.8975, lng: 12.4810 }, program: everyDay(at(9, 19)), cultural: 9, foodie: 0, adventurous: 1, relaxing: 3, priority: 5 },
  { name: "Sant'Eustachio coffee tasting", description: "Sample Rome's most storied espresso bar.", hours: 1, cost: 12, coords: { lat: 41.8978, lng: 12.4754 }, program: everyDay(at(8, 21)), cultural: 2, foodie: 8, adventurous: 1, relaxing: 6, priority: 5, is_lunch: true },
  { name: "Jewish Ghetto food walk", description: "Taste carciofi alla giudia in the old quarter.", hours: 2, cost: 38, coords: { lat: 41.8923, lng: 12.4779 }, program: weekdaysThenSun(at(11, 15), CLOSED), cultural: 5, foodie: 9, adventurous: 2, relaxing: 5, priority: 5, is_lunch: true },
  { name: "Largo Argentina cat sanctuary", description: "Roman ruins that double as a cat refuge.", hours: 1, cost: 0, coords: { lat: 41.8957, lng: 12.4768 }, program: everyDay(at(12, 18)), cultural: 5, foodie: 0, adventurous: 2, relaxing: 7, priority: 3 },
  { name: "Ara Pacis Museum", description: "Augustus's altar of peace under a modern shell.", hours: 1, cost: 12, coords: { lat: 41.9059, lng: 12.4756 }, program: everyDay(at(9.5, 19.5)), cultural: 8, foodie: 0, adventurous: 1, relaxing: 3, priority: 5 },
  { name: "Roman supper club", description: "A multi-course evening with a local host.", hours: 3, cost: 60, coords: { lat: 41.8965, lng: 12.4742 }, program: everyDay(at(18, 22)), cultural: 3, foodie: 10, adventurous: 4, relaxing: 4, priority: 5 },

  // --- Vatican / Prati cluster (~41.905, 12.455) ----------------------------
  { name: "St. Peter's dome climb", description: "551 steps to the cupola for the best city view.", hours: 1, cost: 10, coords: { lat: 41.9023, lng: 12.4534 }, program: everyDay(at(8, 18)), cultural: 6, foodie: 0, adventurous: 7, relaxing: 1, priority: 7 },
  { name: "Castel Sant'Angelo", description: "Hadrian's mausoleum turned papal fortress.", hours: 2, cost: 15, coords: { lat: 41.9031, lng: 12.4663 }, program: [CLOSED, at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19)], cultural: 8, foodie: 0, adventurous: 4, relaxing: 2, priority: 8 },
  { name: "Prati street-food lunch", description: "Supplì, pizza al taglio and trapizzino crawl.", hours: 2, cost: 35, coords: { lat: 41.9075, lng: 12.4610 }, program: everyDay(at(11, 15)), cultural: 3, foodie: 9, adventurous: 3, relaxing: 5, priority: 4, is_lunch: true },
  { name: "Vatican Gardens walk", description: "Guided loop through the popes' private grounds.", hours: 2, cost: 33, coords: { lat: 41.9045, lng: 12.4520 }, program: weekdaysThenSun(at(9, 17), CLOSED), cultural: 7, foodie: 0, adventurous: 3, relaxing: 6, priority: 5 },

  // --- Trastevere / Gianicolo cluster (~41.889, 12.468) ---------------------
  { name: "Santa Maria in Trastevere", description: "Glittering medieval mosaics in the old basilica.", hours: 1, cost: 0, coords: { lat: 41.8896, lng: 12.4694 }, program: everyDay(at(8, 20)), cultural: 8, foodie: 0, adventurous: 1, relaxing: 4, priority: 6 },
  { name: "Orto Botanico garden", description: "Rome's botanical garden on the Gianicolo slope.", hours: 2, cost: 8, coords: { lat: 41.8907, lng: 12.4640 }, program: weekdaysThenSun(at(9, 18), CLOSED), cultural: 4, foodie: 0, adventurous: 3, relaxing: 8, priority: 4 },
  { name: "Gianicolo terrace & cannon", description: "Panoramic hilltop and the daily noon cannon.", hours: 1, cost: 0, coords: { lat: 41.8918, lng: 12.4615 }, program: everyDay(ALL_DAY), cultural: 4, foodie: 0, adventurous: 4, relaxing: 7, priority: 5 },
  { name: "Tiber Island riverside walk", description: "Cross to the boat-shaped island mid-river.", hours: 1, cost: 0, coords: { lat: 41.8901, lng: 12.4778 }, program: everyDay(ALL_DAY), cultural: 5, foodie: 1, adventurous: 2, relaxing: 6, priority: 4 },
  { name: "Trattoria long lunch", description: "Cacio e pepe and a carafe at a backstreet osteria.", hours: 2, cost: 30, coords: { lat: 41.8888, lng: 12.4710 }, program: everyDay(at(12, 15.5)), cultural: 2, foodie: 9, adventurous: 1, relaxing: 7, priority: 5, is_lunch: true },
  { name: "Craft beer taproom tasting", description: "Flight of Italian craft beers after dark.", hours: 2, cost: 28, coords: { lat: 41.8880, lng: 12.4685 }, program: everyDay(at(17, 24)), cultural: 1, foodie: 7, adventurous: 3, relaxing: 8, priority: 3 },

  // --- Villa Borghese / north cluster (~41.914, 12.485) ---------------------
  { name: "Galleria Borghese", description: "Bernini and Caravaggio masterpieces by timed entry.", hours: 2, cost: 22, coords: { lat: 41.9142, lng: 12.4923 }, program: [CLOSED, at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19)], cultural: 10, foodie: 0, adventurous: 1, relaxing: 3, priority: 8 },
  { name: "Pincio terrace sunset", description: "The classic overlook above Piazza del Popolo.", hours: 1, cost: 0, coords: { lat: 41.9110, lng: 12.4790 }, program: everyDay(ALL_DAY), cultural: 4, foodie: 0, adventurous: 2, relaxing: 8, priority: 5 },
  { name: "Bioparco di Roma", description: "The city zoo inside the Borghese park.", hours: 3, cost: 17, coords: { lat: 41.9180, lng: 12.4880 }, program: everyDay(at(9.5, 18)), cultural: 3, foodie: 1, adventurous: 6, relaxing: 5, priority: 4 },
  { name: "MAXXI contemporary art", description: "Zaha Hadid's museum of 21st-century art.", hours: 2, cost: 12, coords: { lat: 41.9286, lng: 12.4665 }, program: [CLOSED, at(11, 19), at(11, 19), at(11, 19), at(11, 19), at(11, 19), at(11, 19)], cultural: 9, foodie: 0, adventurous: 2, relaxing: 4, priority: 5 },
  { name: "Piazza del Popolo", description: "Grand oval square between the twin churches.", hours: 1, cost: 0, coords: { lat: 41.9109, lng: 12.4763 }, program: everyDay(ALL_DAY), cultural: 6, foodie: 0, adventurous: 2, relaxing: 6, priority: 6 },
  { name: "Borghese lake rowboats", description: "Paddle the little lake by the Temple of Asclepius.", hours: 1, cost: 6, coords: { lat: 41.9156, lng: 12.4843 }, program: everyDay(at(10, 18)), cultural: 1, foodie: 0, adventurous: 5, relaxing: 8, priority: 3 },

  // --- Testaccio / south cluster (~41.873, 12.476) --------------------------
  { name: "Testaccio market brunch", description: "Roman street food in the covered market.", hours: 1, cost: 0, coords: { lat: 41.8757, lng: 12.4752 }, program: weekdaysThenSun(at(9, 15), CLOSED), cultural: 3, foodie: 9, adventurous: 2, relaxing: 5, priority: 5, is_lunch: true },
  { name: "Pyramid of Cestius", description: "A Roman magistrate's Egyptian-style tomb.", hours: 1, cost: 6, coords: { lat: 41.8762, lng: 12.4795 }, program: weekdaysThenSun(at(9, 13), CLOSED), cultural: 7, foodie: 0, adventurous: 2, relaxing: 2, priority: 4 },
  { name: "Non-Catholic Cemetery", description: "Leafy resting place of Keats and Shelley.", hours: 1, cost: 0, coords: { lat: 41.8765, lng: 12.4787 }, program: everyDay(at(9, 17)), cultural: 7, foodie: 0, adventurous: 1, relaxing: 6, priority: 3 },
  { name: "Centrale Montemartini", description: "Classical statues among old power-plant machinery.", hours: 2, cost: 10, coords: { lat: 41.8669, lng: 12.4757 }, program: [CLOSED, at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19)], cultural: 9, foodie: 0, adventurous: 1, relaxing: 3, priority: 5 },
  { name: "Garbatella neighbourhood walk", description: "Garden-city courtyards off the tourist trail.", hours: 2, cost: 0, coords: { lat: 41.8636, lng: 12.4842 }, program: everyDay(ALL_DAY), cultural: 6, foodie: 2, adventurous: 4, relaxing: 6, priority: 3 },

  // --- EUR / far south cluster (~41.831, 12.469) ----------------------------
  { name: "EUR Palazzo della Civiltà", description: "The 'Square Colosseum' of Mussolini-era EUR.", hours: 1, cost: 0, coords: { lat: 41.8327, lng: 12.4665 }, program: everyDay(ALL_DAY), cultural: 7, foodie: 0, adventurous: 2, relaxing: 4, priority: 4 },
  { name: "EUR lake paddle boats", description: "Pedal-boats on the artificial lake.", hours: 1, cost: 9, coords: { lat: 41.8290, lng: 12.4710 }, program: everyDay(at(10, 18)), cultural: 1, foodie: 1, adventurous: 6, relaxing: 8, priority: 2 },
];

// -----------------------------------------------------------------------------
// Paris — 10 activities (same object shape as Rome's). Three midday-open foodie
// spots are flagged is_lunch so the lunch mechanic keeps working.
// -----------------------------------------------------------------------------
const PARIS_BASE = [
  { name: "Eiffel Tower", description: "Ride to the top of Paris's iron icon for sweeping city views.", hours: 2.5, cost: 28, coords: { lat: 48.8584, lng: 2.2945 }, program: everyDay(at(9.5, 23)), cultural: 7, foodie: 0, adventurous: 6, relaxing: 3, priority: 10 },
  { name: "Louvre Museum", description: "The world's largest art museum, from the Mona Lisa to antiquities.", hours: 4, cost: 17, coords: { lat: 48.8606, lng: 2.3376 }, program: [at(9, 18), CLOSED, at(9, 18), at(9, 18), at(9, 18), at(9, 18), at(9, 18)], cultural: 10, foodie: 0, adventurous: 1, relaxing: 2, priority: 10 },
  { name: "Notre-Dame & Île de la Cité", description: "Walk the medieval island around the great cathedral.", hours: 1.5, cost: 0, coords: { lat: 48.8530, lng: 2.3499 }, program: everyDay(ALL_DAY), cultural: 9, foodie: 0, adventurous: 2, relaxing: 4, priority: 9 },
  { name: "Musée d'Orsay", description: "Impressionist masterpieces in a grand former railway station.", hours: 3, cost: 16, coords: { lat: 48.8600, lng: 2.3266 }, program: [CLOSED, at(9.5, 18), at(9.5, 18), at(9.5, 18), at(9.5, 18), at(9.5, 18), at(9.5, 18)], cultural: 10, foodie: 0, adventurous: 1, relaxing: 3, priority: 8 },
  { name: "Montmartre & Sacré-Cœur", description: "Climb the artists' hill to the white basilica and its views.", hours: 2, cost: 0, coords: { lat: 48.8867, lng: 2.3431 }, program: everyDay(ALL_DAY), cultural: 7, foodie: 2, adventurous: 4, relaxing: 6, priority: 9 },
  { name: "Sainte-Chapelle", description: "A jewel-box chapel wrapped in towering stained glass.", hours: 1, cost: 11, coords: { lat: 48.8554, lng: 2.3450 }, program: everyDay(at(9, 17)), cultural: 8, foodie: 0, adventurous: 1, relaxing: 4, priority: 7 },
  { name: "Latin Quarter food walk", description: "Taste crêpes, cheese and wine through the old student quarter.", hours: 2, cost: 38, coords: { lat: 48.8499, lng: 2.3470 }, program: weekdaysThenSun(at(11, 15), CLOSED), cultural: 4, foodie: 9, adventurous: 3, relaxing: 5, priority: 5, is_lunch: true },
  { name: "Le Marais café & falafel", description: "Famous falafel and cosy cafés in the historic Marais.", hours: 2, cost: 25, coords: { lat: 48.8571, lng: 2.3590 }, program: everyDay(at(11, 16)), cultural: 3, foodie: 9, adventurous: 2, relaxing: 5, priority: 5, is_lunch: true },
  { name: "Luxembourg Gardens", description: "Relax by the fountains in Paris's most elegant park.", hours: 1.5, cost: 0, coords: { lat: 48.8462, lng: 2.3372 }, program: everyDay(at(8, 18)), cultural: 3, foodie: 0, adventurous: 2, relaxing: 9, priority: 6 },
  { name: "Macaron & pâtisserie tasting", description: "Sample macarons and pastries at storied Paris patisseries.", hours: 1, cost: 22, coords: { lat: 48.8540, lng: 2.3340 }, program: everyDay(at(10, 19)), cultural: 2, foodie: 9, adventurous: 1, relaxing: 7, priority: 5, is_lunch: true },
];

// Public catalogues: the hand-authored entries above, each carrying the empty
// takemytrip-aligned metadata fields (id, prices, websites, notes, tags,
// best_time, restaurants, emoji, googleMapUrl).
export const ROME_ACTIVITIES = ROME_BASE.map((a) => withMeta(a));
export const PARIS_ACTIVITIES = PARIS_BASE.map((a) => withMeta(a));

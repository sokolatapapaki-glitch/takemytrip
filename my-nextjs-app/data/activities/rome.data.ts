// -----------------------------------------------------------------------------
// Rome — the 26 activities from takemytrip/data/rome.json (DATA ONLY).
// -----------------------------------------------------------------------------
// Hand-curated catalogue (NOT auto-generated — gen-activities.mjs lists rome in
// its CURATED set and never touches this file). Lives here, alongside the other
// per-city catalogues, but unlike them it carries the JSON's real metadata
// (per-age + family `prices`, nearby restaurant/cafe, website, notes, tags). The
// shared builders (at/everyDay/ALL_DAY/food/cafe/site) + the element type come
// from ./_helpers, like the other cities; the few extras this catalogue needs
// (CLOSED, weekdaysThenSun, ages, FREE) are defined locally below.
//
// The JSON has NO scheduling/scoring data, so the engine fields
// (program/hours/vibes/priority) are filled two ways: the ~12 activities that
// already existed in the hand-authored catalogue borrow that nextjs object's
// tuned values; the ~14 new ones get values synthesized from their JSON
// `category` + `tags` (best-effort, tune later).
import type { CatalogueActivity, Window } from "./_helpers";
import { ALL_DAY, at, everyDay, food, cafe, site } from "./_helpers";

// --- Rome-specific builders (not shared via _helpers) ------------------------
// Shut that day. Also re-exported under its historical name for core (which
// imports CLOSED alongside ROME_ACTIVITIES to type the planner's "closed" hours).
export const CLOSED: Window = { open: 0, close: 0 };
// Mon–Sat one window, Sunday another (e.g. shorter or closed).
const weekdaysThenSun = (week: Window, sun: Window): Window[] => [
  week, week, week, week, week, week, sun,
];
// An age→price map from ascending [fromAge, price] bands: every age 0..19 takes
// the price of the highest band starting at or below it; `adult` (18+) is the
// explicit adult price. Reproduces the takemytrip per-age `prices` object exactly.
const ages = (bands: [number, number][], adult: number): Record<string, number> => {
  const m: Record<string, number> = {};
  for (let a = 0; a <= 19; a++) {
    let p = 0;
    for (const [from, price] of bands) if (a >= from) p = price;
    m[String(a)] = p;
  }
  m.adult = adult;
  return m;
};
// A wholly-free activity's age map (every age 0, adult 0).
const FREE = (): Record<string, number> => ages([[0, 0]], 0);

export const ROME_ACTIVITIES: CatalogueActivity[] = [
  // #1 Castle on Lake Bracciano — synthesized (castle).
  {
    id: 1,
    name: "Castello Orsini-Odescalchi (Bracciano)",
    description: "Ένα εντυπωσιακό κάστρο πάνω στη λίμνη Bracciano (περίπου 1 ώρα από τη Ρώμη). Είναι πολύ καλά διατηρημένο και συχνά οργανώνει θεματικές ξεναγήσεις για παιδιά.",
    hours: 2, cost: 10, coords: { lat: 42.1034, lng: 12.1782 },
    program: everyDay(at(9, 18)),
    cultural: 8, foodie: 0, adventurous: 4, relaxing: 3, priority: 5,
    prices: { ages: ages([[0, 0], [6, 8], [13, 10]], 10), family: { "2_adults_2_children": 0 } },
    websites: [site("https://odescalchi.it/")],
    googleMapUrl: null,
    notes: [],
    tags: ["castle", "history"],
    best_time: null,
    restaurants: [
      food("Trattoria Da Regina", "Μια αυθεντική ρωμαϊκή τρατορία με πολύ καλές κριτικές και τιμές.", "https://maps.app.goo.gl/U4CoHE5PoifmuwnY9"),
      cafe("Caffè del Castello", "Βρίσκεται ακριβώς έξω από το κάστρο. Είναι το πιο κλασικό σημείο για να ξεκινήσετε τη μέρα έχοντας θέα τα τείχη.", "https://maps.app.goo.gl/v5ozBDCCU4wKaKxC7"),
    ],
    emoji: null,
  },
  // #26 Seaside castle — synthesized (castle).
  {
    id: 26,
    name: "Santa Severa Castle",
    description: "Ένα παραθαλάσσιο κάστρο με ιστορία αιώνων, λίγο έξω από τη Ρώμη. Προσφέρει εκπληκτική θέα στη θάλασσα και μια γοητευτική εμπειρία για οικογένειες.",
    hours: 2, cost: 8, coords: { lat: 42.0199, lng: 11.9489 },
    program: everyDay(at(9, 18)),
    cultural: 8, foodie: 0, adventurous: 4, relaxing: 3, priority: 5,
    prices: { ages: ages([[0, 0], [6, 6], [15, 8]], 8), family: { "2_adults_all_children_under_17": 16 } },
    websites: [],
    googleMapUrl: null,
    notes: [],
    tags: ["castle", "history", "seaside"],
    best_time: null,
    restaurants: [],
    emoji: null,
  },
  // #2 3D history experience — synthesized (museum-like).
  {
    id: 2,
    name: "Welcome to Rome",
    description: "Το Welcome to Rome είναι μια τρισδιάστατη εμπειρία που δείχνει την ιστορία της Ρώμης με τρόπο που μοιάζει με ταινία. Μέσα από φωτεινές προβολές και μακέτες που αλλάζουν μπροστά στα μάτια σας, βλέπετε πώς χτίστηκαν τα αρχαία μνημεία και πώς εξελίχθηκε η πόλη μέσα στους αιώνες. Είναι ένας εύκολος και ξεκούραστος τρόπος για να καταλάβουν οι μεγάλοι και κυρίως τα παιδιά τι θα δουν αργότερα στις βόλτες τους στους αρχαιολογικούς χώρους.",
    hours: 1.5, cost: 16, coords: { lat: 41.9025, lng: 12.4759 },
    program: everyDay(at(9, 19)),
    cultural: 7, foodie: 0, adventurous: 2, relaxing: 4, priority: 5,
    prices: { ages: ages([[0, 0], [6, 11], [18, 16]], 16), family: { "2_adults_2_children": 0 } },
    websites: [site("https://welcometo-rome.it/")],
    googleMapUrl: null,
    notes: [],
    tags: ["history"],
    best_time: null,
    restaurants: [
      food("Da Tonino - Trattoria Bassetti", "Μια αυθεντική τρατορία που την προτιμούν οι ντόπιοι. Δεν έχει φανφάρες στη διακόσμηση, αλλά το φαγητό είναι σπιτικό, οι μερίδες γενναιόδωρες και οι τιμές πολύ λογικές για το κέντρο της Ρώμης", "https://maps.app.goo.gl/NiKYfc9obgSvJZUq8"),
      cafe("Two Sizes", "Είναι διάσημο κυρίως για το τιραμισού του, το οποίο βγαίνει σε δύο μεγέθη (εξ ου και το όνομα) και σε διάφορες γεύσεις, όπως η κλασική, φιστίκι, φράουλα, καραμέλα και φυστικοβούτυρο. Εκτός από τιραμισού, θα βρείτε επίσης πολύ ωραία σικελιανά κανόλι.", "https://maps.app.goo.gl/LKpMgWxg1o5Mbt437"),
    ],
    emoji: null,
  },
  // #3 Gianicolo puppet theatre — borrows "Gianicolo terrace & cannon".
  {
    id: 3,
    name: "Λόφος Gianicolo (Teatrino di Pulcinella)",
    description: "Στον λόφο Gianicolo, στήνεται ένα παραδοσιακό κουκλοθέατρο με τον Pulcinella. Είναι δωρεάν συμβουλευτείτε την επίσημη ιστοσελίδα για ημέρες και ώρες. Στις 12:00 ακριβώς, μπορείτε να ακούσετε και τον παραδοσιακό κανονιοβολισμό.",
    hours: 1, cost: 0, coords: { lat: 41.8944, lng: 12.4621 },
    program: everyDay(ALL_DAY),
    cultural: 4, foodie: 0, adventurous: 4, relaxing: 7, priority: 5,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.turismoroma.it/it/node/3283")],
    googleMapUrl: null,
    notes: [],
    tags: ["park", "views", "family"],
    best_time: null,
    restaurants: [
      food("Pastevere - Pastificio artigianale con cucina", "Βρίσκεται σε κοντινή απόσταση με τα πόδια, προς την πλευρά του Βατικανού, με πολύ καλές τιμές και καλές κριτικές", "https://maps.app.goo.gl/PsYEKzHhQDemhQAB7"),
      cafe("Bar Gianicolo", "Βρίσκεται ακριβώς πάνω στον λόφο. Είναι ένα κλασικό, απλό ιταλικό μπαρ,ότι πρέπει για έναν γρήγορο καφέ", "https://maps.app.goo.gl/sY2jjR5KoXyhkhgK6"),
    ],
    emoji: null,
  },
  // #4 Aqueduct park — synthesized (park).
  {
    id: 4,
    name: "Parco degli Acquedotti",
    description: "Είναι ένα τεράστιο πάρκο με αρχαίες καμάρες που μοιάζουν με γέφυρες και στέκονται εκεί εδώ και αιώνες. Μπορείτε να κάνετε πικ νικ κάτω από τα δέντρα, βλέποντας τα ερείπια από κοντά.",
    hours: 2, cost: 0, coords: { lat: 41.8436, lng: 12.5588 },
    program: everyDay(ALL_DAY),
    cultural: 3, foodie: 0, adventurous: 5, relaxing: 8, priority: 4,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.parcodegliacquedotti.it/")],
    googleMapUrl: null,
    notes: [],
    tags: ["park", "aqueducts", "history", "free"],
    best_time: null,
    restaurants: [
      food("Fermentum", "Ίσως η πιο δημοφιλής επιλογή, ένα εστιατόριο-πιτσαρία μέσα στο πάρκο.", "https://maps.app.goo.gl/iNmkvjqCzGTTUxDJA"),
      cafe("Maat American Cafe", "Αμερικανικού τύπου πρωινό,καφές, σνακ, brunch, pancakes και burgers", "https://maps.app.goo.gl/NPtMidiNL3DW2E248"),
    ],
    emoji: null,
  },
  // #5 Leonardo museum — synthesized (interactive museum).
  {
    id: 5,
    name: "Museo Leonardo Da Vinci",
    description: "Στο μουσείο της Piazza del Popolo, τα παιδιά έρχονται σε επαφή με τον κόσμο του Λεονάρντο μέσα από ξύλινες μηχανές που μπορούν να αγγίξουν και να κινήσουν. Είναι ένας χώρος γεμάτος έξυπνες εφευρέσεις για την πτήση και τη μηχανική, μαζί με αντίγραφα των διάσημων πινάκων του.",
    hours: 2, cost: 14, coords: { lat: 41.9113, lng: 12.4763 },
    program: everyDay(at(9, 19)),
    cultural: 6, foodie: 0, adventurous: 5, relaxing: 4, priority: 5,
    prices: { ages: ages([[0, 0], [6, 12], [18, 14]], 14), family: { "2_adults_2_children": 40 } },
    websites: [site("https://www.museodavinci.it/")],
    googleMapUrl: null,
    notes: [],
    tags: ["museum", "family"],
    best_time: null,
    restaurants: [
      food("Al Vantaggio", "Ένα κλασικό εστιατόριο της περιοχής με μεγάλη ιστορία. Έχει άνετο χώρο και όλα τα αγαπημένα των παιδιών, όπως απλές μακαρονάδες και πίτσα ψημένη σε ξυλόφουρνο.", "https://maps.app.goo.gl/1Ap4vUe623XpMW8c9"),
      cafe("La Vita è Un Mozzico", "Σούπερ επιλογή για γρήγορο σνακ, σάντουιτς ή πίτσα στο χέρι, με πολύ καλές κριτικές.", "https://maps.app.goo.gl/GZP2H6sQufSoowCi8"),
    ],
    emoji: null,
  },
  // #6 Coppedè quarter — synthesized (neighborhood).
  {
    id: 6,
    name: "Quartiere Coppedè",
    description: "Μια γειτονιά που μοιάζει να βγήκε από παραμύθι ή ταινία φαντασίας. Η αρχιτεκτονική με τις λεπτομέρειες από ζώα, σιδερένια φανάρια και το Σιντριβάνι των Βατράχων (Fontana delle Rane) είναι υπέροχα.",
    hours: 1, cost: 0, coords: { lat: 41.9242, lng: 12.5132 },
    program: everyDay(ALL_DAY),
    cultural: 6, foodie: 1, adventurous: 3, relaxing: 6, priority: 4,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.turismoroma.it/it/luoghi/il-quartiere-copped%C3%A8")],
    googleMapUrl: null,
    notes: [],
    tags: ["architecture", "neighborhood", "free"],
    best_time: null,
    restaurants: [
      food("Mascalzoni Romani", "Απέχει μόλις 5 λεπτά με τα πόδια από την Piazza Mincio και φημίζεται για την πολύ υψηλή βαθμολογία του (4.9) και την αυθεντική ρωμαϊκή του κουζίνα", "https://maps.app.goo.gl/DdPZ5Cyvway5ntE1A"),
      cafe("Gruè", "Αν βρεθείτε στην περιοχή για πρωινό ή απόγευμα, αυτο το μαγαζί είναι \"must\". Θεωρείται από τα καλύτερα της Ρώμης για τα γλυκά , τα μακαρόν και τον καφέ .", "https://maps.app.goo.gl/T15AGrpt8iiZGn4a9"),
    ],
    emoji: null,
  },
  // #7 Aventine Keyhole — synthesized (free viewpoint).
  {
    id: 7,
    name: "Η Τρύπα της Κλειδαριάς (Aventine Keyhole)",
    description: "Στον λόφο Aventine, υπάρχει μια πόρτα με μια κλειδαριά από την οποία μπορείτε να δείτε τέλεια ευθυγραμμισμένο τον τρούλο του Αγίου Πέτρου.",
    hours: 1, cost: 0, coords: { lat: 41.8834, lng: 12.4796 },
    program: everyDay(ALL_DAY),
    cultural: 6, foodie: 0, adventurous: 3, relaxing: 5, priority: 4,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.atlasobscura.com/places/the-aventine-keyhole-rome-rome-italy")],
    googleMapUrl: null,
    notes: [],
    tags: ["hidden gem", "views", "free"],
    best_time: null,
    restaurants: [
      food("Εστιατόριο ελληνικο", "Αν τυχαίνει να σας έχει λείψει η ελληνική κουζίνα, αυτό το εστιατόριο είναι πολύ δημοφιλές στην περιοχή και με πολύ καλές τιμές.", "https://maps.app.goo.gl/Mw5ndE9ZY6yPhCvH7"),
      cafe("Tram Depot", "Ένα πολύ ιδιαίτερο καφέ-κιόσκι που μοιάζει με παλιό βαγόνι τραμ. Είναι ιδανικό για καφέ, χυμούς και ελαφριά σνακ σε εξωτερικό χώρο", "https://maps.app.goo.gl/RZ7eBSeizqRKwbyP7"),
    ],
    emoji: null,
  },
  // #8 Villa Carpegna park — synthesized (park).
  {
    id: 8,
    name: "Villa Carpegna",
    description: "Ένα μικρότερο, πιο ήσυχο πάρκο με μια πολύ ωραία παιδική χαρά που είναι ασφαλής για τα πολύ μικρά παιδιά.",
    hours: 2, cost: 0, coords: { lat: 41.9047, lng: 12.4355 },
    program: everyDay(ALL_DAY),
    cultural: 3, foodie: 0, adventurous: 5, relaxing: 8, priority: 4,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.turismoroma.it/en/places/villa-carpegna")],
    googleMapUrl: null,
    notes: [],
    tags: ["park", "nature", "family"],
    best_time: null,
    restaurants: [
      food("Mejo ! \"Cucina Romana\"", "Είναι μια εξαιρετική επιλογή για αυθεντικό ρωμαϊκό φαγητό σε έναν πιο ανεπίσημο και ζωντανό χώρο. Έχει πολύ υψηλή βαθμολογία (4.9), κάτι που δείχνει την ποιότητα της κουζίνας του.", "https://maps.app.goo.gl/oxvhVLnEfNpC6FRR8"),
      cafe("Fermento Bistrot Caffè", "Είναι μια πολύ βολική επιλογή, καθώς βρίσκεται ακριβώς απέναντι από την είσοδο της Villa Carpegna.", "https://maps.app.goo.gl/3GcQt55EAFN8JigA9"),
    ],
    emoji: null,
  },
  // #9 Explora children's museum — synthesized (interactive museum).
  {
    id: 9,
    name: "Explora",
    description: "Ένας παράδεισος για τα παιδιά στη Ρώμη, μοιάζει με μια μικρή, δική τους πόλη. Τα παιδιά έχουν την ευκαιρία να πειραματιστούν με το νερό, να παίξουν ρόλους στην αγορά ή στην τράπεζα και να κατανοήσουν πώς λειτουργεί ο κόσμος γύρω τους μέσα από το παιχνίδι.Εχει ειδικά διαμορφωμένο χώρο για παιδιά κάτω των 3 ετών, με μαλακά παιχνίδια και αισθητηριακές δραστηριότητες. Τιμές καθημερινές λίγο χαμηλότερες.",
    hours: 2, cost: 11, coords: { lat: 41.9317, lng: 12.4745 },
    program: everyDay(at(10, 18)),
    cultural: 4, foodie: 0, adventurous: 6, relaxing: 5, priority: 5,
    prices: { ages: ages([[0, 0], [1, 7], [3, 11]], 11), family: { "2_adults_2_children": 0 } },
    websites: [site("https://mdbr.it/")],
    googleMapUrl: null,
    notes: [],
    tags: ["museum", "children", "interactive", "family"],
    best_time: null,
    restaurants: [
      food("Ristorante Pizzeria Popolo Caffè", "Μόλις λίγα μέτρα από το μουσείο Explora. Λειτουργεί όλη την ημέρα, συνδυάζει καφέ, σνακ και κανονικό φαγητό με πίτσα και ζυμαρικά", "https://maps.app.goo.gl/mvW3wQCzZw4i1Uyu6"),
      cafe("Sensorio Coffee Lab", "Απέχει μόλις λίγα μέτρα από το μουσείο Explora. Πρόκειται για ένα σύγχρονο καφέ που εστιάζει στην ποιότητα του χαρμανιού με ωραίες επιλογές για πρωινό, ελαφριά σνακ και γλυκά. ", "https://maps.app.goo.gl/p4BSGkQH3EDpY39T8"),
    ],
    emoji: null,
  },
  // #10 Museum of Illusions — synthesized (interactive museum).
  {
    id: 10,
    name: "Museo delle Illusioni (Μουσείο Ψευδαισθήσεων)",
    description: "Ένας διασκεδαστικός χώρος με οπτικές απάτες και δωμάτια που προκαλούν τις αισθήσεις, κατάλληλο για πολλές φωτογραφίες",
    hours: 1.5, cost: 21, coords: { lat: 41.8941, lng: 12.4982 },
    program: everyDay(at(10, 19)),
    cultural: 4, foodie: 0, adventurous: 7, relaxing: 5, priority: 5,
    prices: { ages: ages([[0, 0], [6, 15], [16, 21]], 21), family: { "2_adults_2_children": 54 } },
    websites: [site("https://www.museoillusioni.it/")],
    googleMapUrl: null,
    notes: [],
    tags: ["museum", "interactive", "family"],
    best_time: null,
    restaurants: [
      food("Merulì - Pizza e Cucina", "Περίπου 5 λεπτά με τα πόδια. Πολύ ωραία πίτσα και κλασικά ρωμαϊκά πιάτα σε έναν φιλόξενο χώρο.", "https://maps.app.goo.gl/gX7RFZJBxzAmoa7y9"),
      cafe("Merulana Cafè", "Ένα κλασικό σημείο συνάντησης πάνω στον δρόμο, ανοιχτό όλη μέρα, για καφέ ή ένα ελαφρύ γεύμα.", "https://maps.app.goo.gl/oVJDKxSoSGRmryZc8"),
    ],
    emoji: null,
  },
  // #11 Villa Borghese park — borrows "Villa Borghese bike ride".
  {
    id: 11,
    name: "Villa Borghese",
    description: "Το πιο γνωστό πάρκο της πόλης. Εκεί μπορείτε να νοικιάσετε οικογενειακά ποδήλατα, να κάνετε βαρκάδα στη λίμνη ή να δείτε μια παράσταση στο κουκλοθέατρο San Carlino",
    hours: 2, cost: 0, coords: { lat: 41.9139, lng: 12.4889 },
    program: [CLOSED, at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19)],
    cultural: 2, foodie: 1, adventurous: 8, relaxing: 6, priority: 4,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.sovraintendenzaroma.it/i_luoghi/ville_e_parchi_storici/ville_dei_nobili/villa_borghese")],
    googleMapUrl: null,
    notes: [],
    tags: ["park", "nature", "family", "free"],
    best_time: null,
    restaurants: [
      food("Osteria la Giara - Vino & Cucina dal 1920", "Πρόκειται για ένα ιστορικό εστιατόριο που κρατά από το 1920. Έχει παραδοσιακό χαρακτήρα και είναι γνωστό για την καλή ποιότητα των υλικών του.", "https://maps.app.goo.gl/AUqetNhD1NLemyNLA"),
      cafe("Caffè delle Arti", "Βρίσκεται στην Εθνική Πινακοθήκη Μοντέρνας Τέχνης (GNAM) στην άκρη του πάρκου", "https://maps.app.goo.gl/aZSFqZ2e6spvjDww5"),
    ],
    emoji: null,
  },
  // #12 Bioparco zoo — borrows "Bioparco di Roma".
  {
    id: 12,
    name: "Bioparco di Roma",
    description: "Ο ζωολογικός κήπος της Ρώμης, που βρίσκεται μέσα στη Villa Borghese και φιλοξενεί πάνω από 1.000 ζώα.",
    hours: 3, cost: 22, coords: { lat: 41.9182, lng: 12.4837 },
    program: everyDay(at(9.5, 18)),
    cultural: 3, foodie: 1, adventurous: 6, relaxing: 5, priority: 4,
    prices: { ages: ages([[0, 0], [3, 15], [10, 22]], 22), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.bioparco.it/")],
    googleMapUrl: null,
    notes: ["Παιδιά κάτω από 1 μέτρο ύψος εισέρχονται δωρεάν."],
    tags: ["zoo", "animals", "family"],
    best_time: null,
    restaurants: [
      food("Taverna Rossini", "Βρίσκεται στην περιοχή Parioli, βόρεια του πάρκου. Είναι ένα κλασικό στέκι των ντόπιων που λειτουργεί όλη μέρα και έχει τα πάντα: από πίτσα και ζυμαρικά μέχρι φρέσκο ψάρι.", "https://maps.app.goo.gl/GMxp9tU85ZnwHVpo7"),
    ],
    emoji: null,
  },
  // #13 Galleria Borghese — borrows "Galleria Borghese".
  {
    id: 13,
    name: "Galleria Borghese",
    description: "Μουσείο με διάσημα αγάλματα και πίνακες (Bernini, Caravaggio). Ο χώρος είναι περιορισμένος, πρέπει να κλείσετε εισιτήρια από πριν.",
    hours: 2, cost: 15, coords: { lat: 41.9147, lng: 12.4931 },
    program: [CLOSED, at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19)],
    cultural: 10, foodie: 0, adventurous: 1, relaxing: 3, priority: 8,
    prices: { ages: ages([[0, 0], [18, 15]], 15), family: { "2_adults_2_children": 0 } },
    websites: [],
    googleMapUrl: null,
    notes: [],
    tags: ["museum", "art", "sculpture"],
    best_time: null,
    restaurants: [
      food("Osteria la Giara - Vino & Cucina dal 1920", "Είναι μια εξαιρετική επιλογή για αυθεντική ρωμαϊκή κουζίνα σε έναν χώρο με ιστορία που ξεπερνά τα 100 χρόνια. Απέχει περίπου 10 λεπτά με τα πόδια από την έξοδο της Villa Borghese (κοντά στην Porta Pinciana), οπότε είναι μια πολύ καλή λύση για φαγητό αν βρίσκεστε σε εκείνη την πλευρά του πάρκου.", "https://maps.app.goo.gl/ULLFNNHcihrLmY2Q6"),
      cafe("Faro - Caffè Specialty", "Είναι μια εξαιρετική επιλογή, καθώς θεωρείται ένα από τα καλύτερα σημεία για καφέ στη Ρώμη, με έμφαση στην ποιότητα των κόκκων και τη βιώσιμη προέλευση.", "https://maps.app.goo.gl/6GnxvkkAz8su827cA"),
    ],
    emoji: null,
  },
  // #14 Gladiator school — synthesized (interactive attraction).
  {
    id: 14,
    name: "Rome Gladiator School - Gruppo Storico Romano",
    description: "Τα παιδιά μαθαίνουν τις τεχνικές των μονομάχων φορώντας παραδοσιακές στολές.Κατάλληλο απο 6 ετών και άνω. ",
    hours: 2, cost: 55, coords: { lat: 41.8925, lng: 12.5121 },
    program: everyDay(at(10, 17)),
    cultural: 6, foodie: 0, adventurous: 8, relaxing: 2, priority: 5,
    prices: { ages: ages([[0, 0], [6, 55]], 55), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.gruppostoricoromano.it/")],
    googleMapUrl: null,
    notes: [],
    tags: ["gladiator", "history", "interactive", "family"],
    best_time: null,
    restaurants: [
      food("Trattoria Priscilla", "Μια οικογενειακή επιχείρηση με ιστορία δεκαετιών.", "https://maps.app.goo.gl/gkszgFEJneQvUsKU8"),
    ],
    emoji: null,
  },
  // #15 Cinecittà World — synthesized (theme park).
  {
    id: 15,
    name: "Cinecittà World",
    description: "Πάρκο αφιερωμένο στον κινηματογράφο και την τηλεόραση με παιχνίδια και θεάματα για όλες τις ηλικίες. Σημείωση: οι γονείς πρέπει να ελέγχουν το ύψος των παιδιών πριν αγοράσουν εισιτήρια.",
    hours: 5, cost: 29, coords: { lat: 41.7233, lng: 12.4503 },
    program: everyDay(at(11, 19)),
    cultural: 1, foodie: 1, adventurous: 9, relaxing: 4, priority: 4,
    prices: { ages: ages([[0, 0], [3, 24], [10, 29]], 29), family: { "4_tickets": 84, "3_tickets": 72 } },
    websites: [site("https://www.cinecittaworld.it/it")],
    googleMapUrl: null,
    notes: ["Τιμολόγηση βάσει ύψους: έως 1μ δωρεάν, 1μ–1,40μ: 24€, άνω 1,40μ: 29€."],
    tags: ["theme park", "rides", "family"],
    best_time: null,
    restaurants: [],
    emoji: null,
  },
  // #16 Luneur Park — synthesized (theme park for young kids).
  {
    id: 16,
    name: "Luneur Park",
    description: "Ιστορικό λούνα παρκ, ειδικό για μικρότερα παιδιά από 2 έως 12 ετών.",
    hours: 3, cost: 0, coords: { lat: 41.8296, lng: 12.4731 },
    program: everyDay(at(10, 19)),
    cultural: 1, foodie: 1, adventurous: 7, relaxing: 5, priority: 3,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.luneurpark.it/")],
    googleMapUrl: null,
    notes: ["Pricing is dynamic (entry + rides or packages ~15–25€), no fixed ticket."],
    tags: ["amusement park", "rides", "family"],
    best_time: null,
    restaurants: [
      food("Garden Ristò EUR", "Ένα όμορφο cafe-bistrot με κήπο, ιδανικό για καφέ, πρωινό ή  μεσημεριανό δίπλα στο Luneur Park. ", "https://maps.app.goo.gl/C8fDzvmsXqoJtgdg9"),
    ],
    emoji: null,
  },
  // #17 Colosseum & Roman Forum — borrows "Colosseum & Roman Forum".
  {
    id: 17,
    name: "Κολοσσαίο & Ρωμαϊκή Αγορά",
    description: "Υπάρχουν διαθέσιμες ξεναγήσεις με κυνήγι θησαυρού ή ιστορίες για μονομάχους ειδικά διαμορφωμένες για οικογένειες με παιδιά.",
    hours: 3, cost: 18, coords: { lat: 41.8902, lng: 12.4922 },
    program: everyDay(at(8.5, 19)),
    cultural: 9, foodie: 0, adventurous: 4, relaxing: 2, priority: 10,
    prices: { ages: ages([[0, 0], [18, 18]], 18), family: { "2_adults_2_children": 0 } },
    websites: [site("https://colosseo.it/")],
    googleMapUrl: null,
    notes: [],
    tags: ["monument", "history", "iconic", "ancient rome"],
    best_time: null,
    restaurants: [
      food("Ristorante Pizza Forum", "Είναι μια εξαιρετική επιλογή για την περιοχή, καθώς καταφέρνει να διατηρεί υψηλή ποιότητα και καλές τιμές παρά την πολύ τουριστική του τοποθεσία.", "https://maps.app.goo.gl/RxNfqFKriegzWzFD7"),
      cafe("RoYaL Art Cafè", "Βρίσκεται ακριβώς απέναντι από το Κολοσσαίο. Αν και είναι τουριστικό σημείο, η ταράτσα του είναι υπέροχη για έναν καφέ με άμεση θέα στο μνημείο.", "https://maps.app.goo.gl/qLvTvvVdo5uNEbPy5"),
    ],
    emoji: null,
  },
  // #18 Castel Sant'Angelo — borrows "Castel Sant'Angelo".
  {
    id: 18,
    name: "Castel Sant'Angelo",
    description: "Κάστρο δίπλα στον Τίβερη με μυστικά περάσματα και υπέροχη θέα από την ταράτσα.Προτείνεται απο 6-7 ετών και πάνω. Το καρότσι για μικρότερα παιδιά θα σας δυσκολέψει. Ακριβώς έξω από το κάστρο υπάρχει το Parco Adriano, ένα μεγάλο πάρκο με παιδική χαρά,",
    hours: 2, cost: 16, coords: { lat: 41.9029, lng: 12.4663 },
    program: [CLOSED, at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19)],
    cultural: 8, foodie: 0, adventurous: 4, relaxing: 2, priority: 8,
    prices: { ages: ages([[0, 0], [18, 16]], 16), family: { "2_adults_2_children": 0 } },
    websites: [site("https://castelsantangelorome.com/")],
    googleMapUrl: null,
    notes: [],
    tags: ["castle", "history", "monument", "iconic"],
    best_time: null,
    restaurants: [
      food("Trattoria Pancia Felice", "Σε απόσταση αναπνοής, με πολύ καλές κριτικές και τιμές", "https://maps.app.goo.gl/Je7KWRAXfYs31ViBA"),
    ],
    emoji: null,
  },
  // #19 Largo di Torre Argentina — borrows "Largo Argentina cat sanctuary".
  {
    id: 19,
    name: "Largo di Torre Argentina",
    description: "Αρχαία πλατεία που  πλεόν λειτουργεί ως καταφύγιο για γάτες. Είναι ο τόπος δολοφονίας του Ιουλίου Καίσαρα.",
    hours: 1, cost: 0, coords: { lat: 41.8956, lng: 12.4769 },
    program: everyDay(at(12, 18)),
    cultural: 5, foodie: 0, adventurous: 2, relaxing: 7, priority: 3,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.rome-info.gr/2016/03/to-shmeio-dolofonias-tou-iouliou-kesara-torre-argentina.html")],
    googleMapUrl: null,
    notes: [],
    tags: ["monument", "history", "ancient rome", "cats"],
    best_time: null,
    restaurants: [
      food("Emma Pizzeria Restaurant", "Μια από τις πιο γνωστές pizzerie στην περιοχή. Φημίζεται για τη λεπτή, τραγανή ρωμαϊκή πίτσα και τα ποιοτικά υλικά της.", "https://maps.app.goo.gl/U5u2Tddexx8F4kqU6"),
      cafe("Slow - Specialty Coffee & Pastry Lab", "Δίνει έμφαση στον ποιοτικό καφέ και τα χειροποίητα γλυκά.", "https://maps.app.goo.gl/A7t9g9fdw4c9iN7x7"),
    ],
    emoji: null,
  },
  // #20 Pantheon — borrows "Pantheon".
  {
    id: 20,
    name: "Πάνθεον",
    description: "Αρχαίος εντυπωσιακός ναός με τεράστιο τρούλο και τρύπα στην οροφή. Το νερό της βροχής όταν πέφτει εξαφανίζεται σε μικρές τρύπες στο πάτωμα.",
    hours: 1, cost: 5, coords: { lat: 41.8986, lng: 12.4768 },
    program: weekdaysThenSun(at(9, 19), at(9, 18)),
    cultural: 8, foodie: 0, adventurous: 1, relaxing: 4, priority: 9,
    prices: { ages: ages([[0, 0], [18, 5]], 5), family: { "2_adults_2_children": 0 } },
    websites: [site("https://direzionemuseiroma.cultura.gov.it/pantheon/")],
    googleMapUrl: null,
    notes: [],
    tags: ["monument", "history", "iconic", "ancient rome"],
    best_time: null,
    restaurants: [
      food("Miscellanea", "Μια πολύ καλή και πιο οικονομική λύση ακριβώς πίσω από το Πάνθεον. Είναι ένας χώρος με υπαίθρια τραπεζάκια και πολύ δημοφιλής", "https://maps.app.goo.gl/q7TVzenJGv4fSqpx7"),
      cafe("La Casa del Caffè Tazza d'Oro", "Ένα ιστορικό σημείο ακριβώς δίπλα στο μνημείο. Είναι το ιδανικό μέρος για να δοκιμάσετε τη διάσημη γρανίτα καφέ με σαντιγί ειδικά αν ο καιρός είναι ζεστός.", "https://maps.app.goo.gl/ZwBGPFuG7WmyFJca6"),
    ],
    emoji: null,
  },
  // #21 Piazza Navona — borrows "Piazza Navona".
  {
    id: 21,
    name: "Piazza Navona",
    description: "Μεγάλη πλατεία γεμάτη  πανέμορφα σιντριβάνια και ζωγράφους.",
    hours: 1, cost: 0, coords: { lat: 41.8992, lng: 12.4733 },
    program: everyDay(ALL_DAY),
    cultural: 6, foodie: 1, adventurous: 1, relaxing: 6, priority: 8,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.turismoroma.it/en/places/navona-square")],
    googleMapUrl: null,
    notes: [],
    tags: ["piazza", "fountain", "iconic", "free"],
    best_time: null,
    restaurants: [
      food("Pizza Zazà", "Φημίζεται για την εξαιρετική του πίτσα με βιολογικό αλεύρι και για τις πολύ καλές τιμές. Μπορείτε να πάρετε μερικά κομμάτια στο χέρι και να συνεχίσετε τη βόλτα .", "https://maps.app.goo.gl/RiiospAPJmKGA1e18"),
      cafe("L'Emporio alla Pace", "Ένα από τα πιο ατμοσφαιρικά καφέ, γεμάτο βιβλία και vintage έπιπλα. Είναι ήσυχο, ιδανικό για να χαλαρώσετε σε έναν από τους πιο γραφικούς δρόμους πίσω από την πλατεία.", "https://maps.app.goo.gl/w7j1HMKunMfgNk8W8"),
    ],
    emoji: null,
  },
  // #22 Trevi Fountain — borrows "Trevi Fountain".
  {
    id: 22,
    name: "Fontana di Trevi",
    description: "Το διάσημο πανέμορφο σιντριβάνι όπου ρίχνουν νόμισμα οι επισκέπτες με την ευχή να επιστρέψουν στην Ρώμη.",
    hours: 1, cost: 2, coords: { lat: 41.9009, lng: 12.4833 },
    program: everyDay(ALL_DAY),
    cultural: 5, foodie: 0, adventurous: 1, relaxing: 4, priority: 9,
    prices: { ages: ages([[0, 2]], 2), family: { "2_adults_2_children": 0 } },
    websites: [site("https://fontanaditrevi.roma.it/en")],
    googleMapUrl: null,
    notes: ["Το εισιτήριο αφορά μόνο την κατέβασμα για να το δείτε από κοντά. Αν θέλετε απλώς να το δείτε από μακριά, είναι δωρεάν."],
    tags: ["fountain", "iconic", "monument"],
    best_time: null,
    restaurants: [
      food("L'Antica Birreria Peroni", "Ένας ιστορικός χώρος που θυμίζει παλιό ζυθοποιείο. Είναι ιδανικό για ένα πιο γρήγορο και οικονομικό γεύμα, με μεγάλη ποικιλία, καλές τιμές και κριτικές.", "https://maps.app.goo.gl/vcGFBxfVvBvh2nb3A"),
      cafe("Don Pasquale Restaurant & Bar", "Βρίσκεται μέσα στο Hotel Maalot, κυριολεκτικά δύο βήματα από το συντριβάνι και έχει εξαρετικές κριτικές.", "https://maps.app.goo.gl/fsSymwAngohrtDr6A"),
    ],
    emoji: null,
  },
  // #23 San Giovanni in Laterano — synthesized (church).
  {
    id: 23,
    name: "San Giovanni in Laterano",
    description: "Επιβλητικός καθεδρικός ναός της Ρώμης με πελώρια αγάλματα και την Ιερή Σκάλα, ένα από τα σημαντικότερα προσκυνήματα της Ρώμης, καθώς η παράδοση θεωρεί ότι την ανέβηκε ο Χριστός στην Ιερουσαλήμ.",
    hours: 1, cost: 0, coords: { lat: 41.8863, lng: 12.5092 },
    program: everyDay(at(9, 18)),
    cultural: 9, foodie: 0, adventurous: 1, relaxing: 4, priority: 6,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.basilicasangiovanni.va/it.html")],
    googleMapUrl: null,
    notes: [],
    tags: ["church", "history", "architecture"],
    best_time: null,
    restaurants: [
      food("Verso - Vinosteria", "Είναι μια εξαιρετική επιλογή αν βρίσκεστε κοντά στη San Giovanni in Laterano, καθώς απέχει μόλις 5-8 λεπτά με τα πόδια από τη Βασιλική. Πρόκειται για έναν συνδυασμό κάβας και εστιατορίου (vinosteria), που είναι πολύ δημοφιλής στους ντόπιους", "https://maps.app.goo.gl/WMWaviHwqLKX6kXF7"),
      cafe("Materia Cafe", "Για τους λάτρεις του ποιοτικού καφέ ανώτερης κατηγορίας. Ένας σύγχρονος χώρος με έμφαση στη λεπτομέρεια και την προέλευση των κόκκων.", "https://maps.app.goo.gl/Nqdy1FZuwz3LSKBa9"),
    ],
    emoji: null,
  },
  // #24 St. Peter's & the Vatican — borrows "St. Peter's Basilica".
  {
    id: 24,
    name: "Βατικανό",
    description: "Πλατεία και Βασιλική Αγίου Πέτρου, η μεγαλύτερη εκκλησία που έχετε δει ποτέ. Είναι η καρδιά του Βατικανού, ένας χώρος που εντυπωσιάζει με το τεράστιο μέγεθός του και τον εμβληματικό τρούλο του Μιχαήλ Αγγέλου.",
    hours: 2, cost: 0, coords: { lat: 41.9022, lng: 12.4532 },
    program: everyDay(at(7, 19)),
    cultural: 8, foodie: 0, adventurous: 3, relaxing: 3, priority: 9,
    prices: { ages: FREE(), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.basilicasanpietro.va/it/")],
    googleMapUrl: null,
    notes: [],
    tags: ["vatican", "church", "iconic", "history"],
    best_time: null,
    restaurants: [
      food("200 Gradi", "Αν ψάχνετε για κάτι γρήγορο και νόστιμο, αυτό το σημείο φημίζεται για τα δημιουργικά του σάντουιτς (panini).", "https://maps.app.goo.gl/QCXD87Gre2G9Sysx9"),
      cafe("Fábrica", "Εκτός από ποιοτικό καπουτσίνο και μεγάλη ποικιλία σε τσάι, μπορείτε να βρείτε σπιτικά γλυκά, τάρτες αλλά και ελαφριά πιάτα για ένα γρήγορο γεύμα", "https://maps.app.goo.gl/snohasbz89eBxv2Z7"),
    ],
    emoji: null,
  },
  // #25 Vatican Museums & Sistine Chapel — borrows "Vatican Museums & Sistine Chapel".
  {
    id: 25,
    name: "Μουσεία Βατικανού και Καπέλα Σιστίνα",
    description: "Αίθουσες γεμάτες θησαυρούς, αγάλματα και εντυπωσιακούς χάρτες και μέσα κρυμμένη θα δείτε την Καπέλα Σιστίνα, το πιο διάσημο παρεκκλήσι στον κόσμο. Οι τοιχογραφίες του Μιχαήλ Αγγέλου στην οροφή και στον τοίχο του ιερού αποτελούν αξεπέραστα αριστουργήματα",
    hours: 4, cost: 20, coords: { lat: 41.9064, lng: 12.4542 },
    program: weekdaysThenSun(at(9, 18), CLOSED),
    cultural: 10, foodie: 0, adventurous: 2, relaxing: 1, priority: 10,
    prices: { ages: ages([[0, 0], [7, 8], [19, 20]], 20), family: { "2_adults_2_children": 0 } },
    websites: [site("https://www.museivaticani.va/content/museivaticani/it.html")],
    googleMapUrl: null,
    notes: [],
    tags: ["museum", "art", "vatican", "sistine chapel", "iconic"],
    best_time: null,
    restaurants: [
      food("200 Gradi", "Αν ψάχνετε για κάτι γρήγορο και νόστιμο, αυτό το σημείο φημίζεται για τα δημιουργικά του σάντουιτς (panini).", "https://maps.app.goo.gl/QCXD87Gre2G9Sysx9"),
      cafe("Fábrica", "Εκτός από ποιοτικό καπουτσίνο και μεγάλη ποικιλία σε τσάι, μπορείτε να βρείτε σπιτικά γλυκά, τάρτες αλλά και ελαφριά πιάτα για ένα γρήγορο γεύμα", "https://maps.app.goo.gl/snohasbz89eBxv2Z7"),
    ],
    emoji: null,
  },
];

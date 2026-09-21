// -----------------------------------------------------------------------------
// Curated, accurate, fully-legal images for the Barcelona ACTIVITIES.
// -----------------------------------------------------------------------------
// This is DATA only — the machinery lives in scripts/gen-city-images.mjs.
// Run it with:  node scripts/gen-city-images.mjs --city=barcelona
//
// Each entry maps ONE activity to ONE hand-picked photo:
//   • source: "unsplash" + id   → the slug at the end of an unsplash.com/photos/<id>
//                                  URL. Unsplash License: free commercial use, no
//                                  attribution required (we still record it).
//   • source: "commons"  + file → the exact "File:<title>" on Wikimedia Commons,
//                                  PLUS a `query` fallback search if the title was
//                                  renamed. Commons REQUIRES attribution; author +
//                                  licence are fetched from the API automatically.
//
// `name` MUST match the activity key in the generated map exactly.
// -----------------------------------------------------------------------------
export const cityName = "Barcelona";

export const activities = [
  { folder: "1-sagrada-familia", name: "Sagrada Família",
    source: "commons", file: "Sagrada Familia at night 02.jpg",
    query: "Sagrada Familia Barcelona night illuminated full basilica" },
  { folder: "2-park-guell", name: "Park Güell",
    source: "commons", file: "Park Güell 5 - panoramio.jpg",
    query: "Park Güell Barcelona main terrace view from above" },
  { folder: "3-casa-batllo", name: "Casa Batlló",
    source: "commons", file: "Casa Batlló 01.jpg",
    query: "Casa Batlló Barcelona dragon roof from above" },
  { folder: "4-casa-mila-la-pedrera", name: "Casa Milà (La Pedrera)",
    source: "unsplash", id: "EUed6ZoHYfg" },
  { folder: "5-picasso-museum", name: "Picasso Museum",
    source: "commons", file: "WLM14ES - Museu Picasso, Ciutat Vella, Barcelona - MARIA ROSA FERRE (2).jpg",
    query: "Museu Picasso Barcelona palau facade" },
  { folder: "6-gaudi-experience", name: "Gaudí Experience",
    source: "commons", file: "Casa Vicens, Barcelona - panoramio.jpg",
    query: "Casa Vicens Barcelona Gaudí house exterior",
    note: "No free photo of the Gaudí Experience attraction (a 4-D cinema) itself exists; Casa Vicens — Gaudí's first house — is used as a representative, family-friendly Gaudí image. Swap if you obtain a licensed photo of the venue." },
  { folder: "7-montjuic-castle-castell-de-montjuic", name: "Montjuïc Castle (Castell de Montjuïc)",
    source: "commons", file: "Κάστρο Μονζουίκ 3231 - 3233.jpg",
    query: "Castell de Montjuïc Barcelona fortress castle moat" },
  { folder: "8-hospital-de-sant-pau", name: "Hospital de Sant Pau",
    source: "commons", file: "2014- Hospital Sant Pau, Barcelona, Spain ( Ank Kumar ) 02.jpg",
    query: "Hospital de Sant Pau Barcelona modernista pavilion Domènech i Montaner" },
  { folder: "9-camp-nou-barca-stadium-tour", name: "Camp Nou (Barça Stadium Tour)",
    source: "commons", file: "Camp Nou aerial (cropped).jpg",
    query: "Camp Nou Barcelona stadium aerial exterior" },
  { folder: "11-cosmocaixa", name: "CosmoCaixa",
    source: "commons", file: "CosmoCaixa building.jpg",
    query: "CosmoCaixa Barcelona science museum building daytime exterior" },
  { folder: "12-tibidabo-amusement-park", name: "Tibidabo Amusement Park",
    source: "unsplash", id: "bV_3QZtlhJo" },
  { folder: "13-portaventura-world", name: "PortAventura World",
    source: "commons", file: "Dragon Khan and Shambhala in 2012.JPG",
    query: "PortAventura Shambhala Dragon Khan roller coaster" },
  { folder: "14-parc-de-la-ciutadella", name: "Parc de la Ciutadella",
    source: "unsplash", id: "PdsutDCgemk" },
  { folder: "15-poblenou-beaches", name: "Poblenou Beaches",
    source: "unsplash", id: "0idz9EY2tMM" },
  { folder: "16-magic-fountain-font-magica", name: "Magic Fountain (Font Màgica)",
    source: "commons", file: "Barcelona 133.JPG",
    query: "Font Màgica Montjuïc Barcelona fountain night Palau Nacional" },
  { folder: "18-museu-blau-natural-history-museum", name: "Museu Blau (Natural History Museum)",
    source: "commons", file: "Barcelona Forum2004.JPG",
    query: "Museu Blau Forum building Barcelona Herzog de Meuron" },
];

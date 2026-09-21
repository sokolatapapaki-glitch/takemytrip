# Image sources — destination covers

Provenance record for `public/destinations/<city>/cover.jpg`. No attribution is
legally required for the Unsplash photos (Unsplash License: free for commercial
use, modification allowed, no credit needed) — this list exists so every cover's
origin can always be traced. Each photo: `https://unsplash.com/photos/<id>`;
served crops came from `images.unsplash.com/photo-<id>?w=1280&h=830&fit=crop`.

| City | Subject | Source | Photo id |
|---|---|---|---|
| amsterdam | Canal with boats | Unsplash | `1534351590666-13e3e96b5017` |
| barcelona | Aerial: Eixample grid + Sagrada Família | Unsplash | `1583422409516-2895a77efded` |
| berlin | Brandenburg Gate | Unsplash | `1560969184-10fe8719e047` |
| bucharest | CEC Palace from Stavropoleos St | Unsplash | `1584646098378-0874589d76b1` |
| budapest | Danube aerial, Liberty Statue, golden hour | Unsplash | `1551867633-194f125bddfa` |
| istanbul | Blue Mosque at sunset | Unsplash | `1541432901042-2d8bd64b4a9b` |
| krakow | Rynek Główny panorama | **Wikimedia Commons** (attribution needed if kept) | `Krakow Rynek Glowny panorama 2.jpg` |
| lisbon | Yellow tram 28 downtown | Unsplash | `1585208798174-6cedd86e019a` |
| london | Big Ben at dusk | Unsplash | `1529655683826-aba9b3e77383` |
| madrid | Gran Vía rooftops, Metropolis building | Unsplash | `1570698473651-b2de99bae12f` |
| paris | Eiffel Tower over the Seine at sunset | Unsplash | `1502602898657-3e91760cbb34` |
| prague | Old-town spires (St Nicholas, Týn) | Unsplash | `1541849546-216549ae216d` |
| rome | Colosseum at dusk | Unsplash | `1552832230-c0197dd311b5` |
| vienna | St Stephen's Cathedral skyline at dusk | Unsplash | `1516550893923-42d28e5677af` |
| warsaw | Palace of Culture and Science at night | Unsplash | `1519197924294-4ba991a11128` |

> Activity photos under `public/destinations/<city>/<id>-<slug>/` still come from
> Wikimedia Commons (see `scripts/gen-activity-images.mjs`) and would need a
> credits page, or a re-run against the Unsplash/Pexels API, to be fully
> attribution-clean.
>
> **Barcelona is the exception** — its activity images were re-curated one-by-one
> (`scripts/gen-barcelona-images.mjs`): Unsplash where an accurate photo exists,
> hand-picked Wikimedia Commons (with required attribution) elsewhere. Provenance
> and credits: `doc/barcelona-activity-image-sources.md` and
> `public/destinations/barcelona/_credits.json`.

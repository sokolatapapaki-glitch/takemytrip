# Image sources — Barcelona activities

Curated, accurate, fully-legal replacements for Barcelona's activity photos. The
previous activity images were auto-fetched from Wikimedia Commons and several
were inaccurate; these were picked one-by-one for the actual place.

> This file is the **curation plan**. Running
> `node scripts/gen-barcelona-images.mjs` (in an environment with network access)
> downloads the images and **overwrites this file** with the exact Wikimedia
> author + licence pulled from the Commons API, and writes the same data to
> `public/destinations/barcelona/_credits.json` for in-app display.

## Unsplash (9) — no attribution legally required

Unsplash License: free for commercial use, modification allowed, no credit
needed. Recorded only so each image's origin can be traced. Photo page:
`https://unsplash.com/photos/<id>`.

| Activity | Subject | Unsplash photo id |
|---|---|---|
| Sagrada Família | The basilica, Barcelona | `KBELvmd67Fk` |
| Park Güell | Gaudí mosaic terrace bench | `1RD1h0Cnkng` |
| Casa Batlló | Ornate Gaudí facade | `YXjTwszVYcw` |
| Casa Milà (La Pedrera) | Gaudí stone facade with balconies | `EUed6ZoHYfg` |
| Camp Nou (Barça Stadium Tour) | FC Barcelona stadium at night | `b84nM5W-AF0` |
| Tibidabo Amusement Park | Hilltop ferris wheel | `bV_3QZtlhJo` |
| Parc de la Ciutadella | Fountain in a tree-lined park | `PdsutDCgemk` |
| Poblenou Beaches | Barcelona beach with city behind | `0idz9EY2tMM` |
| Magic Fountain (Font Màgica) | Fountain below the MNAC, Montjuïc | `qMYUraYNqks` |

## Wikimedia Commons (7) — attribution REQUIRED

Used where Unsplash has no accurate photo of the actual place. Each is free under
its Commons licence **provided the author is credited** — the script fills in the
exact author + licence below after download.

| Activity | Preferred Commons file | Author / Licence |
|---|---|---|
| Picasso Museum | `File:Museu Picasso Barcelona.JPG` | _filled in on run_ |
| Gaudí Experience | (search: *Antoni Gaudí Barcelona*) — representative image; no free photo of the venue itself exists | _filled in on run_ |
| Montjuïc Castle (Castell de Montjuïc) | `File:Montjuïc Castell.JPG` | _filled in on run_ |
| Hospital de Sant Pau | `File:Hospital de Sant Pau (new building at the north).JPG` | _filled in on run_ |
| CosmoCaixa | `File:CosmoCaixa Barcelona.JPG` | _filled in on run_ |
| PortAventura World | `File:Dragon Khan and Shambhala in 2012.JPG` | _filled in on run_ |
| Museu Blau (Natural History Museum) | `File:Barcelona Forum2004.JPG` | _filled in on run_ |

## How to apply

```bash
cd my-nextjs-app
node scripts/gen-barcelona-images.mjs
```

This deletes the old Barcelona activity image folders, downloads one accurate
image per activity, updates `app/activities/components/activityImages.generated.ts`
and `public/destinations/_manifest.json`, and writes the credits files.

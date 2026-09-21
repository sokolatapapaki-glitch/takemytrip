# Issues που χρειάζονται API / βιβλιοθήκη — Ανάλυση & οδηγός υλοποίησης

> **Σκοπός:** εστιασμένη ανάλυση **μόνο** για τα issues που απαιτούν **εξωτερικό API ή νέα βιβλιοθήκη**.
> Για κάθε ένα: (α) η **ελληνική περιγραφή**, (β) **πώς υλοποιείται ήδη στο `takemytrip`** (root folder app) με ακριβείς γραμμές,
> (γ) ποιο API είναι το **πιο φθηνό/δωρεάν** και ποιο το **καλύτερο/πιο διαδεδομένο**, (δ) **πώς να το υλοποιήσει το Claude Code** στο `my-nextjs-app`.
> **ΔΕΝ υλοποιείται τίποτα τώρα** — οδηγίες για αργότερα. Συμπληρωματικό του `ISSUES_TO_IMPLEMENT.md`.

## Ποια issues μπαίνουν εδώ

| # | Λειτουργία | Χρειάζεται API; | Υπάρχει στο takemytrip; |
|---|---|---|---|
| **#8** | Τρόποι & χρόνοι μετακίνησης μεταξύ σημείων | **Ναι** για πραγματικούς χρόνους ΜΜΜ (δωρεάν εκτίμηση = όχι) | ✅ Ναι (δωρεάν εκτίμηση + Google Maps links) |
| **#3** | Προσωπικό σημείο εκκίνησης (ξενοδοχείο) | **Προαιρετικά** (geocoding διεύθυνσης· click-στον-χάρτη = όχι) | ✅ Ναι (Nominatim geocoding) |
| #1 | (Σημείωση) Παγκόσμια αναζήτηση πόλης | Μόνο αν θες autocomplete όλου του κόσμου | ❌ Όχι (σταθερή λίστα πόλεων) |

> **Σημαντικό για κόστος:** το `takemytrip` υλοποιεί **και τα δύο (#8, #3) εντελώς ΔΩΡΕΑΝ**, χωρίς API key.
> Το πληρωμένο Google χρειάζεται **μόνο** αν θες αληθινούς χρόνους **Δημόσιων Μεταφορών (ΜΜΜ)** μέσα στην εφαρμογή.

---

# #8 — Τρόποι & χρόνοι μετακίνησης μεταξύ σημείων

**Ελληνική περιγραφή (όπως δόθηκε):**
> «στον χάρτη δεν βλέπει πια τους τρόπους μετακίνησης από το ένα σημείο στο αλλο. αν δεις στην εφαρμογή μου έβγαζε μια καρτέλα κι ελεγε ολους τους δυνατους τρόπους καθώς και τον χρονο, και με τα πόδια αν ηθελες να πας»

## Πώς υλοποιείται στο `takemytrip` (root: `../takemytrip/script.js`)

**Δεν χρησιμοποιεί πληρωμένο API.** Συνδυάζει: Haversine απόσταση → εκτίμηση χρόνου ανά τρόπο → καρτέλα + deep-links στο Google Maps.

1. **Απόσταση (Haversine)** — `calculateDistance(point1, point2)`, `script.js:4829-4843`:
   ```js
   function calculateDistance(point1, point2) {
     const R = 6371; // km
     const lat1 = point1[0]*Math.PI/180, lat2 = point2[0]*Math.PI/180;
     const dLat = (point2[0]-point1[0])*Math.PI/180;
     const dLon = (point2[1]-point1[1])*Math.PI/180;
     const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
     return R * (2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); // km
   }
   ```
2. **Εκτίμηση χρόνου ανά τρόπο** — `script.js:5641-5648` (λεπτά = km × συντελεστή):
   ```js
   const distance = calculateDistance(a, b).toFixed(1);
   const walkTime = Math.round(distance * 15);  // ~4 km/h  (περπάτημα)
   const carTime  = Math.round(distance * 3);   // ~20 km/h (αυτοκίνητο)
   // ΜΜΜ:   Math.round(distance * 5)   (~12 km/h)
   // Ποδήλατο: Math.round(distance * 8) (~7.5 km/h)
   ```
3. **Καρτέλα (popup) στον χάρτη** — `script.js:5695-5763`: grid με 🚶/🚗/🚇/🚲 + λεπτά, και **κουμπιά Google Maps** (deep-links, ΔΩΡΕΑΝ, χωρίς key):
   ```
   https://www.google.com/maps/dir/?api=1&origin=LAT,LNG&destination=LAT,LNG&travelmode=walking|driving|transit|bicycling
   ```
   Χάρτης = **Leaflet** (CDN, free), `index.html:205`.

**Συμπέρασμα:** το takemytrip δίνει εκτιμώμενους χρόνους (όχι πραγματικό δίκτυο) και «πραγματικές οδηγίες» τις αφήνει στο Google Maps που ανοίγει σε νέα καρτέλα.

## Επιλογές API (αν θες ΠΡΑΓΜΑΤΙΚΟΥΣ χρόνους εντός app)

### Δωρεάν / πιο φθηνά
| API | Κόστος / όρια | Τι καλύπτει | Σημειώσεις |
|---|---|---|---|
| **OSRM** (open-source) | Δωρεάν (demo server) / self-host | Περπάτημα, αυτοκίνητο, ποδήλατο | **Όχι ΜΜΜ**. Demo server όχι για production· ιδανικά self-host (Docker). Χωρίς key. |
| **OpenRouteService** | Δωρεάν ~2.000 req/μέρα (key) | Περπάτημα, αυτοκίνητο, ποδήλατο, αναπηρικό | **Όχι ΜΜΜ**. Απλό REST, free key. Καλή πρώτη επιλογή για μη-ΜΜΜ. |
| **Mapbox Directions** | Δωρεάν ~100.000 req/μήνα (key) | Αυτοκίνητο, περπάτημα, ποδήλατο (+traffic) | ΜΜΜ περιορισμένα. Γενναιόδωρο free tier. |
| **Google Maps deep-links** | Δωρεάν (απλά URLs) | Όλα (ανοίγει το Google Maps app) | Ό,τι κάνει ήδη το takemytrip. Μηδέν key, μηδέν κόστος, αλλά φεύγει εκτός app. |

### Καλύτερο / πιο διαδεδομένο
| API | Κόστος | Γιατί |
|---|---|---|
| **Google Directions / Routes API** | **Πληρωμένο**: ~$5 / 1.000 κλήσεις (Routes Basic), περισσότερα για advanced· χρειάζεται **billing account + API key**. (Το μηνιαίο δωρεάν credit άλλαξε το 2025 — **επιβεβαίωσε τρέχουσα τιμολόγηση**.) | Το **μόνο** που δίνει αξιόπιστα **Δημόσιες Μεταφορές (ΜΜΜ/λεωφορεία/μετρό)** με ωράρια, μαζί με walking/driving/bicycling. Πιο διαδεδομένο/ακριβές. |

**Σύσταση:** Αν αρκούν περπάτημα/αυτοκίνητο/ποδήλατο με αληθινούς χρόνους → **OpenRouteService** (δωρεάν). Αν θες **ΜΜΜ** → πρακτικά χρειάζεσαι **Google** (πληρωμένο). Φθηνότερη/μηδενική λύση = η προσέγγιση takemytrip (εκτίμηση + Google Maps links).

## Πώς να το υλοποιήσει το Claude Code στο `my-nextjs-app`

**Σχετικά αρχεία:** `app/components/ActivityCombinations/DayMap.tsx` (πραγματικός χάρτης Leaflet, τώρα μόνο `Polyline`)· `app/components/ActivityCombinations/core/activities.functions.ts` (υπάρχει ήδη `distanceKm`).

1. **MVP δωρεάν (καμία εξάρτηση/κόστος — αντιγραφή takemytrip):**
   - Δημιούργησε `app/components/ActivityCombinations/core/travel.functions.ts` με `estimateTravel(a, b)` που χρησιμοποιεί το υπάρχον `distanceKm` και τους ίδιους συντελεστές (×15 / ×3 / ×5 / ×8).
   - Στο `DayMap.tsx`, κάνε τα legs/markers clickable (`react-leaflet` έχει `eventHandlers={{ click }}` στα `Marker`/`Polyline`, ή `useMapEvents`). Σε click leg, δείξε καρτέλα (`Popup` ή custom panel) με 🚶/🚗/🚇/🚲 + λεπτά + κουμπιά Google Maps deep-link (ίδια URLs).
2. **Πραγματικοί χρόνοι (όταν αποφασιστεί API):**
   - Βάλε το key σε **env var** (`.env.local`, π.χ. `ROUTING_API_KEY`) — **ποτέ** στον client.
   - Φτιάξε **server route handler** `app/api/route/route.ts` (App Router) που καλεί το routing API (Google/ORS/Mapbox) και επιστρέφει `{mode, minutes}[]`. Έτσι κρύβεται το key.
   - Στο `DayMap`, fetch αυτό το endpoint, με **cache** ανά ζεύγος σημείων (π.χ. `Map` ή SWR) και **fallback** στο MVP εκτίμησης σε αποτυχία/όριο.
   - Πρόσεξε: το `DayMap.tsx` φορτώνεται μόνο client-side (Leaflet αγγίζει `window`). Το routing fetch μπορεί να μένει client→`/api/route`.
3. **Νέες εξαρτήσεις:** για το δωρεάν MVP **καμία** (μόνο `fetch`). Για Google προαιρετικά `@googlemaps/js-api-loader` (δεν είναι υποχρεωτικό — δουλεύει και με σκέτο REST).

---

# #3 — Προσωπικό σημείο εκκίνησης (π.χ. ξενοδοχείο)

**Ελληνική περιγραφή (όπως δόθηκε):**
> «Το σημείο εκκίνησης μπορεί να είναι κάτι άλλο... αν έβαζε το ξενοδοχείο του? υπάρχει αυτή η επιλογή? να βαλει προσωπικό σημείο.»

## Πώς υλοποιείται στο `takemytrip` (root: `../takemytrip/script.js`)

**Δωρεάν geocoding με Nominatim (OpenStreetMap), χωρίς API key.**

1. **Geocoding** — `geocodeLocation(query)`, `script.js:3992-4020`:
   ```js
   // Nominatim (OpenStreetMap) — δωρεάν, χωρίς key
   const searchQuery = state.selectedDestination ? `${query}, ${state.selectedDestination}` : query;
   const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
   const response = await fetch(url, { headers: { 'User-Agent': 'TakeMyTrip Travel Planner' } });
   const data = await response.json();
   // → { lat, lng, displayName }
   ```
   Σημ.: προσθέτει το όνομα πόλης στο query για καλύτερα αποτελέσματα· στέλνει `User-Agent` (απαίτηση Nominatim policy).
2. **Αποθήκευση custom σημείου** — `addCustomPoint()`, `script.js:3930-3990`: το βάζει σε `state.customPoints` (`{id, name, location, type:'custom'}`), persist σε **localStorage** (`saveCustomPoints()`), και προσθέτει marker στον χάρτη (`addCustomPointToMap`).

## Επιλογές API

### Δωρεάν / πιο φθηνά
| API | Κόστος / όρια | Σημειώσεις |
|---|---|---|
| **Nominatim (OSM)** | Δωρεάν, χωρίς key | **1 req/sec**, απαιτεί `User-Agent`, **όχι** heavy autocomplete. Ό,τι χρησιμοποιεί το takemytrip. |
| **Photon (komoot)** | Δωρεάν, χωρίς key | Καλύτερο για **autocomplete** καθώς πληκτρολογείς (type-ahead). |
| **Click στον χάρτη** | Δωρεάν, **κανένα API** | `react-leaflet` `useMapEvents('click')` → `{lat,lng}`. Μηδέν εξωτερική κλήση. |

### Καλύτερο / πιο διαδεδομένο
| API | Κόστος | Γιατί |
|---|---|---|
| **Google Geocoding / Places Autocomplete** | **Πληρωμένο**: Geocoding ~$5/1.000· Places Autocomplete ~$2.83–17/1.000· χρειάζεται billing+key | Καλύτερη ποιότητα + ομαλό autocomplete διευθύνσεων/POI (π.χ. ξενοδοχεία). |

**Σύσταση:** Για ξενοδοχείο ως αφετηρία, η **δωρεάν Nominatim** (όπως takemytrip) ή **click-στον-χάρτη** φτάνουν. Google μόνο αν θες πολυτελές autocomplete.

## Πώς να το υλοποιήσει το Claude Code στο `my-nextjs-app`

**Σχετικά αρχεία:** `app/components/ActivityCombinations/index.tsx` (`area` = route anchor)· `DayMap.tsx`/`ComboMap.tsx` (σχεδιάζουν το `start`).

1. Πρόσθεσε επιλογή «**Δικό μου σημείο**» δίπλα στις areas. Δύο μέθοδοι (καμία πληρωμένη):
   - **(α) Click στον χάρτη:** στο `DayMap.tsx` με `useMapEvents({ click(e){ setCustom(e.latlng) } })` → `{lat,lng}`. Καθόλου API.
   - **(β) Πληκτρολόγηση διεύθυνσης → Nominatim:** φτιάξε **server route** `app/api/geocode/route.ts` που κάνει το fetch στο Nominatim (στον server μπορείς να βάλεις σωστό `User-Agent`· ο browser **δεν** επιτρέπει χειροκίνητο `User-Agent`). Πρόσθεσε **debounce** (≥1s) λόγω του ορίου 1 req/sec.
2. Κράτα το custom σημείο ως `Area`-συμβατό αντικείμενο: `{ id:"custom", name:"Το ξενοδοχείο μου", coords:{lat,lng} }`, ώστε να περάσει αυτούσιο ως `start` στα `ComboMap`/`DayMap`.
3. Persist (προαιρετικά) στο `app/components/ActivityCombinations/core/trips.storage.ts` για να αποθηκεύεται με το ταξίδι (όπως το `localStorage` του takemytrip).
4. **Νέες εξαρτήσεις:** **καμία** (το `react-leaflet` υπάρχει ήδη· geocoding = σκέτο `fetch`).

**❓ Απόφαση χρήστη πριν την υλοποίηση:** μέθοδος (α) click-στον-χάρτη ή (β) πληκτρολόγηση διεύθυνσης (Nominatim);

---

# #1 — (Σημείωση) Παγκόσμια αναζήτηση πόλης

**Ελληνική περιγραφή (όπως δόθηκε):**
> «στην αρχη οταν γραφω τον προορισμό, μου έρχονται μερικά στα αγγλικά (πχ barcelona)»

**Δεν χρειάζεται API** στην εκδοχή που συμφωνήθηκε (ελληνικά labels στη σταθερή λίστα — βλ. `ISSUES_TO_IMPLEMENT.md` #1).
Χρειάζεται API **μόνο** αν αργότερα θες ο χρήστης να γράφει **οποιαδήποτε πόλη στον κόσμο** με autocomplete:
- **Δωρεάν:** Photon/Nominatim (type-ahead, όρια ρυθμού).
- **Καλύτερο/διαδεδομένο:** Google Places Autocomplete (πληρωμένο).
- ⚠️ Το `takemytrip` **δεν** το κάνει — δουλεύει με σταθερή λίστα πόλεων που έχουν τοπικά δεδομένα δραστηριοτήτων. Μια «παγκόσμια» πόλη δεν θα έχει δραστηριότητες/κόστη.

---

## Σύνοψη κόστους

| # | Δωρεάν λύση (συνιστώμενη) | Πληρωμένη λύση (μόνο αν χρειαστεί) |
|---|---|---|
| **#8** | Haversine εκτίμηση + Google Maps deep-links (όπως takemytrip) ή OpenRouteService (μη-ΜΜΜ) | Google Directions/Routes API (~$5/1.000) — μόνο για αληθινά **ΜΜΜ** |
| **#3** | Nominatim (δωρεάν, χωρίς key) ή click-στον-χάρτη | Google Geocoding/Places (~$5/1.000) — μόνο για premium autocomplete |
| #1 | Ελληνικά labels (καμία κλήση) | Google Places Autocomplete — μόνο για παγκόσμια αναζήτηση |

**Bottom line:** όλα γίνονται **δωρεάν**, ακριβώς όπως ήδη δουλεύουν στο `takemytrip`. Πληρωμένο API χρειάζεσαι **μόνο** για πραγματικούς χρόνους Δημόσιων Μεταφορών (#8).

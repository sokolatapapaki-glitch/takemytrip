# Graph Report - my-nextjs-app  (2026-06-20)

## Corpus Check
- 166 files · ~8,465,461 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1010 nodes · 2248 edges · 52 communities (42 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7df34313`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]

## God Nodes (most connected - your core abstractions)
1. `Activity` - 36 edges
2. `dayHours` - 21 edges
3. `buttonStyles` - 21 edges
4. `isClosedDay()` - 20 edges
5. `Filter` - 18 edges
6. `compilerOptions` - 16 edges
7. `CatalogueActivity` - 15 edges
8. `Selection` - 14 edges
9. `scheduleEndHour()` - 14 edges
10. `at()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `slotFor()` --calls--> `dayHours`  [EXTRACTED]
  app/my-trips/components/MyTripsExperience.tsx → app/components/ActivityCombinations/core/activities.functions.ts
- `ActivitiesExperience()` --calls--> `useApp()`  [EXTRACTED]
  app/activities/components/ActivitiesExperience.tsx → app/context/AppContext.tsx
- `ActivityCard()` --calls--> `starsOf()`  [EXTRACTED]
  app/activities/components/ActivityCard.tsx → app/map/components/mapData.ts
- `MakeTripModal()` --calls--> `useApp()`  [EXTRACTED]
  app/activities/components/MakeTripModal.tsx → app/context/AppContext.tsx
- `ActivityResultCard()` --calls--> `activityImages()`  [EXTRACTED]
  app/map/components/ActivityResultCard.tsx → app/activities/components/activityImages.ts

## Import Cycles
- None detected.

## Communities (52 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (56): CurveGraph(), pathFor(), TICKS, xOf(), yOf(), pathFor(), ScoreCurves(), TICKS (+48 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (16): slotFor(), StripMode, addActivityToTrip(), deleteSavedTrip(), EMPTY, getSavedTripsSnapshot(), getServerSavedTrips(), listeners (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (19): metadata, ATHENS, CITY_DESCRIPTIONS, CITY_IMAGES, CITY_SORT_LABELS, cityDescription(), cityImage(), cityPriceTier() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.23
Nodes (22): AMSTERDAM_ACTIVITIES, BARCELONA_ACTIVITIES, BERLIN_ACTIVITIES, BUCHAREST_ACTIVITIES, BUDAPEST_ACTIVITIES, ALL_DAY, at(), cafe() (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (66): ComboMap(), Stop, n2(), TripDashboard(), tripFormula(), TripIndexBlock(), UseAllBlock(), fitsSlot() (+58 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (32): dependencies, leaflet, next, react, react-dom, react-icons, react-leaflet, devDependencies (+24 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (28): args, buildDestinationCovers(), CITIES_DATA, cityTerm(), commonsSearch(), DEST_GEN_TS, download(), downloadBuf() (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (15): ACTIVITIES, PLANNERS, Trip, allWeek(), approx(), CLOSED_DAY, makeActivity(), makeRng() (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (26): AdvancedFiltersModal(), dateLabel(), Calendar(), MONTHS, WEEKDAY_LABELS, CheckRow(), dateLabel(), FilterSidebar() (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (50): ComboDashboard(), FilterBlock(), formulaText(), n(), ACTIVITY_BY_NAME, AddWindow, ComboResults(), COORDS_BY_NAME (+42 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (29): VIBES, maxComboValue(), maxPartyPrice(), CEILING_PARAMS, COST_TIERS, COST_UNIT, costOptionsForParty(), DEFAULT_FILTERS (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (21): getActiveParty(), setActiveParty(), defaultParamsFor(), isExactWithinBudget(), ActivityCore, arbActivityCore, arbAnyInput, arbDays (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (24): ActivityResultCard(), CityLabel(), ClickedActivityPanel(), HoveredActivityCard(), SearchIcon(), ActivityFilters, ALL_CITIES, CITY_OF (+16 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (15): metadata, ACT_SORT_LABELS, ActivityListFilters, ActSortKey, DEFAULT_ACT_FILTERS, filterAndSortActivities(), getCityById(), priceMaxFor() (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (43): NominatimResult, StartPoint, StartPointSearch(), Suggestion, CalendarModal(), PRESETS, DestinationModal(), CalendarIcon() (+35 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (19): 1. Full-Width Mobile Layout, 2. Remove Homepage Background Wrapper on Mobile, 3. Transparent Desktop Navbar at Top of Page, Acceptance Criteria, Acceptance Criteria, Acceptance Criteria, Do Not Change, Ensure (+11 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (18): #10 — Κόστος ανά μέλος + πακέτα με έκπτωση (magic combos) + city pass, 12 Issues προς υλοποίηση — Οδηγίες για Claude Code, #12 — Εστιατόρια/καφέ κρύβονται στο modal, #1 — Ονόματα προορισμών εμφανίζονται στα αγγλικά, #2 — Διάρκεια (πλήθος ημερών) + προαιρετικές ημερομηνίες, #3 — Προσωπικό σημείο εκκίνησης (π.χ. ξενοδοχείο), #4 — Κρύψε τελείως το «vibe» από όλες τις σελίδες, #5 — Κρύψε το φίλτρο «Τουριστική προτεραιότητα / Must-see» (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (16): #1 — (Σημείωση) Παγκόσμια αναζήτηση πόλης, #3 — Προσωπικό σημείο εκκίνησης (π.χ. ξενοδοχείο), #8 — Τρόποι & χρόνοι μετακίνησης μεταξύ σημείων, Issues που χρειάζονται API / βιβλιοθήκη — Ανάλυση & οδηγός υλοποίησης, Δωρεάν / πιο φθηνά, Δωρεάν / πιο φθηνά, Επιλογές API, Επιλογές API (αν θες ΠΡΑΓΜΑΤΙΚΟΥΣ χρόνους εντός app) (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, incremental, isolatedModules, lib, module, moduleResolution, noEmit (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (9): ActivityList(), DayItinerary(), MapExperience(), MyTripsExperience(), AppContext, AppContextValue, ModalSize, Theme (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.31
Nodes (9): defaultSelection(), scheduleEndHour(), planTrip(), planWith(), runPlan(), planBig(), planOneDay(), SAME (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (14): 10. Mouse-reactive background colours, 1. Vertically centre the three inputs, 2. Stop the layout shift on load, 3. Border around the search bar wrapper, 4. Disable Search until all three inputs are filled, 5. Single-day date label, 6. Destination icon "jump" animation on select, 7. Simplify the city-centre label (+6 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (4): metadata, Window, BG_IMAGE_URLS, metadata

### Community 27 - "Community 27"
Cohesion: 0.28
Nodes (6): ACTIVITY_IMAGES, ACTIVITY_IMAGES_MANUAL, COVER_BY_NAME, GENERATED_ACTIVITY_IMAGES, DESTINATION_IMAGES, CITIES

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (6): EMPTY_ACTIVITY_META, ALL_DAY, BIG_ACTIVITIES, CLOSED, assertValid(), placedNames()

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (12): Activities page, Filter Sidebar, Footer, Homepage, Its upt to you, make the FilterDropdown with better style., Map, map markers (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.21
Nodes (10): CURATED, DEFAULT, __dirname, emitActivity(), JSON_DIR, normCat(), numMap(), OUT_DIR (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (11): Activity Images (Rome) Implementation Plan, Image-sourcing procedure (P1–P5), Self-Review, Task 1: Create the activity-images map + helper, Task 2: Render the first image on the activity card, Task 3: Drive the detail-modal gallery off the real images, Task 4: Populate Rome images — batch A (activities #1–7), Task 5: Populate Rome images — batch B (activities #8–14) (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (10): 1. Date Range Input (Mobile UX Improvement), 2. Full-Screen Date Picker Modal (Mobile), 3. Navbar Title (Mobile), 4. Navigation Menu (Mobile – Three Bars Menu), 5. Theme Toggle Button Removal & Replacement, 6. Summary of Mobile-Focused Changes, Changes:, Mobile UI Improvements & Navigation Updates (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.18
Nodes (10): 1. Date Range Input (Mobile UX Improvement), 2. Full-Screen Date Picker Modal (Mobile), 3. Navbar Title (Mobile), 4. Navigation Menu (Mobile – Three Bars Menu), 5. Theme Toggle Button Removal & Replacement, 6. Summary of Mobile-Focused Changes, Changes:, Mobile UI Improvements & Navigation Updates (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (9): 1. Map Markers Styling (Map Page), 2. Top Buttons Hover State (Map Page), 3. “My Trips” Page – Trip Components Layout, Activities Section Behavior, Consistency with Plan Page, Hover Effect, Layout Structure, Map Page & My Trips UI Improvements (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.20
Nodes (9): 1. Map Markers Styling (Map Page), 2. Top Buttons Hover State (Map Page), 3. “My Trips” Page – Trip Components Layout, Activities Section Behavior, Consistency with Plan Page, Hover Effect, Layout Structure, Map Page & My Trips UI Improvements (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.05
Nodes (35): GENERATED_ACTIVITIES_BY_DESTINATION, SLOTS, ACTIVITIES_BY_DESTINATION, CITY_MAGIC_COMBOS, CITY_PASSES, MagicCombo, CityPass, DestArea (+27 more)

### Community 43 - "Community 43"
Cohesion: 0.38
Nodes (6): activityIcon(), CITY_PIN_SVG, cityIcon(), escapeHtml(), vibeSvg(), vibeSvgCache

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (6): 1. Remove "Take the Kids" Component from Map Page, 2. Navbar Button Positioning (Map & Cities), 3. Input Interaction Scroll Behavior (Home Page), 4. Navbar Sticky Behavior, 5. City Card Layout Adjustment (See Activities Button), Project Tasks

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (6): Activity Modal — Restaurants / Notes / Related Activities Polish — Implementation Plan, Self-Review, Task 1: Restaurant cards — remove border, add shadow + hover lift, Task 2: Notes bars — happier yellow palette + hover lift, Task 3: Related Activities heading — rename + enlarge, Task 4: Related Activities strip — top padding so hovered cards aren't clipped

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (11): ActivityDetail(), fmtPrice(), ActivityCard(), activityImages(), bestVibe(), VIBE_GRADIENT, VIBE_ICONS, adultPrice() (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.40
Nodes (3): MapClient(), MapExperience, metadata

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (4): byHash, examples, MANIFEST, PUBLIC

### Community 51 - "Community 51"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 60 - "Community 60"
Cohesion: 0.14
Nodes (8): geistMono, geistSans, metadata, ConditionalFooter(), FOOTER_NAV, NAV_ITEMS, TakeTheKids(), AppProvider()

## Knowledge Gaps
- **338 isolated node(s):** `OpenMenu`, `Section`, `ACTIVITY_IMAGES_MANUAL`, `ACTIVITY_IMAGES`, `COVER_BY_NAME` (+333 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Activity` connect `Community 13` to `Community 1`, `Community 4`, `Community 40`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 8`, `Community 14`, `Community 46`, `Community 23`, `Community 24`, `Community 27`, `Community 28`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `buttonStyles` connect `Community 2` to `Community 1`, `Community 9`, `Community 10`, `Community 13`, `Community 14`, `Community 46`, `Community 23`, `Community 60`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `DESTINATIONS` connect `Community 40` to `Community 15`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `OpenMenu`, `Section`, `ACTIVITY_IMAGES_MANUAL` to the rest of the system?**
  _338 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06293706293706294 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1476923076923077 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.05719298245614035 - nodes in this community are weakly interconnected._
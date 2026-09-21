# Homepage (trip-search hero) — styling & interaction changes

## Context for the agent

The homepage is the trip-search hero. Relevant files:

- `app/page.tsx` — renders `<TripSearchHero />`.
- `app/start/components/TripSearchHero.tsx` — the page shell: gradient background plus two soft colour blobs that drift via `animate-drift-slow` / `animate-drift-slower`.
- `app/start/components/StartTripSearch.tsx` — **the search bar you'll edit most.** It holds the three fields and the Search button:
  - `DestField` (destination) — has a typewriter placeholder that becomes a writable `<input>`. Uses `MapPinIcon`. Selected value comes from `destLabel`.
  - `Field` (dates) — uses `CalendarIcon`, value from `dateLabel`.
  - `Field` (travelers) — uses `UsersIcon`, value from `travelersLabel`.
  - The three fields are each `flex-1` inside a `flex items-stretch gap-2` wrapper. The Search button calls `handleSearch()`.
- `app/start/components/icons.tsx` — inline SVG icons. **Note: `UsersIcon` is already a two-person icon, and there is NO single-person icon yet — you'll need to add one.**
- `app/start/components/TravelersModal.tsx` — adults/children steppers. Defaults: `adults: 2, children: 0`. Adults min is 1.
- `app/start/components/CalendarModal.tsx` — single-month range calendar.
- `app/start/data/destinations.data.ts` (re-exported via `app/components/ActivityCombinations/core/destinations.data.ts`) — each destination's `areas[0]` is the default sub-area. **For cities `areas[0]` is named `"Centre"` (this is the "city centre"); for regions `areas[0]` is the main city.**
- Animations live in `app/globals.css` (`@keyframes` + `prefers-reduced-motion` handling) — add new keyframes here and respect reduced-motion.

**Important:** there is currently **no image/photo data on activities or cities** anywhere in the repo. The background-photo request (#9) needs new image assets/URLs — confirm with me where those should come from before implementing.

---

## Requested changes

### 1. Vertically centre the three inputs
The fields/button row should be vertically centred, not top-aligned. (The wrapper currently uses `items-stretch`; switch to centred alignment so the three inputs and button line up on their vertical centre.)

### 2. Stop the layout shift on load
On page load, when the destination field's typewriter placeholder finishes typing, the other two inputs get pushed slightly left. **The destination field's width must stay fixed** — it should not change width between the typewriter placeholder state, the writable-input state, and the selected-label state. Give the destination field a stable width (e.g. fixed flex-basis) so nothing reflows when the text changes.

### 3. Border around the search bar wrapper
Add a small/subtle border to the wrapper that contains the three inputs **and** the Search button (the glass `rounded-2xl` container in `StartTripSearch`).

### 4. Disable Search until all three inputs are filled
The Search button must be disabled (not clickable) until **all three** are filled: a destination is selected, a date is chosen, and travelers are set. Travelers defaults to 2 adults, so treat the date + destination as the gating inputs (and keep travelers as a required selection too). Give the disabled button a clear disabled style.

### 5. Single-day date label
In the dates field, when the user picks only **one** day in the calendar (start with no end, or start == end), show just the single date (e.g. `Jun 7`) — **not** `Jun 7 — …` or `Jun 7 — Jun 7`. The current `dateLabel` logic in `StartTripSearch.tsx` always renders a range; update it to render a single date when only one day is selected.

### 6. Destination icon "jump" animation on select
When the user picks a place, play a small jump/bounce animation on the destination field's `MapPinIcon`. Add a keyframe in `globals.css` and trigger it when a destination is selected.

### 7. Simplify the city-centre label
When the selected sub-area is the city **centre** (`areas[0]` of a city, named `"Centre"`), the destination label should show **only the city name** (e.g. `Rome`, not `Rome · Centre`). For any other area keep the `City · Area` form. Update `destLabel` in `StartTripSearch.tsx`.

### 8. Travelers icon: one ↔ two people with animation
- When travelers is exactly **one person**, show a **single-person** icon (you need to create this icon in `icons.tsx`).
- When it increases to **more than one** person, animate the icon transitioning into the **two-person** `UsersIcon`.
- When going from many back to one, play the **reverse** animation.

### 9. Background activity photos for the chosen city
Behind the hero, show faded, slowly-moving background photographs of the **activities of the chosen city**:
- When a city is selected, show photos of that city's activities.
- When no city is selected, show photos of the main activities across **all** cities — **no more than 5 photos**.
- Photos should be faded and drift slowly.
- ⚠️ No image data exists yet — confirm the image source/assets with me first (see Context note).

### 10. Mouse-reactive background colours
The homepage's background colour blobs should follow the mouse **while the mouse is held down (clicked)**. By default (no click) they keep drifting slowly as they do now (`animate-drift-slow` / `animate-drift-slower`).

---

## Constraints
- This is a heavily customised Next.js — read the relevant guide in `node_modules/next/dist/docs/` before writing code (see `AGENTS.md`).
- Respect `prefers-reduced-motion` for every new animation.
- Ask me about anything ambiguous, especially #9 (image source).

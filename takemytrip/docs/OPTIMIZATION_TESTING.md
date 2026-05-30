# Optimization Testing Checklist

## Testing Overview
This document provides a comprehensive testing checklist for all optimization changes implemented in the travel planner UI cleanup.

**Branch:** `claude/travel-planner-ui-cleanup-Ma5V9`

**Testing Date:** 2026-01-12

---

## Phase 1: Quick Wins - Testing

### 1.1 Krakow Multiple Vacation Types
- [ ] Navigate to destination step
- [ ] Select "Πολιτισμός" (Culture) from vacation type dropdown
- [ ] Verify Krakow appears in search results
- [ ] Select "Βουνό" (Mountain) from vacation type dropdown
- [ ] Verify Krakow appears in search results again
- [ ] Confirm Krakow does NOT appear in other vacation types (Beach, City Break, etc.)

### 1.2 Map Filters Above Map
- [ ] Navigate to map step
- [ ] Verify day filter section appears ABOVE the map container
- [ ] Confirm filters are visible without scrolling
- [ ] Check responsive layout on mobile view

### 1.3 Auto-Apply Day Filters
- [ ] Navigate to map step with generated program
- [ ] Check/uncheck "1η μέρα" checkbox
- [ ] Verify activities immediately filter on map WITHOUT clicking apply button
- [ ] Test all day checkboxes (1η, 2η, 3η μέρα)
- [ ] Verify "Επιλογή όλων" and "Αποεπιλογή όλων" buttons work correctly

### 1.4 Removed Buttons
- [ ] Navigate to map step
- [ ] Verify "ΟΜΑΔΟΠΟΙΗΣΗ" button is completely removed
- [ ] Verify "ΕΦΑΡΜΟΓΗ ΦΙΛΤΡΟΥ" button is completely removed
- [ ] Confirm map controls only show relevant buttons

---

## Phase 2: Styling - Testing

### 2.1 Free Activity Badges (Slanted)
- [ ] Navigate to activities step for London
- [ ] Look for free activities (Natural History Museum, Science Museum, etc.)
- [ ] Verify green slanted "ΔΩΡΕΑΝ" badge appears in top-right corner
- [ ] Check badge has proper rotation (45deg)
- [ ] Verify gradient background (green)
- [ ] Test badge does NOT appear on playgrounds

### 2.2 Age-Limited Free Badges
- [ ] Find activities free for specific ages (e.g., Horniman Aquarium free under 3)
- [ ] Verify orange slanted badge appears
- [ ] Check badge text shows age range (e.g., "ΔΩΡΕΑΝ ΓΙΑ ΚΑΤΩ ΤΩΝ 3 ΕΤΩΝ")
- [ ] Verify gradient background (orange)

### 2.3 Playground Labels
- [ ] Navigate to activities with playgrounds (Diana Memorial, Coram's Fields)
- [ ] Verify purple "ΠΑΙΔΙΚΗ ΧΑΡΑ" label appears with icon
- [ ] Confirm label is below activity header
- [ ] Verify NO "ΔΩΡΕΑΝ" badge appears on playgrounds

### 2.4 Activity Name Links
- [ ] Find activities with websites (Tower of London, Harry Potter Studio, etc.)
- [ ] Verify activity name is clickable with external link icon
- [ ] Click link and verify it opens in new tab
- [ ] Hover over link and verify color change animation
- [ ] Verify activities WITHOUT websites show name as plain text

### 2.5 City Pass Badge
- [ ] Select London and navigate to activities
- [ ] Verify city pass info card appears at top
- [ ] Find Merlin activities (London Eye, SEA LIFE, Madame Tussauds, Shrek's Adventure)
- [ ] Verify purple "🎫 Pass" badge appears next to activity name
- [ ] Check gradient background on badge

### 2.6 Top Activity Badges
- [ ] Find top activities (Tower of London, British Museum, Sky Garden, Madame Tussauds, SEA LIFE)
- [ ] Verify yellow "🔝💯" badge appears next to activity name
- [ ] Check emojis render correctly

---

## Phase 3-4: Activity Grouping & Rendering - Testing

### 3.1 Activity Section Headers
- [ ] Navigate to London activities step
- [ ] Verify section headers appear in this order:
  1. **⭐ TOP ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ**
  2. **🏛️ ΜΟΥΣΕΙΑ**
  3. **🎯 ΑΛΛΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ** (with note)
  4. **🎠 ΠΑΙΔΙΚΕΣ ΧΑΡΕΣ**
  5. **🆓 ΔΩΡΕΑΝ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ**
- [ ] Verify headers span full width (grid-column: 1/-1)
- [ ] Check blue underline on headers
- [ ] Verify note under "ΑΛΛΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ": "ΕΠΙΛΕΞΤΕ ΠΡΟΚΕΙΜΕΝΟΥ ΝΑ ΥΠΟΛΟΓΙΣΤΕΙ ΤΟ ΗΜΕΡΗΣΙΟ ΠΡΟΓΡΑΜΜΑ"

### 3.2 Activity Sorting Order
- [ ] Verify top activities appear first (Tower of London, British Museum, Sky Garden, Madame Tussauds, SEA LIFE)
- [ ] Verify museums appear second (Natural History, Science, etc.)
- [ ] Verify paid non-museum activities appear third
- [ ] Verify playgrounds appear fourth (Diana Memorial, Coram's Fields)
- [ ] Verify free activities appear last
- [ ] Within each category, verify alphabetical sorting

### 3.3 City Pass Info Card
- [ ] Select London
- [ ] Verify purple gradient card appears at top of activities
- [ ] Check card shows:
  - Icon: 🎫
  - Title: "Merlin Annual Pass"
  - Description: Greek text about combining Merlin activities
  - Discount: "💰 Έως 30% έκπτωση"
- [ ] Verify card spans full width
- [ ] Check gradient background (purple)

### 3.4 Restaurant/Cafe Recommendations
**Test activities with restaurant data:**

| Activity | Expected Restaurant Type | Expected Distance | Expected Display |
|----------|-------------------------|-------------------|------------------|
| London Eye | restaurant | 0 | "εστιατόριο / εντός του ίδιου χώρου" |
| Tower of London | cafe | 0 | "καφέ / εντός του ίδιου χώρου" |
| Natural History Museum | cafe | 0 | "καφέ / εντός του ίδιου χώρου" |
| ZSL London Zoo | restaurant | 0 | "εστιατόριο / εντός του ίδιου χώρου" |
| British Museum | restaurant | 0 | "εστιατόριο / εντός του ίδιου χώρου" |

**For each activity:**
- [ ] Verify restaurant section appears below activity header
- [ ] Check correct type (καφέ vs εστιατόριο) is displayed
- [ ] Verify distance text matches expected
- [ ] Verify walking icon (🚶) appears
- [ ] Check restaurant name link opens in new tab
- [ ] Verify "ΣΥΝΙΣΤΩΜΕΝΟ ΚΑΦΕ/ΕΣΤΙΑΤΟΡΙΟ" header appears

### 3.5 Combined Badge Display
**Test activities with multiple badges:**
- [ ] Tower of London: Top badge + Restaurant
- [ ] London Eye: City Pass badge + Restaurant
- [ ] SEA LIFE: Top badge + City Pass badge
- [ ] Natural History Museum: Free badge + Restaurant
- [ ] Verify all badges display correctly without overlap

---

## Regression Testing

### 4.1 Existing Features - Family Members
- [ ] Navigate to destination step
- [ ] Add family members with different ages
- [ ] Verify age-appropriate pricing displays correctly
- [ ] Check family member pricing updates when adding/removing members
- [ ] Verify pricing calculations remain accurate

### 4.2 Existing Features - Activity Selection
- [ ] Select multiple activities
- [ ] Verify star toggles on/off correctly
- [ ] Check selected activities persist when navigating steps
- [ ] Verify localStorage saves selections

### 4.3 Existing Features - Program Generation
- [ ] Navigate to summary step
- [ ] Click "Δημιουργία Προγράμματος"
- [ ] Verify program generates correctly
- [ ] Check activities are distributed across days
- [ ] Verify geographic scheduling works
- [ ] Check map step shows generated program

### 4.4 Existing Features - Map Display
- [ ] Navigate to map step
- [ ] Verify map initializes correctly
- [ ] Check activity markers appear
- [ ] Verify marker clustering works
- [ ] Test custom point addition
- [ ] Check route drawing between activities

### 4.5 Existing Features - State Management
- [ ] Complete entire flow (destination → activities → summary → map)
- [ ] Refresh page
- [ ] Verify "Έχετε αποθηκευμένο ταξίδι" prompt appears
- [ ] Click "Φόρτωση δεδομένων"
- [ ] Verify all selections restore correctly

---

## Browser Compatibility Testing

### 5.1 Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Check for each browser:**
- [ ] CSS transforms (slanted badges) render correctly
- [ ] Gradient backgrounds display properly
- [ ] External link icons appear
- [ ] All animations work smoothly

### 5.2 Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile

**Check for each browser:**
- [ ] Slanted badges don't overflow cards
- [ ] Touch interactions work correctly
- [ ] Day filters remain accessible above map
- [ ] Responsive layout adapts properly

### 5.3 Mobile Responsive Design
- [ ] Test at 320px width (small mobile)
- [ ] Test at 768px width (tablet)
- [ ] Test at 1024px width (desktop)
- [ ] Verify activity cards stack properly on mobile
- [ ] Check section headers remain readable
- [ ] Verify map filters don't overlap on small screens

---

## Performance Testing

### 6.1 Load Times
- [ ] Measure initial page load time
- [ ] Check activity step render time with 30+ activities
- [ ] Verify map initialization time
- [ ] Test program generation speed

### 6.2 Memory Usage
- [ ] Monitor memory usage during navigation
- [ ] Check for memory leaks when switching steps multiple times
- [ ] Verify map cleanup when leaving map step

### 6.3 Interaction Responsiveness
- [ ] Activity selection should respond within 100ms
- [ ] Filter changes should apply within 200ms
- [ ] Step navigation should complete within 300ms

---

## Edge Cases & Error Handling

### 7.1 No Family Members
- [ ] Try to proceed without adding family members
- [ ] Verify appropriate error handling

### 7.2 No Activities Selected
- [ ] Try to generate program without selecting activities
- [ ] Verify error message appears

### 7.3 Cities Without JSON Data
- [ ] Select a city without JSON data (e.g., Krakow)
- [ ] Verify warning message displays
- [ ] Check application doesn't break

### 7.4 Corrupt localStorage
- [ ] Manually corrupt localStorage data
- [ ] Refresh page
- [ ] Verify StateValidator catches errors
- [ ] Check application resets gracefully

---

## Accessibility Testing

### 8.1 Screen Readers
- [ ] Test with NVDA/JAWS (Windows) or VoiceOver (Mac)
- [ ] Verify activity cards announce correctly
- [ ] Check section headers are announced
- [ ] Verify badges are read properly

### 8.2 Keyboard Navigation
- [ ] Navigate through activities using Tab key
- [ ] Verify all interactive elements are focusable
- [ ] Check focus indicators are visible
- [ ] Test Enter key for activity selection

### 8.3 Color Contrast
- [ ] Verify badge text meets WCAG AA contrast requirements
- [ ] Check section header colors are readable
- [ ] Test color-blind friendly design (no red/green only indicators)

---

## Known Limitations

### Features Still Using Old Code
These features remain in script.js and should continue working:
- ✅ setupActivitiesStep() - Activity JSON loading and rendering
- ✅ setupSummaryStep() - Program generation
- ✅ setupMapStep() - Map initialization and controls

### Future Enhancements
Items NOT included in this optimization phase:
- Add restaurant distance data to other cities
- Add city pass info to other cities
- Implement walking distance calculation from coordinates
- Add more city passes (London Pass, Paris Museum Pass, etc.)

---

## Test Results Template

**Tester:** _________________
**Date:** _________________
**Browser:** _________________
**Device:** _________________

### Summary
- [ ] All Phase 1 tests passed
- [ ] All Phase 2 tests passed
- [ ] All Phase 3-4 tests passed
- [ ] Regression tests passed
- [ ] Browser compatibility confirmed
- [ ] Performance acceptable
- [ ] Edge cases handled correctly
- [ ] Accessibility requirements met

### Issues Found
_List any issues discovered during testing:_

1.
2.
3.

### Recommendations
_Suggestions for improvements:_

1.
2.
3.

---

## Testing Sign-off

**Developer:** ✅ Code complete and committed
**Tester:** ⬜ Testing complete
**Product Owner:** ⬜ Approved for production

---

## References

- **Branch:** claude/travel-planner-ui-cleanup-Ma5V9
- **Commit History:** See recent commits for detailed change log
- **Documentation:**
  - docs/MODULE_MAP.md
  - docs/PHASE3_SUMMARY.md
  - User requirements specification (in conversation history)

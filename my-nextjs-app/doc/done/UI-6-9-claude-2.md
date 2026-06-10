# Map Page & My Trips UI Improvements

## 1. Map Markers Styling (Map Page)

### Marker Padding
- Reduce the **padding around map markers**
- Markers should appear more compact and visually tight on the map

### Hover Effect
- Remove the **border circle effect on hover**
- Instead of adding any outline or ring:
  - Only change the **icon color on hover**
- Keep the interaction subtle and clean

---

## 2. Top Buttons Hover State (Map Page)

- Update hover behavior for the buttons located at the top of the map page
- Remove the current strong gray hover effect
- Replace it with a **lighter, more subtle gray tone**
- The hover should feel minimal and not visually heavy

---

## 3. “My Trips” Page – Trip Components Layout

### Consistency with Plan Page
- Trip components in **My Trips page must match exactly the design of the Trip component used in the Plan page**
- Ensure identical:
  - Spacing
  - Typography
  - Structure
  - Visual hierarchy

---

### Activities Section Behavior
- Activities inside each trip component should be:
  - **Hidden by default**
  - Expandable only when user interacts (if expansion exists in Plan page)

---

### Layout Structure
- Activities should be displayed in a **single column layout**
- Do NOT display them in a grid or side-by-side format
- Each activity should appear:
  - One below the other (vertical stacking)
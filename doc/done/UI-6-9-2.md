# Mobile UI Improvements & Navigation Updates

## 1. Date Range Input (Mobile UX Improvement)
On mobile devices, the current single date-range input should be split into two separate inputs:

- **From Date Input**
- **To Date Input**

Both inputs should:
- Visually match in style and layout
- Maintain identical functionality to the current range picker
- Work together as a unified date range selector under the hood

---

## 2. Full-Screen Date Picker Modal (Mobile)
The modal used for selecting dates must be updated for mobile devices:

- The modal should take **full screen width and height**
- It should not be constrained by the parent container size
- It must feel like a native full-screen mobile picker experience
- The usability and functionality must remain unchanged

---

## 3. Navbar Title (Mobile)
On mobile devices:

- The application title displayed on the **top-left of the navbar** should be increased in size
- It should be more visually prominent and readable

---

## 4. Navigation Menu (Mobile – Three Bars Menu)
When the hamburger / three-bars icon is clicked:

- The navigation links inside the opened modal/menu should have **larger font size**
- The links should remain clearly readable and touch-friendly
- Styling should remain consistent between all nav items

---

## 5. Theme Toggle Button Removal & Replacement
### Changes:
- Completely **remove the theme toggle button** from the top-right navbar
- Also remove it from the mobile navigation links/menu

### Replacement:
- Replace the removed theme toggle button with a new navigation item:
  - **"My Trips"**

### My Trips Button Styling:
- Should be styled as a **secondary button**
- Must visually differ from primary navigation links
- Should remain clearly accessible in both desktop and mobile layouts

---

## 6. Summary of Mobile-Focused Changes
- Improved date range UX (split inputs)
- Full-screen modal behavior for date picker
- Enhanced navbar title visibility
- Larger mobile navigation link text
- Removed theme switching UI
- Introduced “My Trips” secondary navigation button
// -----------------------------------------------------------------------------
// Feature flags
// -----------------------------------------------------------------------------
// Single switches that turn whole UI surfaces on/off WITHOUT deleting their
// logic, so a feature can be hidden now and brought back by flipping one bool.

// "Vibe" (cultural / foodie / adventurous / relaxing) as a USER-FACING control.
// When false, every vibe SELECTOR is hidden app-wide (the /map sidebar dropdown
// and bar, the /activities filter, and the plan-page Vibe filter) and the vibe
// filter scores nothing by default ("all vibes"). The underlying logic — the
// VibeKey type, bestVibe, the card gradients/icons — is untouched, so flipping
// this back to true restores the controls exactly as they were.
export const VIBE_UI_ENABLED = false;

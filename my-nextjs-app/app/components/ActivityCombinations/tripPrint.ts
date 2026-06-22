// "Download PDF" for a trip: opens a clean printable itinerary in a new window
// and triggers the browser's print dialog — the user picks "Save as PDF".
// (No PDF library: keeps the bundle lean and renders Greek text natively.)
import { DAYS } from "./core/activities.data";
import { activityPrice, formatTime, openingHoursFor } from "./core/activities.functions";
import type { Trip } from "./core/trip.functions";
import { HIDE_ACTIVITY_PRICES } from "@/app/config";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function printTrip(trip: Trip, heading: string): void {
  // When prices are off, the PDF drops the Κόστος column + the total.
  const showCost = !HIDE_ACTIVITY_PRICES;
  const totalPrice = trip.days.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + activityPrice(a), 0),
    0
  );

  const days = trip.days
    .map((td) => {
      // Map an item's name back to its activity so we can show that day's opening
      // hours and the cost (cost lives in the PDF only, not on the trip card).
      const byName = new Map(td.activities.map((a) => [a.name, a]));
      const rows =
        td.plan.items.length === 0
          ? `<tr><td class="muted" colspan="${showCost ? 4 : 3}">No activities placed.</td></tr>`
          : td.plan.items
              .map((item) => {
                const act = item.lunch ? undefined : byName.get(item.name);
                const hours = act ? esc(openingHoursFor(act, td.day)) : "";
                const cost = act ? `€${activityPrice(act)}` : "";
                return `
        <tr class="${item.lunch ? "lunch" : ""}">
          <td class="time">${
            item.closed ? "closed" : `${formatTime(item.start)}–${formatTime(item.end)}`
          }</td>
          <td>${esc(item.name)}</td>
          <td class="hours">${hours}</td>
          ${showCost ? `<td class="cost">${cost}</td>` : ""}
        </tr>`;
              })
              .join("");
      return `
      <section>
        <h2>${DAYS[td.day]}</h2>
        <table>
          <tr class="head"><td class="time">Ώρα</td><td>Δραστηριότητα</td><td class="hours">Ωράριο</td>${showCost ? `<td class="cost">Κόστος</td>` : ""}</tr>
          ${rows}
        </table>
      </section>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(heading)} — trip</title>
<style>
  body { font-family: "Segoe UI", system-ui, sans-serif; color: #27272a; margin: 32px; }
  h1 { font-size: 22px; margin: 0; }
  .summary { color: #71717a; font-size: 13px; margin: 4px 0 20px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a;
       border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; margin: 18px 0 6px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  td { padding: 3px 0; vertical-align: baseline; }
  .time { width: 110px; color: #71717a; font-variant-numeric: tabular-nums; }
  .hours { color: #71717a; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .cost { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .head td { color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
             border-bottom: 1px solid #e4e4e7; }
  .lunch td { color: #a1a1aa; font-style: italic; }
  .muted { color: #a1a1aa; font-style: italic; }
  footer { margin-top: 28px; font-size: 11px; color: #a1a1aa; }
</style>
</head>
<body>
  <h1>${esc(heading)}</h1>
  <p class="summary">${showCost ? `Total price: €${totalPrice} · ` : ""}Total days: ${trip.days.length}</p>
  ${days}
  <footer>takethekids.info</footer>
</body>
</html>`;

  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return; // popup blocked — nothing else to do
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

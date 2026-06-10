// "Download PDF" for a trip: opens a clean printable itinerary in a new window
// and triggers the browser's print dialog — the user picks "Save as PDF".
// (No PDF library: keeps the bundle lean and renders Greek text natively.)
import { DAYS } from "./core/activities.data";
import { activityPrice, formatTime } from "./core/activities.functions";
import type { Trip } from "./core/trip.functions";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function printTrip(trip: Trip, heading: string): void {
  const totalPrice = trip.days.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + activityPrice(a), 0),
    0
  );

  const days = trip.days
    .map((td) => {
      const rows =
        td.plan.items.length === 0
          ? `<tr><td class="muted" colspan="2">No activities placed.</td></tr>`
          : td.plan.items
              .map(
                (item) => `
        <tr class="${item.lunch ? "lunch" : ""}">
          <td class="time">${
            item.closed ? "closed" : `${formatTime(item.start)}–${formatTime(item.end)}`
          }</td>
          <td>${esc(item.name)}</td>
        </tr>`
              )
              .join("");
      return `
      <section>
        <h2>${DAYS[td.day]}</h2>
        <table>${rows}</table>
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
  .lunch td { color: #a1a1aa; font-style: italic; }
  .muted { color: #a1a1aa; font-style: italic; }
  footer { margin-top: 28px; font-size: 11px; color: #a1a1aa; }
</style>
</head>
<body>
  <h1>${esc(heading)}</h1>
  <p class="summary">Total price: €${totalPrice} · Total days: ${trip.days.length}</p>
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

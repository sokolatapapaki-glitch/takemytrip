// Temporary smoke driver: open the running dev server, navigate to the trip
// planner, and screenshot it. Deleted after the run.
import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

console.log("nav: home");
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
await page.screenshot({ path: "smoke-home.png", fullPage: false });
console.log("title:", await page.title());

// Find a link toward the planner (plan page) if present.
const links = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
console.log("links:", [...new Set(links)].slice(0, 20).join("  "));

await browser.close();
console.log("console errors:", errors.length ? errors.join("\n") : "(none)");

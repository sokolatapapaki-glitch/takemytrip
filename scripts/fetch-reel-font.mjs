#!/usr/bin/env node
// Fetch the reel overlay's Greek font.
//
// The font is NOT committed (it is ~550 KB of binary that npm can fetch on
// demand); this script puts it where overlay.css expects it. A headless
// container has no guaranteed Greek-capable system font, so the overlay refuses
// to render without it rather than silently emitting a reel full of tofu.
//
//   npm run reel:font

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Noto Sans 700, static TTF from Google Fonts' legacy (full-coverage) endpoint.
// Pinned by URL so a re-fetch gives the same bytes and reels stay reproducible.
const URL_ =
  "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf";

const dest = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "reels",
  "overlay",
  "fonts",
  "NotoSans-Bold.ttf"
);

const res = await fetch(URL_, {
  headers: { "User-Agent": "Mozilla/5.0" },
});
if (!res.ok) {
  console.error(`✖ font fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const bytes = Buffer.from(await res.arrayBuffer());
if (bytes.length < 100_000) {
  console.error(`✖ font fetch returned only ${bytes.length} bytes — that is not the font.`);
  process.exit(1);
}
await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.writeFile(dest, bytes);
console.log(`✔ ${path.relative(process.cwd(), dest)} — ${(bytes.length / 1024).toFixed(0)} KB`);

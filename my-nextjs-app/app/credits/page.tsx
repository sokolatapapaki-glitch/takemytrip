import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image credits",
};

// Public attribution page — fulfils the visible-credit condition of the
// CC-licensed photos used on the site (CC BY / BY-SA require naming the author
// and the license wherever the work is used; a linked credits page is the
// accepted form). Unsplash photos need no credit, so they get a courtesy line
// only. Keep this list in sync with doc/image-sources.md.
const CC_CREDITS = [
  {
    subject: "Kraków — Rynek Główny panorama (destination cover)",
    author: "Andrzej Otrębski",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Krakow_Rynek_Glowny_panorama_2.jpg",
  },
];

export default function CreditsPage() {
  return (
    <section className="relative flex-1 bg-gradient-to-br from-orange-50 via-white to-emerald-50 px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-800">
          Image credits
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Photography on Take My Trip comes from sources that allow free
          commercial use. The Creative Commons photos below additionally require
          naming their authors — thank you to all of them.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-800">
          Creative Commons photos
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {CC_CREDITS.map((c) => (
            <li
              key={c.sourceUrl}
              className="rounded-2xl border border-white/60 bg-white/80 p-4 text-sm shadow-lg shadow-orange-900/5"
            >
              <p className="font-medium text-zinc-800">{c.subject}</p>
              <p className="mt-1 text-zinc-500">
                Photo by {c.author} —{" "}
                <a
                  href={c.licenseUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-orange-600 hover:underline"
                >
                  {c.license}
                </a>
                , via{" "}
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-orange-600 hover:underline"
                >
                  Wikimedia Commons
                </a>
                .
              </p>
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-zinc-800">
          Other photography
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Destination cover photos are from{" "}
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noreferrer noopener"
            className="text-orange-600 hover:underline"
          >
            Unsplash
          </a>{" "}
          (free to use under the Unsplash License). Activity photos are sourced
          from{" "}
          <a
            href="https://commons.wikimedia.org"
            target="_blank"
            rel="noreferrer noopener"
            className="text-orange-600 hover:underline"
          >
            Wikimedia Commons
          </a>
          ; per-photo author credits for them are being compiled and will be
          listed here.
        </p>
      </div>
    </section>
  );
}

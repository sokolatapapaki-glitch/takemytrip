import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Πηγές εικόνων",
};

// Public attribution page — fulfils the visible-credit condition of the
// CC-licensed photos used on the site (CC BY / BY-SA require naming the author
// and the license wherever the work is used; a linked credits page is the
// accepted form). Unsplash and CC0 photos need no credit, so they get a
// courtesy mention only.
//
// The list below is derived from the per-city public/destinations/<id>/
// _credits.json files (only entries with attributionRequired === true). Photos
// that were later replaced by the local Photos-repo sync (Park Güell, Picasso
// Museum) are intentionally NOT listed, since the displayed image is no longer
// the credited Commons work. Keep in sync with those _credits.json files.
type Credit = {
  subject: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

const CC_CREDITS: Credit[] = [
  {
    subject: "Κρακοβία — πανόραμα Rynek Główny (εξώφυλλο προορισμού)",
    author: "Andrzej Otrębski",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Krakow_Rynek_Glowny_panorama_2.jpg",
  },
  {
    subject: "Βαρκελώνη — Sagrada Família",
    author: "Maksim Sokolov (maxergon.com)",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Sagrada_Familia_at_night_02.jpg",
  },
  {
    subject: "Βαρκελώνη — Casa Batlló",
    author: "Bernard Gagnon",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Casa_Batll%C3%B3_01.jpg",
  },
  {
    subject: "Βαρκελώνη — Gaudí Experience",
    author: "Carlos Cunha",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Casa_Vicens,_Barcelona_-_panoramio.jpg",
  },
  {
    subject: "Βαρκελώνη — Montjuïc Castle (Castell de Montjuïc)",
    author: "C messier",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:%CE%9A%CE%AC%CF%83%CF%84%CF%81%CE%BF_%CE%9C%CE%BF%CE%BD%CE%B6%CE%BF%CF%85%CE%AF%CE%BA_3231_-_3233.jpg",
  },
  {
    subject: "Βαρκελώνη — Hospital de Sant Pau",
    author: "Ank Kumar",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:2014-_Hospital_Sant_Pau,_Barcelona,_Spain_(_Ank_Kumar_)_02.jpg",
  },
  {
    subject: "Βαρκελώνη — Camp Nou (Barça Stadium Tour)",
    author: "Oh-Barcelona.com from Barcelona, Spain",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Camp_Nou_aerial_(cropped).jpg",
  },
  {
    subject: "Βαρκελώνη — CosmoCaixa",
    author: "Jirka Dl",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:CosmoCaixa_building.jpg",
  },
  {
    subject: "Βαρκελώνη — Magic Fountain (Font Màgica)",
    author: "Georges Jansoone (JoJan)",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Barcelona_133.JPG",
  },
  {
    subject: "Βαρκελώνη — Museu Blau (Natural History Museum)",
    author: "Niels Broekzitter from Piershil, The Netherlands",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Barcelona_2006_(2845523526).jpg",
  },
  {
    subject: "Βαρκελώνη — L'Aquàrium de Barcelona",
    author: "Paul Hermans",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Tunnelaquarium_14-05-2009_15-54-09.JPG",
  },
  {
    subject: "Βαρκελώνη — Ciutat Vella / Barri Gòtic",
    author: "trolvag",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:PONT_del_CARRER_del_BISBE_-_panoramio.jpg",
  },
  {
    subject: "Βαρκελώνη — La Casa dels Entremesos (Μουσείο των Γιγάντων)",
    author: "Joe Mabel",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Barcelona_-_Gegants_and_sardana_in_El_Born_01.jpg",
  },
  {
    subject: "Ρώμη — Castel Sant'Angelo",
    author: "Colin W",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Castel_Sant%27Angelo,_Rome_-_panoramio.jpg",
  },
  {
    subject: "Ρώμη — Villa Borghese",
    author: "Krzysztof Golik",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Laghetto_and_Tempio_di_Esculapio_in_Villa_Borghese_02.jpg",
  },
  {
    subject: "Ρώμη — Galleria Borghese",
    author: "Alessio Damato",
    license: "CC BY-SA 3.0",
    licenseUrl: "http://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Galleria_borghese_facade.jpg",
  },
];

export default function CreditsPage() {
  return (
    <section className="relative flex-1 bg-gradient-to-br from-orange-50 via-white to-emerald-50 px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-800">
          Πηγές εικόνων
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Οι φωτογραφίες στο Take My Trip προέρχονται από πηγές που επιτρέπουν
          την ελεύθερη εμπορική χρήση. Οι φωτογραφίες με άδεια Creative Commons
          παρακάτω απαιτούν επιπλέον την αναφορά των δημιουργών τους — ένα
          μεγάλο ευχαριστώ σε όλους.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-800">
          Φωτογραφίες Creative Commons (απαιτείται αναφορά)
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {CC_CREDITS.map((c) => (
            <li
              key={c.sourceUrl}
              className="rounded-2xl border border-white/60 bg-white/80 p-4 text-sm shadow-lg shadow-orange-900/5"
            >
              <p className="font-medium text-zinc-800">{c.subject}</p>
              <p className="mt-1 text-zinc-500">
                Φωτογραφία από {c.author} —{" "}
                <a
                  href={c.licenseUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-orange-600 hover:underline"
                >
                  {c.license}
                </a>
                , μέσω{" "}
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
          Άλλες φωτογραφίες
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Οι περισσότερες φωτογραφίες των δραστηριοτήτων και τα εξώφυλλα των
          προορισμών προέρχονται από το{" "}
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noreferrer noopener"
            className="text-orange-600 hover:underline"
          >
            Unsplash
          </a>{" "}
          (ελεύθερη χρήση υπό την άδεια Unsplash, χωρίς υποχρέωση αναφοράς).
          Ορισμένες ακόμη προέρχονται από το{" "}
          <a
            href="https://commons.wikimedia.org"
            target="_blank"
            rel="noreferrer noopener"
            className="text-orange-600 hover:underline"
          >
            Wikimedia Commons
          </a>{" "}
          με άδεια κοινής χρήσης (π.χ. CC0 / δημόσιος τομέας) που δεν απαιτεί
          αναφορά. Όπου μια άδεια απαιτεί αναφορά, ο δημιουργός αναγράφεται
          παραπάνω.
        </p>
      </div>
    </section>
  );
}

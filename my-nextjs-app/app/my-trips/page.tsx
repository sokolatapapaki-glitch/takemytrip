import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My trips",
};

const SAVED_TRIPS = [
  {
    title: "Rome · Centro",
    subtitle: "2 days · 9 activities · €342",
    date: "May 18–19",
  },
  {
    title: "Barcelona · Gothic Quarter",
    subtitle: "3 days · 12 activities · €418",
    date: "Jun 4–6",
  },
  {
    title: "Lisbon · Alfama",
    subtitle: "2 days · 7 activities · €294",
    date: "Jul 1–2",
  },
];

export default function MyTripsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl shadow-orange-900/5">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">My trips</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          A quick list of saved trip plans. Tap one to review it later or rebuild it from the planner.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        {SAVED_TRIPS.map((trip) => (
          <article
            key={trip.title}
            className="rounded-3xl border border-white/80 bg-white/80 shadow-xl shadow-orange-900/10 ring-1 ring-black/5 backdrop-blur-md p-6 transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10"
          >
            <div className="mb-4 flex items-center justify-between gap-4 text-sm text-zinc-500">
              <span>{trip.date}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Saved</span>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">{trip.title}</h2>
            <p className="mt-2 text-sm text-zinc-500">{trip.subtitle}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900">
                View
              </button>
              <button className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600">
                Share
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

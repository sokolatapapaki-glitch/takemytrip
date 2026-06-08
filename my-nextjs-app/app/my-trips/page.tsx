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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAVED_TRIPS.map((trip) => (
          <article
            key={trip.title}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg shadow-orange-900/5 transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10"
          >
            <div className="mb-4 flex items-center justify-between gap-4 text-sm text-zinc-500">
              <span>{trip.date}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Saved</span>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">{trip.title}</h2>
            <p className="mt-2 text-sm text-zinc-500">{trip.subtitle}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-orange-300 hover:bg-orange-50">
                View
              </button>
              <button className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600">
                Share
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

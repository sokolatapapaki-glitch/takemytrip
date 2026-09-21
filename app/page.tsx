import type { Metadata } from "next";
import TripSearchHero from "./start/components/TripSearchHero";

export const metadata: Metadata = {
  title: "Plan a trip",
};

// The app's homepage is the trip-search hero. The activity planner now lives at
// /plan (reached by running a search).
export default function Home() {
  return <TripSearchHero />;
}

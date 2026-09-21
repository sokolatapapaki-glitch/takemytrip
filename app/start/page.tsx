import type { Metadata } from "next";
import TripSearchHero from "./components/TripSearchHero";

export const metadata: Metadata = {
  title: "Plan a trip",
};

// Kept as an alias of the homepage hero so old /start links keep working; the
// canonical homepage is now `/` (app/page.tsx).
export default function StartPage() {
  return <TripSearchHero />;
}

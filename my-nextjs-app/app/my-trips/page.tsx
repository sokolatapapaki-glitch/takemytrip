import type { Metadata } from "next";
import MyTripsExperience from "./components/MyTripsExperience";

export const metadata: Metadata = {
  title: "My trips",
};

// Thin server shell — the list itself reads localStorage, so it's client-side
// (see components/MyTripsExperience).
export default function MyTripsPage() {
  return <MyTripsExperience />;
}

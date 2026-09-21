import type { Metadata } from "next";
import PlannerClient from "@/app/components/ActivityCombinations/PlannerClient";

export const metadata: Metadata = {
  title: "Your trip plan",
};

// The activity planner. Reached from the homepage search (which pushes the chosen
// destination / area / dates here as query params).
export default function PlanPage() {
  return <PlannerClient />;
}

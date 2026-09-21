import type { Metadata } from "next";
import { Suspense } from "react";
import ActivitiesExperience from "./components/ActivitiesExperience";

export const metadata: Metadata = {
  title: "Activities",
};

// The Activities Enlist page from the Penpot board. ActivitiesExperience reads
// the ?city= param via useSearchParams (a Client hook), so it's wrapped in a
// Suspense boundary as this Next version requires.
export default function ActivitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <ActivitiesExperience />
    </Suspense>
  );
}

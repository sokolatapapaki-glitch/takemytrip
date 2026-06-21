import type { Metadata } from "next";
import CitiesExperience from "./components/CitiesExperience";

export const metadata: Metadata = {
  title: "Cities",
};

// The Cities page from the Penpot board: a searchable, sortable grid of
// destinations. Reached from the navbar's "Cities" button.
export default function CitiesPage() {
  return <CitiesExperience />;
}

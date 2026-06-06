import type { Metadata } from "next";
import MapClient from "./MapClient";

export const metadata: Metadata = {
  title: "Map",
};

// The Map page from the Penpot board: an interactive map of all cities and their
// activities, with a search sidebar, vibe filters, and hover/click activity cards.
export default function MapPage() {
  return <MapClient />;
}

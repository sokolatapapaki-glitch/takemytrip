"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

// Renders the site Footer on every page EXCEPT the full-screen map page (/map),
// which needs the whole viewport. Lives as a thin client wrapper because the root
// layout is a server component and can't read the current path itself.
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/map") return null;
  return <Footer />;
}

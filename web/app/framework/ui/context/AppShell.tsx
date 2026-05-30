"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/framework/ui/navigation/Navbar";
import Footer from "@/framework/ui/navigation/Footer";

const SHELL_HIDDEN_PATHS = [
  "/login",
  "/register",
  "/auth",
  "/about",
];

function isShellHidden(pathname: string) {
  return SHELL_HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideShell = isShellHidden(pathname);

  return (
    <>
      {!hideShell && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hideShell && <Footer />}
    </>
  );
}

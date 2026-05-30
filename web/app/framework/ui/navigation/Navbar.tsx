"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useApp } from "@/framework/ui/context/AppContext";
import ProductsMegaMenu from "@/framework/ui/navigation/helper/megamenus/ProductsMegaMenu";
import AboutMegaMenu from "@/framework/ui/navigation/helper/megamenus/AboutMegaMenu";
import NavSearch from "@/framework/ui/navigation/helper/NavSearch";
import HamburgerButton from "@/framework/ui/navigation/helper/HamburgerButton";
import RightSidebar from "@/framework/ui/navigation/helper/RightSidebar";
import UserMenu from "@/framework/ui/navigation/helper/UserMenu";
import UserSidebar from "@/framework/ui/navigation/helper/UserSidebar";
import { useTheme } from "next-themes";
import { useAbsoluteModal } from "@/framework/ui/context/AppContext";

type NavLink = {
  href: string;
  label: string;
  megaMenu?: ReactNode;
};

const THEMES = [
  { value: "system", label: "System", color: "#888888" },
  { value: "light", label: "Light", color: "#ffffff" },
  { value: "dark", label: "Dark", color: "#0a0a0a" },
  { value: "ocean", label: "Ocean", color: "#0a1628" },
  { value: "forest", label: "Forest", color: "#0a1a0a" },
  { value: "sunset", label: "Sunset", color: "#1a0a00" },
];

const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About", megaMenu: <AboutMegaMenu /> },
  { href: "/products", label: "Products", megaMenu: <ProductsMegaMenu /> },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/docs", label: "Docs" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userSidebarOpen, setUserSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const themeButtonRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!themeDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (themeButtonRef.current && !themeButtonRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [themeDropdownOpen]);

  const hoverModal = useAbsoluteModal();
  return (
    <>
      <nav
        className="bg-white border-b border-gray-200 sticky top-0 z-40"
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="px-6">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center gap-2">
              <HamburgerButton open={sidebarOpen} onClick={() => setSidebarOpen((v) => !v)} className="hidden md:flex" />
              <Link href="/" className="font-bold text-lg text-gray-900 tracking-tight">
                MyApp
              </Link>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6 h-full">
              {navLinks.map((link) => (
                <button
                  {...hoverModal.triggerProps}
                  className="h-full"
                  key={link.href}
                  onMouseEnter={() => hoverModal.open({
                    side: "bottom",
                    align: "center",
                    offset: 0,
                    closeOnLeave: true,
                    component: link.megaMenu,
                  })}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors h-full"
                  >
                    {link.label}
                    {link.megaMenu && (
                      <svg
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${activeMenu === link.label ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>
                </button>
              ))}
            </div>

            {/* Desktop user + sidebar trigger */}
            <div
              className="hidden md:flex items-center gap-2"
              onMouseEnter={() => setActiveMenu(null)}
            >
              {mounted && (
                <div ref={themeButtonRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setThemeDropdownOpen((v) => !v)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label="Change theme"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </button>
                  {themeDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                      {THEMES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => { setTheme(t.value); setThemeDropdownOpen(false); }}
                          className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${theme === t.value ? "font-medium text-gray-900" : "text-gray-600"}`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.label}
                          {theme === t.value && (
                            <svg className="w-3.5 h-3.5 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <NavSearch iconMode />
              <UserMenu user={user} />
            </div>

            {/* Mobile right side */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setUserSidebarOpen((v) => !v)}
                aria-label="Open user menu"
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {user?.image ? (
                  <img src={user.image} alt={user.name ?? "User"} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </button>
              <HamburgerButton open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-1">
            <div className="mb-2">
              <NavSearch placeholder="Search..." className="w-full" />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {mounted && (
              <div className="pt-3 mt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 px-3 mb-2">Theme</p>
                <div className="flex gap-2 px-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      title={t.label}
                      onClick={() => setTheme(t.value)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${theme === t.value ? "border-gray-500 scale-110" : "border-gray-200"}`}
                      style={{ backgroundColor: t.color }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="pt-3 mt-2 border-t border-gray-100">
              {user ? (
                <span className="text-sm font-medium text-gray-700 px-3">{user.name ?? user.email}</span>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm text-center bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <RightSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Sidebar" side="left">
        <nav className="flex flex-col gap-1">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          <Link href="/projects" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Projects
          </Link>
          <Link href="/tasks" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Tasks
          </Link>
          <Link href="/messages" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages
          </Link>
          <Link href="/analytics" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Link>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 px-3 mb-1">Account</p>
            <Link href="/settings" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
            <Link href="/help" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help & Support
            </Link>
          </div>
        </nav>
      </RightSidebar>

      <UserSidebar open={userSidebarOpen} onClose={() => setUserSidebarOpen(false)} content={
        user ? (
          <div className="flex flex-col gap-1">
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-800 truncate">{user.name ?? "User"}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <Link href="/profile" onClick={() => setUserSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
            <Link href="/settings" onClick={() => setUserSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link href="/api/auth/signout" onClick={() => setUserSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link href="/login" onClick={() => setUserSidebarOpen(false)} className="block text-sm text-center bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors">
              Sign in
            </Link>
            <Link href="/register" onClick={() => setUserSidebarOpen(false)} className="block text-sm text-center border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              Register
            </Link>
          </div>
        )
      } />
    </>
  );
}

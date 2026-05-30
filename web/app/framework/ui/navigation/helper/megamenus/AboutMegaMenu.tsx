"use client";

import Link from "next/link";

const sections = [
  { label: "Our Story", description: "How we started and where we're going", href: "/about/story" },
  { label: "Team", description: "Meet the people behind the product", href: "/about/team" },
  { label: "Careers", description: "Join us — we're hiring", href: "/about/careers" },
  { label: "Press", description: "News, media kit and brand assets", href: "/about/press" },
];

export default function AboutMegaMenu() {
  return (
    <div className="w-screen bg-white border-t border-gray-100 shadow-lg z-40">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-12">
          <div className="grid grid-cols-2 gap-3 flex-1">
            {sections.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </Link>
            ))}
          </div>
          <div className="w-56 bg-gray-50 rounded-xl p-5 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Get in touch</p>
            <p className="text-sm text-gray-600">Questions? We&apos;d love to hear from you.</p>
            <Link href="/contact" className="mt-2 text-sm text-center bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";

const categories = [
  { label: "Electronics", description: "Phones, laptops, accessories", href: "/products/electronics", icon: "⚡" },
  { label: "Clothing", description: "Shirts, pants, shoes", href: "/products/clothing", icon: "👕" },
  { label: "Home & Garden", description: "Furniture, tools, decor", href: "/products/home", icon: "🏠" },
  { label: "Sports", description: "Gear, apparel, equipment", href: "/products/sports", icon: "🏃" },
];

const featured = [
  { label: "New Arrivals", href: "/products/new" },
  { label: "Best Sellers", href: "/products/best-sellers" },
  { label: "Sale", href: "/products/sale" },
];

export default function ProductsMegaMenu() {
  return (
    <div className="w-screen bg-white border-t border-gray-100 shadow-lg z-40">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-3 grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-2xl leading-none mt-0.5">{cat.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{cat.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="border-l border-gray-100 pl-8 flex flex-col gap-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Featured</p>
            {featured.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-gray-600 hover:text-gray-900 py-1 transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

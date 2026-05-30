"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useApp } from "@/framework/ui/context/AppContext";

export type SearchResult = {
  id: string | number;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  group?: string;
  icon?: ReactNode;
  badge?: string;
};

type Props = {
  placeholder?: string;
  results?: SearchResult[];
  onSearch?: (query: string) => void;
  className?: string;
  iconMode?: boolean;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ResultItem({ item, onClose }: { item: SearchResult; onClose: () => void }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
      {item.icon && (
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-base">
          {item.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
        {item.description && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
        )}
      </div>
      {item.badge && (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
          {item.badge}
        </span>
      )}
    </div>
  );

  if (item.href) return <Link href={item.href} onClick={onClose}>{inner}</Link>;
  return <div onClick={() => { item.onClick?.(); onClose(); }} role={item.onClick ? "button" : undefined}>{inner}</div>;
}

export default function NavSearch({ placeholder = "Search...", results: externalResults, onSearch, className, iconMode = false }: Props) {
  const { tableRecords, prismaFields } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(!iconMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (iconMode) { setExpanded(false); setQuery(""); }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [iconMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        if (iconMode) { setExpanded(false); setQuery(""); }
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [iconMode]);

  const internalResults: SearchResult[] = [];
  if (!externalResults && query.trim().length > 0) {
    const q = query.toLowerCase();
    for (const [table, records] of Object.entries(tableRecords)) {
      const fields = prismaFields[table] ?? [];
      const labelField = fields.find((f) => f.kind === "scalar" && f.name !== "id" && f.type === "String")?.name;
      if (!labelField) continue;
      for (const record of records as Record<string, any>[]) {
        const val = record[labelField];
        if (val && String(val).toLowerCase().includes(q)) {
          internalResults.push({ id: record.id, label: String(val), description: `ID: ${record.id}`, badge: table, group: table });
        }
      }
    }
  }

  const results = externalResults ?? internalResults;
  const showDropdown = open && query.trim().length > 0;
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const g = r.group ?? "Results";
    (acc[g] ??= []).push(r);
    return acc;
  }, {});

  const close = () => { setOpen(false); setQuery(""); if (iconMode) setExpanded(false); };
  const clear = () => { setQuery(""); onSearch?.(""); inputRef.current?.focus(); };

  const openExpanded = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const dropdown = showDropdown && (
    <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <SearchIcon className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">No results for <span className="font-medium text-gray-600">&ldquo;{query}&rdquo;</span></p>
        </div>
      ) : (
        <div className="py-2">
          {Object.entries(grouped).map(([group, items], gi) => (
            <div key={group}>
              {(gi > 0 || Object.keys(grouped).length > 1) && (
                <div className={`px-4 ${gi > 0 ? "pt-3 mt-1 border-t border-gray-100" : "pt-2"} pb-1`}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider capitalize">{group}</p>
                </div>
              )}
              {items.map((item) => <ResultItem key={item.id} item={item} onClose={close} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (iconMode) {
    return (
      <div ref={containerRef} className={`relative w-9 h-9 ${className ?? ""}`}>
        <button
          type="button"
          onClick={openExpanded}
          aria-label="Search"
          className={`absolute inset-0 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${expanded ? "opacity-0 pointer-events-none" : ""}`}
        >
          <SearchIcon className="w-5 h-5 text-gray-600" />
        </button>

        {expanded && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50">
            <div className="relative flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white ring-2 ring-blue-400 shadow-sm">
              <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                placeholder={placeholder}
                onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                className="w-44 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
              {query && (
                <button type="button" onClick={clear} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {dropdown}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-56 ${className ?? ""}`}>
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent transition-all">
        <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="flex-1 min-w-0 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
        />
        {query && (
          <button type="button" onClick={clear} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
}

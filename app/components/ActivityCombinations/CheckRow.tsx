import { FaCheck } from "react-icons/fa6";

// A checkbox-style option row: a tick box on the LEFT + a label. Used by the
// Vibe filter and the "Must include" list so both read as multi-select ticks —
// distinct from the bordered FilterButton used by the other filter groups.
export function CheckRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          active
            ? "border-orange-500 bg-orange-500 text-white"
            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
        }`}
      >
        {active ? <FaCheck className="h-2.5 w-2.5" /> : null}
      </span>
      <span>{children}</span>
    </button>
  );
}

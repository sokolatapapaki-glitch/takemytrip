"use client";

// Travelers picker — like booking.com's, but with NO rooms option. Adults and
// children each have +/- steppers; when there is at least one child, a required
// age dropdown appears for each.

import type { Travelers } from "../data/types";
import { MinusIcon, PlusIcon } from "./icons";

const MAX = 9; // cap per group, booking-style
const CHILD_AGES = Array.from({ length: 18 }, (_, i) => i); // 0..17

function Stepper({
  label,
  caption,
  value,
  min,
  onDec,
  onInc,
}: {
  label: string;
  caption: string;
  value: number;
  min: number;
  onDec: () => void;
  onInc: () => void;
}) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 text-orange-600 transition-colors hover:bg-orange-50 disabled:cursor-default disabled:border-zinc-200 disabled:text-zinc-300";
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-400">{caption}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Fewer ${label}`} onClick={onDec} disabled={value <= min} className={btn}>
          <MinusIcon className="h-4 w-4" />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-zinc-800">{value}</span>
        <button type="button" aria-label={`More ${label}`} onClick={onInc} disabled={value >= MAX} className={btn}>
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function TravelersModal({
  value,
  onChange,
}: {
  value: Travelers;
  onChange: (t: Travelers) => void;
}) {
  const setAdults = (n: number) => onChange({ ...value, adults: n });

  const setChildren = (n: number) => {
    const childAges = value.childAges.slice(0, n);
    while (childAges.length < n) childAges.push(null);
    onChange({ ...value, children: n, childAges });
  };

  const setAge = (i: number, age: number) => {
    const childAges = value.childAges.slice();
    childAges[i] = age;
    onChange({ ...value, childAges });
  };

  return (
    <div className="w-72 p-4">
      <Stepper
        label="Adults"
        caption="Ages 18+"
        value={value.adults}
        min={1}
        onDec={() => setAdults(value.adults - 1)}
        onInc={() => setAdults(value.adults + 1)}
      />
      <div className="border-t border-black/5" />
      <Stepper
        label="Children"
        caption="Ages 0–17"
        value={value.children}
        min={0}
        onDec={() => setChildren(value.children - 1)}
        onInc={() => setChildren(value.children + 1)}
      />

      {value.children > 0 && (
        <div className="mt-2 border-t border-black/5 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Age of each child
          </p>
          <div className="flex flex-wrap gap-2">
            {value.childAges.map((age, i) => (
              <select
                key={i}
                required
                aria-label={`Child ${i + 1} age`}
                value={age ?? ""}
                onChange={(e) => setAge(i, Number(e.target.value))}
                className={`w-16 rounded-lg border px-2 py-1.5 text-sm transition-colors ${
                  age === null
                    ? "border-orange-300 text-zinc-400"
                    : "border-zinc-200 text-zinc-800"
                }`}
              >
                <option value="" disabled>
                  Age
                </option>
                {CHILD_AGES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

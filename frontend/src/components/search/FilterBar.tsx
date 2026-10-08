"use client";

import clsx from "clsx";
import { SlidersHorizontal } from "lucide-react";

import type { Amenity } from "@/lib/types";

// Quick-filter chips shown next to the Filters button, as on airbnb.co.in.
const QUICK: [string, string][] = [
  ["Wifi", "Wifi"],
  ["Kitchen", "Kitchen"],
  ["Free parking on premises", "Free parking"],
  ["Washing machine", "Washing machine"],
  ["Air conditioning", "Air conditioning"],
];

/** "Filters" button + one-tap amenity chips. Everything else lives in the Filters modal. */
export function FilterBar({
  amenities,
  selected,
  onToggle,
  filterCount,
  onOpenFilters,
}: {
  amenities: Amenity[];
  selected: number[];
  onToggle: (amenityId: number) => void;
  filterCount: number;
  onOpenFilters: () => void;
}) {
  const chip = (on: boolean) =>
    clsx(
      "flex h-[34px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-xs transition",
      on ? "border-fg bg-bg-elevated ring-1 ring-fg" : "border-line bg-bg-elevated hover:border-fg",
    );

  return (
    <div className="no-scrollbar flex items-center gap-3 overflow-x-auto md:justify-center">
      <button onClick={onOpenFilters} className={clsx(chip(filterCount > 0), "relative")}>
        <SlidersHorizontal size={14} />
        Filters
        {filterCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-fg px-1 text-[10px] font-semibold text-bg">
            {filterCount}
          </span>
        )}
      </button>
      <span className="h-6 w-px shrink-0 bg-line" />
      {QUICK.map(([name, label]) => {
        const a = amenities.find((x) => x.name === name);
        if (!a) return null;
        return (
          <button key={a.id} onClick={() => onToggle(a.id)} aria-pressed={selected.includes(a.id)} className={chip(selected.includes(a.id))}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

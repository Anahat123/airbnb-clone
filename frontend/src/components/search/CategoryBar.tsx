"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import type { Category } from "@/lib/types";

/** The icon row of categories (Beachfront, Cabins, ...) plus the Filters button. */
export function CategoryBar({
  categories,
  active,
  onSelect,
  filterCount,
  onOpenFilters,
}: {
  categories: Category[];
  active: string | null;
  onSelect: (slug: string | null) => void;
  filterCount: number;
  onOpenFilters: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = track.current;
    if (el) setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * 400, behavior: "smooth" });
  const arrow = "absolute top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg-elevated shadow-sm hover:scale-105 md:grid";

  return (
    <div className="flex items-center gap-6">
      <div className="relative min-w-0 flex-1">
        {!edges.start && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-16 bg-gradient-to-r from-bg to-transparent" />
            <button aria-label="Scroll categories left" className={clsx(arrow, "left-0")} onClick={() => scroll(-1)}>
              <ChevronLeft size={14} />
            </button>
          </>
        )}
        <div ref={track} onScroll={update} className="no-scrollbar flex gap-8 overflow-x-auto">
          {categories.map((c) => {
            const isActive = active === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => onSelect(isActive ? null : c.slug)}
                aria-pressed={isActive}
                className={clsx(
                  "group flex shrink-0 flex-col items-center gap-2 border-b-2 pb-3 pt-1 text-xs font-semibold transition",
                  isActive ? "border-fg text-fg" : "border-transparent text-fg-secondary hover:border-line hover:text-fg",
                )}
              >
                <Icon name={c.icon} size={24} className={isActive ? "" : "opacity-70 group-hover:opacity-100"} />
                <span className="whitespace-nowrap">{c.name}</span>
              </button>
            );
          })}
        </div>
        {!edges.end && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-16 bg-gradient-to-l from-bg to-transparent" />
            <button aria-label="Scroll categories right" className={clsx(arrow, "right-0")} onClick={() => scroll(1)}>
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </div>
      <button
        onClick={onOpenFilters}
        className={clsx(
          "relative flex h-12 shrink-0 items-center gap-2 rounded-xl border px-4 text-xs font-semibold hover:border-fg",
          filterCount ? "border-fg" : "border-line",
        )}
      >
        <SlidersHorizontal size={16} />
        <span className="hidden sm:inline">Filters</span>
        {filterCount > 0 && (
          <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-fg text-[10px] text-bg">
            {filterCount}
          </span>
        )}
      </button>
    </div>
  );
}

"use client";

import clsx from "clsx";

import { money } from "@/lib/format";
import type { PriceBucket } from "@/lib/types";

/** Histogram of nightly prices with a two-thumb slider and min/max boxes, like Airbnb's filter. */
export function PriceRange({
  histogram,
  bounds,
  value,
  onChange,
}: {
  histogram: PriceBucket[];
  bounds: [number, number];
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const [lo, hi] = bounds;
  const [min, max] = value;
  const peak = Math.max(1, ...histogram.map((b) => b.count));
  const pct = (v: number) => ((v - lo) / Math.max(1, hi - lo)) * 100;
  const step = Math.max(50, Math.round((hi - lo) / 200 / 50) * 50);

  const thumb =
    "pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-line [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-line [&::-moz-range-thumb]:bg-white";

  return (
    <div>
      <div className="flex h-20 items-end gap-[2px] px-4">
        {histogram.map((b, i) => (
          <div
            key={i}
            className={clsx("flex-1 rounded-t-sm", b.max >= min && b.min <= max ? "bg-rausch" : "bg-line")}
            style={{ height: `${Math.max(4, (b.count / peak) * 100)}%` }}
          />
        ))}
      </div>
      <div className="relative mx-4 h-8">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-line" />
        <div className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-fg" style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }} />
        <input
          type="range"
          aria-label="Minimum price"
          min={lo}
          max={hi}
          step={step}
          value={min}
          onChange={(e) => onChange([Math.min(Number(e.target.value), max - step), max])}
          className={thumb}
        />
        <input
          type="range"
          aria-label="Maximum price"
          min={lo}
          max={hi}
          step={step}
          value={max}
          onChange={(e) => onChange([min, Math.max(Number(e.target.value), min + step)])}
          className={thumb}
        />
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        {(["Minimum", "Maximum"] as const).map((label, i) => (
          <label key={label} className="flex-1 rounded-full border border-line px-5 py-2 text-center">
            <span className="block text-xs text-fg-secondary">{label}</span>
            <span className="block text-sm font-semibold">
              {money(value[i])}
              {i === 1 && max >= hi ? "+" : ""}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

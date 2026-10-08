"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Button, Counter, Divider } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import type { Meta, RoomType } from "@/lib/types";

import { PriceRange } from "./PriceRange";

export interface Filters {
  room_type: RoomType | null;
  min_price: number | null;
  max_price: number | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: number[];
  property_types: string[];
  guest_favourite: boolean;
}

export const NO_FILTERS: Filters = {
  room_type: null,
  min_price: null,
  max_price: null,
  bedrooms: 0,
  beds: 0,
  bathrooms: 0,
  amenities: [],
  property_types: [],
  guest_favourite: false,
};

export function countFilters(f: Filters): number {
  return (
    (f.room_type ? 1 : 0) +
    (f.min_price !== null || f.max_price !== null ? 1 : 0) +
    (f.bedrooms ? 1 : 0) +
    (f.beds ? 1 : 0) +
    (f.bathrooms ? 1 : 0) +
    f.amenities.length +
    f.property_types.length +
    (f.guest_favourite ? 1 : 0)
  );
}

export function filtersToQuery(f: Filters) {
  return {
    room_type: f.room_type,
    min_price: f.min_price,
    max_price: f.max_price,
    bedrooms: f.bedrooms || null,
    beds: f.beds || null,
    bathrooms: f.bathrooms || null,
    amenities: f.amenities.join(",") || null,
    property_types: f.property_types.join(",") || null,
    guest_favourite: f.guest_favourite || null,
  };
}

const RECOMMENDED = ["Wifi", "Pool", "Air conditioning", "Free parking on premises", "Kitchen", "Self check-in"];

export function FiltersModal({
  open,
  onClose,
  meta,
  value,
  onApply,
  baseQuery,
}: {
  open: boolean;
  onClose: () => void;
  meta: Meta;
  value: Filters;
  onApply: (f: Filters) => void;
  /** Location, dates, guests and category: used for the live "Show N places" count. */
  baseQuery: Record<string, string | number | boolean | null>;
}) {
  const [draft, setDraft] = useState(value);
  const [count, setCount] = useState<number | null>(null);

  // Live result count, debounced, like Airbnb's "Show 312 places" button.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      api
        .search({ ...baseQuery, ...filtersToQuery(draft), page_size: 1 })
        .then((r) => setCount(r.total))
        .catch(() => setCount(null));
    }, 250);
    return () => clearTimeout(t);
  }, [open, draft, baseQuery]);

  const { amenities } = meta;
  const amenityGroups = useMemo(() => {
    const groups: Record<string, typeof amenities> = {};
    for (const a of amenities) (groups[a.group] ??= []).push(a);
    return groups;
  }, [amenities]);

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));

  const chip = (on: boolean) =>
    clsx(
      "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition",
      on ? "border-fg bg-bg-secondary ring-1 ring-fg" : "border-line hover:border-fg",
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filters"
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <button className="rounded-lg px-2 py-2 font-semibold underline hover:bg-bg-hover" onClick={() => setDraft(NO_FILTERS)}>
            Clear all
          </button>
          <Button size="lg" onClick={() => onApply(draft)}>
            {count === null ? "Show places" : count === 0 ? "No exact matches" : `Show ${count} place${count === 1 ? "" : "s"}`}
          </Button>
        </div>
      }
    >
      <section className="pb-8">
        <h3 className="mb-4 text-[22px] font-medium">Recommended for you</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {RECOMMENDED.map((name) => meta.amenities.find((a) => a.name === name))
            .filter((a) => a !== undefined)
            .map((a) => {
              const on = draft.amenities.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => set({ amenities: toggle(draft.amenities, a.id) })}
                  className={clsx("flex flex-col gap-6 rounded-xl border p-4 text-left text-sm font-semibold", on ? "border-fg bg-bg-secondary ring-1 ring-fg" : "border-line hover:border-fg")}
                >
                  <Icon name={a.icon} size={28} />
                  {a.name}
                </button>
              );
            })}
        </div>
      </section>
      <Divider />

      <section className="py-8">
        <h3 className="mb-4 text-[22px] font-medium">Type of place</h3>
        <div className="grid grid-cols-3 rounded-2xl bg-bg-secondary p-1 text-sm font-semibold">
          {([
            [null, "Any type"],
            ["private_room", "Room"],
            ["entire_home", "Entire home"],
          ] as const).map(([v, label]) => (
            <button
              key={label}
              onClick={() => set({ room_type: v })}
              className={clsx("rounded-xl py-4", draft.room_type === v ? "bg-bg-elevated shadow ring-1 ring-fg" : "text-fg-secondary hover:text-fg")}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <Divider />

      <section className="py-8">
        <h3 className="text-[22px] font-medium">Price range</h3>
        <p className="mb-6 text-sm text-fg-secondary">Nightly prices before fees</p>
        <PriceRangeSection meta={meta} draft={draft} set={set} />
      </section>
      <Divider />

      <section className="py-8">
        <h3 className="mb-2 text-[22px] font-medium">Rooms and beds</h3>
        <Counter label="Bedrooms" value={draft.bedrooms} max={8} onChange={(n) => set({ bedrooms: n })} />
        <Counter label="Beds" value={draft.beds} max={8} onChange={(n) => set({ beds: n })} />
        <Counter label="Bathrooms" value={draft.bathrooms} max={8} onChange={(n) => set({ bathrooms: n })} />
      </section>
      <Divider />

      <section className="py-8">
        <h3 className="mb-4 text-[22px] font-medium">Amenities</h3>
        {Object.entries(amenityGroups).map(([group, items]) => (
          <div key={group} className="mb-6">
            <h4 className="mb-3 font-semibold">{group}</h4>
            <div className="flex flex-wrap gap-3">
              {items.map((a) => (
                <button key={a.id} className={chip(draft.amenities.includes(a.id))} onClick={() => set({ amenities: toggle(draft.amenities, a.id) })}>
                  <Icon name={a.icon} size={18} />
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
      <Divider />

      <section className="py-8">
        <h3 className="mb-4 text-[22px] font-medium">Booking options</h3>
        <label className="flex cursor-pointer items-center justify-between">
          <span>
            <span className="block font-semibold">Guest favourite</span>
            <span className="text-sm text-fg-secondary">The most loved homes on Airbnb</span>
          </span>
          <input
            type="checkbox"
            checked={draft.guest_favourite}
            onChange={(e) => set({ guest_favourite: e.target.checked })}
            className="peer sr-only"
          />
          <span className="relative h-8 w-12 rounded-full bg-line transition peer-checked:bg-fg after:absolute after:left-0.5 after:top-0.5 after:h-7 after:w-7 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4" />
        </label>
      </section>
      <Divider />

      <section className="pt-8">
        <h3 className="mb-4 text-[22px] font-medium">Property type</h3>
        <div className="flex flex-wrap gap-3">
          {meta.property_types.map((p) => (
            <button key={p} className={chip(draft.property_types.includes(p))} onClick={() => set({ property_types: toggle(draft.property_types, p) })}>
              {p}
            </button>
          ))}
        </div>
      </section>
    </Modal>
  );
}

function PriceRangeSection({ meta, draft, set }: { meta: Meta; draft: Filters; set: (p: Partial<Filters>) => void }) {
  const lo = meta.price_min;
  const hi = meta.price_max;
  return (
    <PriceRange
      histogram={meta.price_histogram}
      bounds={[lo, hi]}
      value={[draft.min_price ?? lo, draft.max_price ?? hi]}
      // A thumb at either end means "no limit", so it isn't sent as a filter.
      onChange={([a, b]) => set({ min_price: a <= lo ? null : a, max_price: b >= hi ? null : b })}
    />
  );
}

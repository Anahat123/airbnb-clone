"use client";

import { MapPin, Navigation } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Destination } from "@/lib/types";

const BLURBS: Record<string, string> = {
  Goa: "Popular beach destination",
  Manali: "For nature lovers",
  Jaipur: "For its stunning architecture",
  Udaipur: "For sights like City Palace",
  Mumbai: "For sights like Gateway of India",
  Bengaluru: "For its bustling nightlife",
  Lonavala: "Great for a weekend getaway",
  Coorg: "For nature lovers",
  Rishikesh: "For sights like Laxman Jhula",
  Alappuzha: "Known for its backwaters",
  Puducherry: "For its French Quarter",
};

const TINTS = ["#e8f3ec", "#fdeee8", "#eef0fb", "#fbf3e3", "#f2ecf9"];

/** "Suggested destinations" list shown under the Where field, filtered as you type. */
export function DestinationList({ query, onPick }: { query: string; onPick: (place: string) => void }) {
  const [items, setItems] = useState<Destination[]>([]);

  useEffect(() => {
    const t = setTimeout(() => api.destinations(query).then(setItems).catch(() => setItems([])), 150);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div>
      {!query && <p className="px-4 pb-2 text-xs font-medium text-fg-secondary">Suggested destinations</p>}
      {!query && (
        <button
          type="button"
          onClick={() => onPick("")}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-2 text-left hover:bg-bg-hover"
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#e8f0fb] text-[#2b5fb4]">
            <Navigation size={22} />
          </span>
          <span>
            <span className="block text-[15px]">Nearby</span>
            <span className="block text-sm text-fg-secondary">Find what&apos;s around you</span>
          </span>
        </button>
      )}
      {items.map((d, i) => (
        <button
          type="button"
          key={`${d.city}-${d.state}`}
          onClick={() => onPick(`${d.city}, ${d.state}`)}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-2 text-left hover:bg-bg-hover"
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-[#3b3b3b]" style={{ background: TINTS[i % TINTS.length] }}>
            <MapPin size={22} />
          </span>
          <span>
            <span className="block text-[15px]">
              {d.city}, {d.state}
            </span>
            <span className="block text-sm text-fg-secondary">{BLURBS[d.city] ?? `${d.count} stays`}</span>
          </span>
        </button>
      ))}
      {query && items.length === 0 && <p className="px-4 py-2 text-sm text-fg-secondary">No matching destinations yet.</p>}
    </div>
  );
}

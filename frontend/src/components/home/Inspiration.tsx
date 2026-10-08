"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// [place, kind of rental]. Places we have listings for link to a real search.
const TABS: Record<string, [string, string][]> = {
  Popular: [
    ["Goa", "Villa rentals"], ["Manali", "Cabin rentals"], ["Jaipur", "Holiday rentals"], ["Udaipur", "Villa rentals"],
    ["Mumbai", "Flat rentals"], ["Bengaluru", "Flat rentals"], ["Lonavala", "Villa rentals"], ["Coorg", "Cottage rentals"],
    ["Rishikesh", "Holiday rentals"], ["Alappuzha", "House rentals"], ["Puducherry", "House rentals"], ["Shimla", "Cottage rentals"],
    ["Ooty", "Cottage rentals"], ["Mussoorie", "Holiday rentals"], ["Kasol", "Cabin rentals"], ["Munnar", "Cottage rentals"],
    ["Darjeeling", "Holiday rentals"], ["Gokarna", "Beach house rentals"],
  ],
  "Arts & culture": [
    ["Jaipur", "Haveli rentals"], ["Udaipur", "Holiday rentals"], ["Puducherry", "Holiday rentals"], ["Varanasi", "Holiday rentals"],
    ["Hampi", "Holiday rentals"], ["Kochi", "Flat rentals"], ["Jodhpur", "Holiday rentals"], ["Amritsar", "Flat rentals"],
    ["Kolkata", "Flat rentals"], ["Mysuru", "Holiday rentals"], ["Agra", "Holiday rentals"], ["Khajuraho", "Holiday rentals"],
  ],
  Beach: [
    ["Goa", "Beach house rentals"], ["Alappuzha", "Holiday rentals"], ["Puducherry", "Flat rentals"], ["Gokarna", "Holiday rentals"],
    ["Varkala", "Cottage rentals"], ["Kovalam", "Holiday rentals"], ["Mumbai", "Flat rentals"], ["Andaman Islands", "Villa rentals"],
    ["Alibaug", "Villa rentals"], ["Diu", "Holiday rentals"], ["Tarkarli", "Cottage rentals"], ["Mahabalipuram", "Holiday rentals"],
  ],
  Mountains: [
    ["Manali", "Cabin rentals"], ["Rishikesh", "Holiday rentals"], ["Coorg", "Cottage rentals"], ["Lonavala", "Villa rentals"],
    ["Shimla", "Cottage rentals"], ["Leh", "Holiday rentals"], ["Darjeeling", "Holiday rentals"], ["Nainital", "Cottage rentals"],
    ["Dharamshala", "Holiday rentals"], ["Gangtok", "Holiday rentals"], ["Kodaikanal", "Cottage rentals"], ["Auli", "Cabin rentals"],
  ],
  Outdoors: [
    ["Rishikesh", "Camp rentals"], ["Coorg", "Farm stay rentals"], ["Manali", "Cabin rentals"], ["Wayanad", "Treehouse rentals"],
    ["Jim Corbett", "Cottage rentals"], ["Spiti Valley", "Holiday rentals"], ["Kasol", "Cabin rentals"], ["Chikmagalur", "Farm stay rentals"],
    ["Pawna Lake", "Camp rentals"], ["Bir Billing", "Holiday rentals"], ["Ranthambore", "Holiday rentals"], ["Kabini", "Cottage rentals"],
  ],
  "Things to do": [
    ["Goa", "Beach rentals"], ["Mumbai", "City rentals"], ["Bengaluru", "City rentals"], ["Jaipur", "Holiday rentals"],
    ["Udaipur", "Lake rentals"], ["Manali", "Adventure rentals"], ["Rishikesh", "Rafting rentals"], ["Lonavala", "Weekend rentals"],
    ["New Delhi", "Flat rentals"], ["Hyderabad", "Flat rentals"], ["Chennai", "Flat rentals"], ["Pune", "Flat rentals"],
  ],
};

const LISTED = new Set(["Goa", "Manali", "Jaipur", "Udaipur", "Mumbai", "Bengaluru", "Lonavala", "Coorg", "Rishikesh", "Alappuzha", "Puducherry"]);

/** "Inspiration for future getaways": tabbed destination links above the footer, like airbnb.co.in. */
export function Inspiration() {
  const tabs = Object.keys(TABS);
  const [tab, setTab] = useState(tabs[0]);
  const [expanded, setExpanded] = useState(false);
  const items = TABS[tab];
  const visible = expanded ? items : items.slice(0, 17);

  return (
    <section className="bg-bg-secondary">
      <div className="mx-auto max-w-[1440px] px-6 pt-12 md:px-10 xl:px-12">
        <h2 className="mb-4 text-[22px] font-medium">Inspiration for future getaways</h2>
        <div role="tablist" className="no-scrollbar flex gap-8 overflow-x-auto border-b border-line">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setExpanded(false);
              }}
              className={clsx(
                "-mb-px shrink-0 border-b-2 pb-3 text-sm",
                tab === t ? "border-fg font-semibold text-fg" : "border-transparent text-fg-secondary hover:text-fg",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 py-8 text-sm md:grid-cols-4 lg:grid-cols-6">
          {visible.map(([place, kind]) => (
            <li key={place + kind}>
              <Link href={LISTED.has(place) ? `/s?location=${encodeURIComponent(place)}` : "/s"} className="block hover:underline">
                <span className="block truncate font-medium">{place}</span>
                <span className="block truncate text-fg-secondary">{kind}</span>
              </Link>
            </li>
          ))}
          {!expanded && items.length > visible.length && (
            <li>
              <button onClick={() => setExpanded(true)} className="flex items-center gap-1 font-semibold">
                Show more <ChevronDown size={16} />
              </button>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

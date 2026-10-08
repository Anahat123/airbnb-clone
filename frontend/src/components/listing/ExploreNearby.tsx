import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { Destination, ListingDetail } from "@/lib/types";

/**
 * Bottom of the listing page, like airbnb.co.in: breadcrumb, nearby destinations,
 * and links to other kinds of stays. Full-bleed grey band.
 */
export function ExploreNearby({ listing, destinations }: { listing: ListingDetail; destinations: Destination[] }) {
  const others = destinations.filter((d) => d.city !== listing.city).slice(0, 9);
  const type = listing.property_type;
  // Places like Goa are both the city and the state, so drop repeated entries.
  const unique = <T extends [string, string]>(items: T[]) => items.filter(([label], i) => items.findIndex(([l]) => l === label) === i);
  const crumbs: [string, string][] = unique([
    ["Airbnb", "/"],
    [listing.country, "/s"],
    [listing.state, `/s?location=${encodeURIComponent(listing.state)}`],
    [listing.city, `/s?location=${encodeURIComponent(listing.city)}`],
  ]);
  const stays: [string, string][] = unique([
    [`${listing.city} holiday rentals`, `/s?location=${encodeURIComponent(listing.city)}`],
    [`${listing.city} monthly stays`, `/s?location=${encodeURIComponent(listing.city)}`],
    [`${type} holiday rentals in ${listing.city}`, `/s?location=${encodeURIComponent(listing.city)}&property_types=${encodeURIComponent(type)}`],
    [`${type} holiday rentals in ${listing.state}`, `/s?location=${encodeURIComponent(listing.state)}&property_types=${encodeURIComponent(type)}`],
    [`${type} holiday rentals in ${listing.country}`, `/s?property_types=${encodeURIComponent(type)}`],
  ]);

  return (
    <section className="relative left-1/2 mt-4 w-screen -translate-x-1/2 bg-bg-secondary">
      <div className="mx-auto max-w-[1120px] px-6 md:px-10 xl:px-0">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 border-b border-line-light py-8 text-sm">
          {crumbs.map(([label, href], i) => (
            <span key={label} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={12} className="text-fg-secondary" />}
              <Link href={href} className="hover:underline">
                {label}
              </Link>
            </span>
          ))}
        </nav>

        {others.length > 0 && (
          <div className="pt-10">
            <h2 className="mb-8 text-[22px] font-medium">Explore other options in and around {listing.city}</h2>
            <ul className="grid gap-x-6 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
              {others.map((d) => (
                <li key={d.city}>
                  <Link href={`/s?location=${encodeURIComponent(d.city)}`} className="block hover:underline">
                    <span className="block font-medium">{d.city}</span>
                    <span className="block text-fg-secondary">Holiday rentals</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pb-14 pt-12">
          <h2 className="mb-8 text-[22px] font-medium">Other types of stays on Airbnb</h2>
          <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
            {stays.map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="font-medium hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

"use client";

import { LocationMap } from "@/components/map";
import type { ListingDetail } from "@/lib/types";

export function LocationSection({ listing }: { listing: ListingDetail }) {
  return (
    <section className="border-t border-line-light py-12">
      <h2 className="mb-6 text-[22px] font-semibold">Where you&apos;ll be</h2>
      <div className="h-[320px] overflow-hidden rounded-xl md:h-[480px]">
        <LocationMap lat={listing.latitude} lng={listing.longitude} approximate />
      </div>
      <p className="mt-6 font-semibold">
        {listing.city}, {listing.state}, {listing.country}
      </p>
      <p className="mt-2 text-fg-secondary">Exact location is provided after booking.</p>
    </section>
  );
}

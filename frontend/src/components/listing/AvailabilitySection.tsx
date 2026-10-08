"use client";

import { Calendar } from "@/components/ui/Calendar";
import { plural, shortRange } from "@/lib/format";

import { useBooking } from "./BookingContext";

/** "5 nights in Goa" inline calendar, synced with the booking card. */
export function AvailabilitySection() {
  const { listing, availability, checkIn, checkOut, setDates, quote } = useBooking();
  const nights = quote?.nights;
  return (
    <section id="availability" className="border-t border-line-light py-12">
      <h2 className="text-[22px] font-medium">
        {checkIn && checkOut && nights ? `${plural(nights, "night")} in ${listing.city}` : checkIn ? "Select checkout date" : "Select check-in date"}
      </h2>
      <p className="mb-8 text-sm text-fg-secondary">
        {checkIn && checkOut ? shortRange(checkIn, checkOut) : `Add your travel dates for exact pricing · ${plural(listing.min_nights, "night")} minimum`}
      </p>
      <Calendar checkIn={checkIn} checkOut={checkOut} booked={availability.booked} minNights={listing.min_nights} onChange={setDates} />
      <div className="mt-4 flex justify-end">
        <button className="rounded-lg px-2 py-1 text-sm font-semibold underline hover:bg-bg-hover" onClick={() => setDates(null, null)}>
          Clear dates
        </button>
      </div>
    </section>
  );
}

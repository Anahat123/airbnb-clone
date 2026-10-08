"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Flag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { GuestsPicker } from "@/components/search/GuestsPicker";
import { Calendar } from "@/components/ui/Calendar";
import { Button } from "@/components/ui/primitives";
import { money, parseDay, plural, shortRange } from "@/lib/format";
import { guestLabel } from "@/lib/search";

import { useBooking } from "./BookingContext";
import { PriceBreakdown } from "./PriceBreakdown";

const fmt = (d: string | null) => (d ? format(parseDay(d)!, "dd/MM/yyyy") : "Add date");

function useClickAway(ref: React.RefObject<HTMLElement | null>, onAway: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onAway();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onAway]);
}

/** Sticky "Reserve" card on the right of the listing page. */
export function BookingCard() {
  const { listing, availability, checkIn, checkOut, guests, setDates, setGuests, quote, quoteLoading, checkoutHref } = useBooking();
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [panel, setPanel] = useState<"dates" | "guests" | null>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);
  useClickAway(datesRef, () => panel === "dates" && setPanel(null));
  useClickAway(guestsRef, () => panel === "guests" && setPanel(null));

  const ownListing = user?.id === listing.host.id;
  const allowPets = listing.amenities.some((a) => a.name === "Pets allowed");
  const unavailable = quote && !quote.available;

  return (
    <div>
      <div className="rounded-xl border border-line-light p-6 shadow-card">
        {quote && checkIn && checkOut ? (
          <p className="mb-6">
            <span className="text-[22px] font-semibold underline">{money(quote.total)}</span>{" "}
            <span className="text-fg-secondary">for {plural(quote.nights, "night")}</span>
          </p>
        ) : (
          <p className="mb-6 text-[22px] font-semibold">
            Add dates for prices
            <span className="ml-2 text-base font-normal text-fg-secondary">{money(listing.price_per_night)} night</span>
          </p>
        )}

        <div className="relative rounded-lg border border-line">
          <div ref={datesRef}>
            <button type="button" onClick={() => setPanel(panel === "dates" ? null : "dates")} className="grid w-full grid-cols-2 text-left">
              <span className="border-r border-line px-3 py-2.5">
                <span className="block text-[10px] font-bold uppercase">Check-in</span>
                <span className={clsx("text-sm", !checkIn && "text-fg-secondary")}>{fmt(checkIn)}</span>
              </span>
              <span className="px-3 py-2.5">
                <span className="block text-[10px] font-bold uppercase">Checkout</span>
                <span className={clsx("text-sm", !checkOut && "text-fg-secondary")}>{fmt(checkOut)}</span>
              </span>
            </button>
            {panel === "dates" && (
              <div className="absolute -right-6 -top-6 z-[60] w-[min(680px,90vw)] rounded-2xl bg-bg-elevated p-8 shadow-pop">
                <div className="mb-6 flex justify-between gap-6">
                  <div>
                    <h3 className="text-[22px] font-semibold">
                      {checkIn && checkOut ? plural(quote?.nights ?? 0, "night") : checkIn ? "Select checkout date" : "Select dates"}
                    </h3>
                    <p className="text-sm text-fg-secondary">
                      {checkIn && checkOut ? shortRange(checkIn, checkOut) : `Minimum stay: ${plural(listing.min_nights, "night")}`}
                    </p>
                  </div>
                  <div className="grid h-14 w-[300px] grid-cols-2 rounded-lg border border-line text-left">
                    <span className="border-r border-line px-3 py-2">
                      <span className="block text-[10px] font-bold uppercase">Check-in</span>
                      <span className="text-sm">{fmt(checkIn)}</span>
                    </span>
                    <span className="px-3 py-2">
                      <span className="block text-[10px] font-bold uppercase">Checkout</span>
                      <span className="text-sm">{fmt(checkOut)}</span>
                    </span>
                  </div>
                </div>
                <Calendar
                  checkIn={checkIn}
                  checkOut={checkOut}
                  booked={availability.booked}
                  minNights={listing.min_nights}
                  onChange={(a, b) => {
                    setDates(a, b);
                    if (a && b) setPanel(null);
                  }}
                />
                <div className="mt-6 flex justify-end gap-4">
                  <button className="rounded-lg px-3 py-2 text-sm font-semibold underline hover:bg-bg-hover" onClick={() => setDates(null, null)}>
                    Clear dates
                  </button>
                  <Button onClick={() => setPanel(null)}>Close</Button>
                </div>
              </div>
            )}
          </div>

          <div ref={guestsRef} className="relative border-t border-line">
            <button type="button" onClick={() => setPanel(panel === "guests" ? null : "guests")} className="flex w-full items-center justify-between px-3 py-2.5 text-left">
              <span>
                <span className="block text-[10px] font-bold uppercase">Guests</span>
                <span className="text-sm">{guestLabel(guests)}</span>
              </span>
              {panel === "guests" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {panel === "guests" && (
              <div className="absolute inset-x-0 top-full z-[60] rounded-lg bg-bg-elevated px-4 py-2 shadow-pop">
                <GuestsPicker value={guests} onChange={(g) => setGuests({ ...g, adults: Math.max(1, g.adults) })} maxGuests={listing.max_guests} allowPets={allowPets} />
                <div className="flex justify-end pb-2">
                  <button className="rounded-lg px-3 py-2 font-semibold underline hover:bg-bg-hover" onClick={() => setPanel(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {unavailable && <p className="mt-4 text-sm text-error">Those dates are not available. Please choose different dates.</p>}

        {ownListing ? (
          <Link href={`/host/listings/${listing.id}/edit`} className="mt-4 flex h-12 items-center justify-center rounded-full border border-fg font-semibold">
            This is your listing · Edit
          </Link>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="mt-4 w-full !rounded-full"
            loading={quoteLoading}
            disabled={!!unavailable}
            onClick={() => (checkoutHref ? router.push(checkoutHref) : setPanel("dates"))}
          >
            {checkIn && checkOut ? "Reserve" : "Check availability"}
          </Button>
        )}

        {quote && checkIn && checkOut && !unavailable && (
          <>
            <p className="mt-3 text-center text-sm text-fg-secondary">You won&apos;t be charged yet</p>
            <div className="mt-6">
              <PriceBreakdown q={quote} />
            </div>
          </>
        )}
      </div>
      <button
        onClick={() => toast({ message: "Thanks, our team will review this listing." })}
        className="mx-auto mt-6 flex items-center gap-3 text-sm text-fg-secondary underline"
      >
        <Flag size={14} /> Report this listing
      </button>
    </div>
  );
}

/** Fixed footer with price and Reserve button, shown on phones instead of the card. */
export function MobileBookingBar() {
  const { listing, checkIn, checkOut, quote, checkoutHref } = useBooking();
  const router = useRouter();
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1100] flex items-center justify-between border-t border-line-light bg-bg px-6 py-3 md:hidden">
      <div className="text-sm">
        {quote && checkIn && checkOut ? (
          <>
            <span className="font-semibold underline">{money(quote.total)}</span> for {plural(quote.nights, "night")}
            <div className="text-xs underline">{shortRange(checkIn, checkOut)}</div>
          </>
        ) : (
          <>
            <span className="font-semibold">{money(listing.price_per_night)}</span> night
            <div className="text-xs text-fg-secondary">Add dates for total</div>
          </>
        )}
      </div>
      <Button
        variant="primary"
        size="lg"
        className="!rounded-full"
        onClick={() => (checkoutHref ? router.push(checkoutHref) : document.getElementById("availability")?.scrollIntoView({ behavior: "smooth" }))}
      >
        {checkoutHref ? "Reserve" : "Check availability"}
      </Button>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, RatingStar } from "@/components/ui/primitives";
import { money, plural, rating } from "@/lib/format";

import { useBooking } from "./BookingContext";

const SECTIONS = [
  ["photos", "Photos"],
  ["amenities", "Amenities"],
  ["reviews", "Reviews"],
  ["location", "Location"],
] as const;

/**
 * Airbnb's sticky bar on the listing page: section links once the photos scroll away,
 * plus price and Reserve once the booking card has scrolled out of view.
 */
export function ListingNav() {
  const { listing, quote, checkIn, checkOut, checkoutHref } = useBooking();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [showReserve, setShowReserve] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const photos = document.getElementById("photos");
      const reviews = document.getElementById("reviews");
      setVisible(!!photos && photos.getBoundingClientRect().bottom < 0);
      setShowReserve(!!reviews && reviews.getBoundingClientRect().top < window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
  };

  return (
    <div
      className={clsx(
        "fixed inset-x-0 top-0 z-[1050] hidden border-b border-line-light bg-bg transition-opacity md:block",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between px-10 xl:px-0">
        <nav className="flex h-full gap-6 text-sm font-medium">
          {SECTIONS.map(([id, label]) => (
            <button key={id} onClick={() => goTo(id)} className="h-full border-b-4 border-transparent pt-1 hover:border-fg">
              {label}
            </button>
          ))}
        </nav>
        {showReserve && (
          <div className="flex items-center gap-6">
            <div className="text-sm">
              {quote && checkIn && checkOut ? (
                <>
                  <span className="text-base font-semibold underline">{money(quote.total)}</span>
                  <span className="block">for {plural(quote.nights, "night")}</span>
                </>
              ) : (
                <>
                  <span className="text-base font-semibold">{money(listing.total_price ?? listing.price_per_night)}</span>
                  <span className="block">for 1 night</span>
                </>
              )}
              {listing.average_rating && (
                <span className="flex items-center gap-1 text-xs">
                  <RatingStar size={10} /> {rating(listing.average_rating)} ·{" "}
                  <span className="text-fg-secondary">{plural(listing.review_count, "review")}</span>
                </span>
              )}
            </div>
            <Button
              variant="primary"
              size="lg"
              className="!rounded-full px-12"
              onClick={() => (checkoutHref ? router.push(checkoutHref) : goTo("availability"))}
            >
              {checkoutHref ? "Reserve" : "Check availability"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

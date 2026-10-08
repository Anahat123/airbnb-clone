"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { RatingStar } from "@/components/ui/primitives";
import { imageUrl, listingHeadline, money, plural, rating, shortRange } from "@/lib/format";
import type { ListingCard as Listing } from "@/lib/types";

import { HeartButton } from "./HeartButton";

/** The very best-rated homes get a trophy, like Airbnb's top-percentile Guest favourites. */
const isTopRated = (l: Listing) => (l.average_rating ?? 0) >= 4.95 && l.review_count >= 10;

function GuestFavouriteBadge({ small = false, trophy = false }: { small?: boolean; trophy?: boolean }) {
  return (
    <span
      className={clsx(
        "absolute rounded-full bg-white/95 font-semibold text-[#222] shadow-sm",
        small ? "left-2 top-2 px-2 py-0.5 text-[11px]" : "left-3 top-3 px-2.5 py-1 text-[12px]",
      )}
    >
      {trophy && "🏆 "}Guest favourite
    </span>
  );
}

function Price({ listing, size }: { listing: Listing; size: "sm" | "md" }) {
  if (listing.total_price && listing.nights)
    return (
      <span>
        <span className={clsx(size === "md" && "font-medium text-fg underline")}>{money(listing.total_price)}</span>{" "}
        for {plural(listing.nights, "night")}
      </span>
    );
  return (
    <span>
      <span className="font-semibold text-fg">{money(listing.price_per_night)}</span> night
    </span>
  );
}

/** Small card used in the home page carousels. */
export function CompactListingCard({ listing, href }: { listing: Listing; href: string }) {
  return (
    <Link href={href} className="group block w-full" aria-label={listing.title}>
      <div className="relative aspect-[20/19] overflow-hidden rounded-[20px] bg-skeleton">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(listing.photos[0], 480)}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        {listing.is_guest_favourite && <GuestFavouriteBadge small />}
        <HeartButton listing={listing} className="absolute right-1.5 top-1.5" />
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="truncate text-[13px] font-medium leading-4">{listingHeadline(listing)}</h3>
        <p className="mt-0.5 text-[12px] leading-4 text-fg-secondary">
          <Price listing={listing} size="sm" />
          {listing.average_rating && (
            <>
              {" · "}
              <span className="inline-flex items-center gap-0.5 align-[-1px]">
                <RatingStar size={9} />
                {rating(listing.average_rating)}
              </span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

/** Search result card with a swipeable photo carousel, like airbnb.co.in/s/... */
export function ListingCard({
  listing,
  href,
  dates,
  onHover,
}: {
  listing: Listing;
  href: string;
  dates?: { checkIn: string; checkOut: string } | null;
  onHover?: (id: number | null) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const photos = listing.photos.slice(0, 5);

  function go(delta: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = track.current;
    if (!el) return;
    const next = Math.min(photos.length - 1, Math.max(0, index + delta));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  return (
    <Link
      href={href}
      className="group block"
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="relative overflow-hidden rounded-[20px] bg-skeleton">
        <div
          ref={track}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto"
        >
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src + i}
              src={imageUrl(src, 640)}
              alt={i === 0 ? listing.title : ""}
              loading="lazy"
              className="h-full w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>
        {listing.is_guest_favourite && <GuestFavouriteBadge trophy={isTopRated(listing)} />}
        <HeartButton listing={listing} className="absolute right-3 top-3" />
        {photos.length > 1 && (
          <>
            {index > 0 && (
              <button
                aria-label="Previous photo"
                onClick={(e) => go(-1, e)}
                className="absolute left-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#222] opacity-0 shadow transition hover:scale-105 group-hover:opacity-100 md:grid"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {index < photos.length - 1 && (
              <button
                aria-label="Next photo"
                onClick={(e) => go(1, e)}
                className="absolute right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#222] opacity-0 shadow transition hover:scale-105 group-hover:opacity-100 md:grid"
              >
                <ChevronRight size={16} />
              </button>
            )}
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              {photos.map((_, i) => (
                <span key={i} className={clsx("h-1.5 w-1.5 rounded-full bg-white", i === index ? "opacity-100" : "opacity-60")} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-3 space-y-0.5 text-[15px] leading-5">
        <div className="flex justify-between gap-2">
          <h3 className="truncate font-medium">{listingHeadline(listing)}</h3>
          <span className="flex shrink-0 items-center gap-1">
            <RatingStar size={12} />
            {listing.average_rating ? (
              <>
                {rating(listing.average_rating)} ({listing.review_count})
              </>
            ) : (
              "New"
            )}
          </span>
        </div>
        <p className="truncate text-fg-secondary">{listing.title}</p>
        <p className="truncate text-fg-secondary">
          {listing.bedrooms > 0 && `${plural(listing.bedrooms, "bedroom")} · `}
          {plural(listing.beds, "bed")} · {plural(listing.bathrooms, "bathroom")}
        </p>
        {dates && <p className="text-fg-secondary">{shortRange(dates.checkIn, dates.checkOut)}</p>}
        <p className="pt-1 text-fg-secondary">
          <Price listing={listing} size="md" />
        </p>
        {dates && (
          <span className="mt-1 inline-block rounded bg-bg-secondary px-1.5 py-0.5 text-xs text-fg-secondary">Free cancellation</span>
        )}
      </div>
    </Link>
  );
}

export function ListingCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <div className={clsx("skeleton rounded-[20px]", compact ? "aspect-[20/19]" : "aspect-[4/3]")} />
      <div className="mt-3 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        {!compact && <div className="skeleton h-4 w-1/3 rounded" />}
      </div>
    </div>
  );
}

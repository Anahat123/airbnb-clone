"use client";

import { isAfter, parseISO, startOfDay } from "date-fns";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button, Skeleton } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { imageUrl, shortRange } from "@/lib/format";
import type { Booking } from "@/lib/types";

import { ReviewModal } from "./ReviewModal";

function groupTrips(trips: Booking[]) {
  const today = startOfDay(new Date());
  const upcoming: Booking[] = [];
  const past: Booking[] = [];
  const cancelled: Booking[] = [];
  for (const t of trips) {
    if (t.status === "cancelled") cancelled.push(t);
    else if (isAfter(parseISO(t.check_out), today)) upcoming.push(t);
    else past.push(t);
  }
  upcoming.sort((a, b) => a.check_in.localeCompare(b.check_in));
  return { upcoming, past, cancelled };
}

function UpcomingCard({ trip }: { trip: Booking }) {
  const now = !isAfter(parseISO(trip.check_in), new Date());
  return (
    <Link href={`/trips/${trip.id}`} className="grid overflow-hidden rounded-2xl border border-line-light shadow-card transition hover:shadow-pop sm:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col justify-between p-6">
        <div>
          <h3 className="text-[22px] font-semibold">{trip.listing.city}</h3>
          <p className="text-sm text-fg-secondary">
            {trip.listing.property_type} hosted by {trip.listing.host_name}
          </p>
        </div>
        <div className="mt-6 flex gap-6 border-t border-line-light pt-4">
          <div className="text-center">
            <div className="text-sm font-semibold">{shortRange(trip.check_in, trip.check_out)}</div>
            <div className="text-xs text-fg-secondary">{parseISO(trip.check_in).getFullYear()}</div>
          </div>
          <div className="border-l border-line-light pl-6 text-sm">
            <div className="font-semibold">{trip.listing.title}</div>
            <div className="text-fg-secondary">
              {trip.listing.city}, {trip.listing.state}
            </div>
          </div>
        </div>
      </div>
      <div className="relative aspect-[4/3] sm:aspect-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl(trip.listing.photo ?? "", 700)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {now && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#222]">Happening now</span>}
      </div>
    </Link>
  );
}

function PastCard({ trip, onReview }: { trip: Booking; onReview?: (t: Booking) => void }) {
  return (
    <div className="flex items-center gap-4">
      <Link href={`/trips/${trip.id}`} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl(trip.listing.photo ?? "", 200)} alt="" className="h-16 w-16 rounded-lg object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/trips/${trip.id}`} className="block truncate font-semibold hover:underline">
          {trip.listing.city}
        </Link>
        <div className="truncate text-sm text-fg-secondary">Hosted by {trip.listing.host_name}</div>
        <div className="text-sm text-fg-secondary">{shortRange(trip.check_in, trip.check_out)}</div>
        {onReview && trip.can_review && (
          <button onClick={() => onReview(trip)} className="mt-1 text-sm font-semibold underline">
            Write a review
          </button>
        )}
        {trip.has_review && <div className="mt-1 text-xs text-success">✓ Reviewed</div>}
      </div>
    </div>
  );
}

export function TripsView() {
  const [trips, setTrips] = useState<Booking[] | null>(null);
  const [reviewing, setReviewing] = useState<Booking | null>(null);

  const load = useCallback(() => api.myTrips().then(setTrips).catch(() => setTrips([])), []);
  useEffect(() => {
    load();
  }, [load]);

  if (!trips)
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );

  const { upcoming, past, cancelled } = groupTrips(trips);
  const toReview = past.filter((t) => t.can_review);

  return (
    <div className="space-y-12">
      <h1 className="text-[32px] font-semibold">Trips</h1>

      {toReview.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-bg-secondary p-6">
          <div>
            <h2 className="font-semibold">How was your stay in {toReview[0].listing.city}?</h2>
            <p className="text-sm text-fg-secondary">Your review helps other guests and your host.</p>
          </div>
          <Button onClick={() => setReviewing(toReview[0])}>Write a review</Button>
        </div>
      )}

      <section>
        <h2 className="mb-6 text-[22px] font-semibold">Upcoming reservations</h2>
        {upcoming.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {upcoming.map((t) => (
              <UpcomingCard key={t.id} trip={t} />
            ))}
          </div>
        ) : (
          <div className="border-y border-line-light py-8">
            <h3 className="text-lg font-semibold">No trips booked... yet!</h3>
            <p className="mb-6 mt-1 text-fg-secondary">Time to dust off your bags and start planning your next adventure.</p>
            <Link href="/" className="inline-block rounded-lg border border-fg px-6 py-3 font-semibold hover:bg-bg-hover">
              Start searching
            </Link>
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-6 text-[22px] font-semibold">Where you&apos;ve been</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((t) => (
              <PastCard key={t.id} trip={t} onReview={setReviewing} />
            ))}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section>
          <h2 className="mb-6 text-[22px] font-semibold">Cancelled</h2>
          <div className="grid gap-6 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
            {cancelled.map((t) => (
              <PastCard key={t.id} trip={t} />
            ))}
          </div>
        </section>
      )}

      <ReviewModal
        booking={reviewing}
        onClose={() => setReviewing(null)}
        onDone={() => {
          setReviewing(null);
          load();
        }}
      />
    </div>
  );
}

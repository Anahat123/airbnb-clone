"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { readSearch, type Guests, searchToParams } from "@/lib/search";
import type { Availability, ListingDetail, Quote } from "@/lib/types";

interface BookingState {
  listing: ListingDetail;
  availability: Availability;
  checkIn: string | null;
  checkOut: string | null;
  guests: Guests;
  quote: Quote | null;
  quoteLoading: boolean;
  setDates: (checkIn: string | null, checkOut: string | null) => void;
  setGuests: (g: Guests) => void;
  /** URL of the checkout page for the current selection. */
  checkoutHref: string | null;
}

const BookingContext = createContext<BookingState | null>(null);

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}

/**
 * Shared state for the listing page: the inline calendar, the booking card and the
 * mobile footer all read and change the same dates/guests. Kept in the URL so a
 * shared link or a refresh keeps the selection.
 */
export function BookingProvider({
  listing,
  availability,
  children,
}: {
  listing: ListingDetail;
  availability: Availability;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initial = useMemo(() => readSearch(params), [params]);

  const [checkIn, setCheckIn] = useState(initial.checkIn);
  const [checkOut, setCheckOut] = useState(initial.checkOut);
  const [guests, setGuestsState] = useState<Guests>({
    adults: Math.max(1, initial.adults),
    children: initial.children,
    infants: initial.infants,
    pets: initial.pets,
  });
  // The quote is stored with the dates it was computed for, so a stale one is never shown.
  const [quoted, setQuoted] = useState<{ key: string; quote: Quote | null } | null>(null);
  const datesKey = checkIn && checkOut ? `${checkIn}|${checkOut}` : null;

  const syncUrl = useCallback(
    (ci: string | null, co: string | null, g: Guests) => {
      const qs = new URLSearchParams(searchToParams({ checkIn: ci, checkOut: co, ...g }));
      router.replace(`${pathname}?${qs}`, { scroll: false });
    },
    [pathname, router],
  );

  const setDates = useCallback(
    (ci: string | null, co: string | null) => {
      setCheckIn(ci);
      setCheckOut(co);
      if ((ci && co) || (!ci && !co)) syncUrl(ci, co, guests);
    },
    [guests, syncUrl],
  );

  const setGuests = useCallback(
    (g: Guests) => {
      setGuestsState(g);
      syncUrl(checkIn && checkOut ? checkIn : null, checkIn && checkOut ? checkOut : null, g);
    },
    [checkIn, checkOut, syncUrl],
  );

  // The server computes the price breakdown, so what's shown always matches what's charged.
  useEffect(() => {
    if (!datesKey) return;
    const [ci, co] = datesKey.split("|");
    let cancelled = false;
    api
      .quote(listing.id, ci, co)
      .then((q) => !cancelled && setQuoted({ key: datesKey, quote: q }))
      .catch(() => !cancelled && setQuoted({ key: datesKey, quote: null }));
    return () => {
      cancelled = true;
    };
  }, [listing.id, datesKey]);

  const quote = datesKey && quoted?.key === datesKey ? quoted.quote : null;
  const quoteLoading = datesKey !== null && quoted?.key !== datesKey;

  const checkoutHref =
    checkIn && checkOut && quote?.available
      ? `/book/${listing.id}?${new URLSearchParams(searchToParams({ checkIn, checkOut, ...guests }))}`
      : null;

  const value = useMemo(
    () => ({ listing, availability, checkIn, checkOut, guests, quote, quoteLoading, setDates, setGuests, checkoutHref }),
    [listing, availability, checkIn, checkOut, guests, quote, quoteLoading, setDates, setGuests, checkoutHref],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

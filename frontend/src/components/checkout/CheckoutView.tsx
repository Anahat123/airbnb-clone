"use client";

import clsx from "clsx";
import { ChevronLeft, CreditCard, Landmark, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PriceBreakdown } from "@/components/listing/PriceBreakdown";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { GuestsPicker } from "@/components/search/GuestsPicker";
import { Calendar } from "@/components/ui/Calendar";
import { Modal } from "@/components/ui/Modal";
import { Button, RatingStar, Skeleton } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import { imageUrl, listingHeadline, longDate, rating } from "@/lib/format";
import { guestLabel, readSearch, searchToParams, type Guests } from "@/lib/search";
import type { Availability, ListingDetail, Quote } from "@/lib/types";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: <Smartphone size={20} /> },
  { id: "card", label: "Credit or debit card", icon: <CreditCard size={20} /> },
  { id: "netbanking", label: "Net banking", icon: <Landmark size={20} /> },
];

/** "Confirm and pay": review dates/guests, pick a (mock) payment method, create the booking. */
export function CheckoutView({ listingId }: { listingId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading, openLogin } = useAuth();

  const initial = useMemo(() => readSearch(params), [params]);
  const [checkIn, setCheckIn] = useState(initial.checkIn);
  const [checkOut, setCheckOut] = useState(initial.checkOut);
  const [guests, setGuests] = useState<Guests>({ ...initial, adults: Math.max(1, initial.adults) });

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [quoted, setQuoted] = useState<{ key: string; quote: Quote | null } | null>(null);
  const datesKey = checkIn && checkOut ? `${checkIn}|${checkOut}` : null;
  const quote = datesKey && quoted?.key === datesKey ? quoted.quote : null;
  const [editing, setEditing] = useState<"dates" | "guests" | null>(null);
  const [draftDates, setDraftDates] = useState<[string | null, string | null]>([checkIn, checkOut]);
  const [payWith, setPayWith] = useState("upi");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.listing(listingId), api.availability(listingId)])
      .then(([l, a]) => {
        setListing(l);
        setAvailability(a);
      })
      .catch(() => toast({ message: "Couldn't load this listing" }));
  }, [listingId, toast]);

  useEffect(() => {
    if (!datesKey) return;
    const [ci, co] = datesKey.split("|");
    api
      .quote(listingId, ci, co)
      .then((q) => setQuoted({ key: datesKey, quote: q }))
      .catch(() => setQuoted({ key: datesKey, quote: null }));
  }, [listingId, datesKey]);

  // Keep the URL in step so a refresh shows the same trip.
  useEffect(() => {
    router.replace(`/book/${listingId}?${new URLSearchParams(searchToParams({ checkIn, checkOut, ...guests }))}`, { scroll: false });
  }, [listingId, checkIn, checkOut, guests, router]);

  async function confirm() {
    if (!user) return openLogin();
    if (!checkIn || !checkOut) return setEditing("dates");
    setSubmitting(true);
    try {
      const booking = await api.createBooking({
        listing_id: Number(listingId),
        check_in: checkIn,
        check_out: checkOut,
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
        pets: guests.pets,
      });
      toast({ message: "Your reservation is confirmed!", image: listing?.photos[0] && imageUrl(listing.photos[0], 200) });
      router.push(`/trips/${booking.id}?confirmed=1`);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Booking failed";
      toast({ message });
      if (e instanceof ApiError && e.status === 409) {
        // Someone else took the dates: refresh the calendar and ask for new dates.
        api.availability(listingId).then(setAvailability);
        setEditing("dates");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!listing || !availability)
    return (
      <div className="grid gap-16 pt-10 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );

  const allowPets = listing.amenities.some((a) => a.name === "Pets allowed");
  const card = "rounded-xl border border-line p-6";

  return (
    <div className="pb-16 pt-6 md:pt-12">
      <div className="mb-8 flex items-center gap-4 md:-ml-14">
        <Link href={`/rooms/${listing.id}?${new URLSearchParams(searchToParams({ checkIn, checkOut, ...guests }))}`} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full hover:bg-bg-hover">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[26px] font-medium md:text-[32px]">Confirm and pay</h1>
      </div>

      <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-24">
        <div className="space-y-4 md:order-1">
          {!user && !authLoading && (
            <section className={card}>
              <h2 className="text-lg font-semibold">1. Log in or sign up</h2>
              <p className="mt-1 text-sm text-fg-secondary">You need an account to book this place.</p>
              <Button className="mt-4" onClick={openLogin}>
                Continue
              </Button>
            </section>
          )}

          <section className={card}>
            <h2 className="mb-4 text-lg font-semibold">{user ? "1." : "2."} Choose when to pay</h2>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-fg p-4">
              <span>
                <span className="block font-semibold">Pay {quote ? `₹${quote.total.toLocaleString("en-IN")}` : ""} now</span>
                <span className="text-sm text-fg-secondary">Pay the total now and you&apos;re all set.</span>
              </span>
              <input type="radio" defaultChecked name="when" className="h-5 w-5 accent-fg" />
            </label>
          </section>

          <section className={card}>
            <h2 className="mb-1 text-lg font-semibold">{user ? "2." : "3."} Add a payment method</h2>
            <p className="mb-4 text-sm text-fg-secondary">Payments are simulated in this demo: no money moves and no card details are collected.</p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPayWith(m.id)}
                  className={clsx("flex w-full items-center gap-4 rounded-lg border p-4 text-left", payWith === m.id ? "border-fg ring-1 ring-fg" : "border-line")}
                >
                  {m.icon}
                  <span className="flex-1 font-medium">{m.label}</span>
                  <span className={clsx("h-5 w-5 rounded-full border", payWith === m.id ? "border-[6px] border-fg" : "border-line")} />
                </button>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-2 text-lg font-semibold">{user ? "3." : "4."} Review your reservation</h2>
            <p className="mb-6 text-xs text-fg-secondary">
              By selecting the button, I agree to the booking terms and the host&apos;s house rules. Free cancellation before check-in.
            </p>
            <Button variant="primary" size="lg" className="w-full md:w-auto" loading={submitting} disabled={!quote?.available} onClick={confirm}>
              {user ? "Confirm and pay" : "Log in to book"}
            </Button>
            {quote && !quote.available && <p className="mt-3 text-sm text-error">These dates are no longer available. Change your dates to continue.</p>}
          </section>
        </div>

        <aside className="md:order-2">
          <div className={clsx(card, "sticky top-28")}>
            <div className="flex gap-4 border-b border-line-light pb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(listing.photos[0], 300)} alt="" className="h-24 w-28 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <h3 className="font-semibold leading-5">{listing.title}</h3>
                <p className="text-sm text-fg-secondary">{listingHeadline(listing)}</p>
                {listing.average_rating && (
                  <p className="mt-1 flex items-center gap-1 text-sm">
                    <RatingStar size={12} /> {rating(listing.average_rating)} ({listing.review_count}){listing.is_guest_favourite && " · Guest favourite"}
                  </p>
                )}
              </div>
            </div>
            <div className="border-b border-line-light py-6 text-sm">
              <p className="font-semibold">Free cancellation</p>
              <p className="text-fg-secondary">Cancel before check-in for a full refund.</p>
            </div>
            <div className="space-y-4 border-b border-line-light py-6">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">Dates</div>
                  <div className="text-fg-secondary">{checkIn && checkOut ? `${longDate(checkIn)} – ${longDate(checkOut)}` : "Add dates"}</div>
                </div>
                <button className="h-fit rounded-lg bg-bg-secondary px-4 py-2 text-sm font-semibold hover:bg-line-light" onClick={() => { setDraftDates([checkIn, checkOut]); setEditing("dates"); }}>
                  Change
                </button>
              </div>
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">Guests</div>
                  <div className="text-fg-secondary">{guestLabel(guests)}</div>
                </div>
                <button className="h-fit rounded-lg bg-bg-secondary px-4 py-2 text-sm font-semibold hover:bg-line-light" onClick={() => setEditing("guests")}>
                  Change
                </button>
              </div>
            </div>
            <div className="pt-6">
              <h3 className="mb-4 font-semibold">Price details</h3>
              {quote ? <PriceBreakdown q={quote} totalLabel="Total INR" /> : <p className="text-sm text-fg-secondary">Add dates to see the total.</p>}
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={editing === "dates"}
        onClose={() => setEditing(null)}
        size="lg"
        title="Change dates"
        footer={
          <div className="flex justify-between">
            <button className="font-semibold underline" onClick={() => setDraftDates([null, null])}>
              Clear dates
            </button>
            <Button
              disabled={!draftDates[0] || !draftDates[1]}
              onClick={() => {
                setCheckIn(draftDates[0]);
                setCheckOut(draftDates[1]);
                setEditing(null);
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <Calendar
          checkIn={draftDates[0]}
          checkOut={draftDates[1]}
          booked={availability.booked}
          minNights={listing.min_nights}
          onChange={(a, b) => setDraftDates([a, b])}
        />
      </Modal>

      <Modal open={editing === "guests"} onClose={() => setEditing(null)} size="sm" title="Change guests" footer={<Button className="w-full" onClick={() => setEditing(null)}>Save</Button>}>
        <GuestsPicker value={guests} onChange={(g) => setGuests({ ...g, adults: Math.max(1, g.adults) })} maxGuests={listing.max_guests} allowPets={allowPets} />
      </Modal>
    </div>
  );
}

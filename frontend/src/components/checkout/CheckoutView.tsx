"use client";

import clsx from "clsx";
import { format, parseISO, subDays } from "date-fns";
import { ArrowLeft, CreditCard, Landmark, Smartphone } from "lucide-react";
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
import { imageUrl, plural, rating, shortRange } from "@/lib/format";
import { readSearch, searchToParams, type Guests } from "@/lib/search";
import type { Availability, ListingDetail, Quote } from "@/lib/types";

type Step = "login" | "payment" | "review";

const money2 = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

/** "1 adult, 2 children, 1 infant", like Airbnb's checkout. */
function guestSummary(g: Guests) {
  const parts = [plural(Math.max(1, g.adults), "adult")];
  if (g.children) parts.push(plural(g.children, "child", "children"));
  if (g.infants) parts.push(plural(g.infants, "infant"));
  if (g.pets) parts.push(plural(g.pets, "pet"));
  return parts.join(", ");
}

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
  const [step, setStep] = useState<Step>("payment");
  const [breakdownOpen, setBreakdownOpen] = useState(false);
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

  // Airbnb-style stepper: one step open at a time, finished steps collapse with a summary.
  const steps: Step[] = user ? ["payment", "review"] : ["login", "payment", "review"];
  const current: Step = !user ? "login" : step === "login" ? "payment" : step;
  const method = PAYMENT_METHODS.find((m) => m.id === payWith)!;
  const deadline = checkIn ? format(subDays(parseISO(checkIn), 1), "d MMMM") : null;

  const stepCard = (id: Step, title: string, body: React.ReactNode, summary?: React.ReactNode, action?: React.ReactNode) => {
    const n = steps.indexOf(id) + 1;
    const active = current === id;
    const done = steps.indexOf(id) < steps.indexOf(current);
    return (
      <section
        key={id}
        className={clsx(
          "rounded-3xl border p-8 transition",
          active ? "border-transparent shadow-[0_6px_20px_rgb(0_0_0/0.12)]" : "border-line",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className={clsx("text-[22px] font-medium", !active && !done && "text-fg")}>
              {n}. {title}
            </h2>
            {done && summary && <div className="mt-1 text-fg-secondary">{summary}</div>}
          </div>
          {active && action}
          {done && (
            <button onClick={() => setStep(id)} className="rounded-lg bg-[#f2f2f2] px-4 py-2 text-sm font-medium text-[#222] hover:bg-[#ebebeb]">
              Change
            </button>
          )}
        </div>
        {active && body}
      </section>
    );
  };

  const changeButton = "h-fit rounded-lg bg-[#f2f2f2] px-4 py-2 text-sm font-medium text-[#222] hover:bg-[#ebebeb] dark:bg-bg-secondary dark:text-fg";

  return (
    <div className="pb-16 pt-6 md:pt-10">
      <div className="mb-8 flex items-center gap-6 md:-ml-24">
        <Link
          href={`/rooms/${listing.id}?${new URLSearchParams(searchToParams({ checkIn, checkOut, ...guests }))}`}
          aria-label="Back"
          className="grid h-14 w-14 place-items-center rounded-full bg-[#f7f7f7] text-[#222] hover:bg-[#ebebeb] dark:bg-bg-secondary dark:text-fg"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-[32px] font-semibold tracking-tight md:text-[40px]">Confirm and pay</h1>
      </div>

      <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-28">
        <div className="space-y-6 md:order-1">
          {!user &&
            stepCard(
              "login",
              "Log in or sign up",
              null,
              undefined,
              <Button variant="primary" size="lg" className="!rounded-xl px-8" onClick={openLogin} disabled={authLoading}>
                Continue
              </Button>,
            )}

          {stepCard(
            "payment",
            "Add a payment method",
            <div className="mt-6">
              <p className="mb-4 text-sm text-fg-secondary">Payments are simulated in this demo: no money moves and no card details are collected.</p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPayWith(m.id)}
                    className={clsx("flex w-full items-center gap-4 rounded-xl border p-4 text-left", payWith === m.id ? "border-fg ring-1 ring-fg" : "border-line")}
                  >
                    {m.icon}
                    <span className="flex-1 font-medium">{m.label}</span>
                    <span className={clsx("h-5 w-5 rounded-full border", payWith === m.id ? "border-[6px] border-fg" : "border-line")} />
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button size="lg" className="!rounded-xl px-8" onClick={() => setStep("review")}>
                  Next
                </Button>
              </div>
            </div>,
            <span className="flex items-center gap-2">
              {method.icon} {method.label}
            </span>,
          )}

          {stepCard(
            "review",
            "Review your reservation",
            <div className="mt-4">
              <p className="mb-6 text-sm text-fg-secondary">
                By selecting the button, I agree to the booking terms and the host&apos;s house rules.{" "}
                {deadline && `Free cancellation before 1:00 pm on ${deadline}.`}
              </p>
              <Button variant="primary" size="lg" className="w-full !rounded-xl" loading={submitting} disabled={!quote?.available} onClick={confirm}>
                Confirm and pay
              </Button>
              {quote && !quote.available && (
                <p className="mt-3 text-sm text-error">These dates are no longer available. Change your dates to continue.</p>
              )}
            </div>,
          )}
        </div>

        <aside className="md:order-2">
          <div className="sticky top-28 rounded-3xl border border-line p-8">
            <div className="flex items-center gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(listing.photos[0], 300)} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
                <h3 className="text-lg font-medium leading-6">{listing.title}</h3>
                {listing.average_rating && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                    <span className="flex items-center gap-1">
                      <RatingStar size={12} /> {rating(listing.average_rating)} ({listing.review_count})
                    </span>
                    {listing.is_guest_favourite && <span className="font-medium">🏆 Guest favourite</span>}
                  </p>
                )}
              </div>
            </div>

            <div className="border-b border-line-light py-6">
              <p className="font-medium">Free cancellation</p>
              <p>
                {deadline ? `Cancel before 1:00 pm on ${deadline} for a full refund. ` : "Cancel before check-in for a full refund. "}
                <Link href="/help" className="font-medium underline">
                  Full policy
                </Link>
              </p>
            </div>
            <div className="flex items-start justify-between border-b border-line-light py-6">
              <div>
                <div className="font-medium">Dates</div>
                <div>{checkIn && checkOut ? shortRange(checkIn, checkOut) + " " + format(parseISO(checkOut), "yyyy") : "Add dates"}</div>
              </div>
              <button className={changeButton} onClick={() => { setDraftDates([checkIn, checkOut]); setEditing("dates"); }}>
                Change
              </button>
            </div>
            <div className="flex items-start justify-between border-b border-line-light py-6">
              <div>
                <div className="font-medium">Guests</div>
                <div>{guestSummary(guests)}</div>
              </div>
              <button className={changeButton} onClick={() => setEditing("guests")}>
                Change
              </button>
            </div>
            <div className="pt-6">
              <h3 className="mb-4 font-medium">Price details</h3>
              {quote ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{plural(quote.nights, "night")} x {money2(quote.nightly_rate)}</span>
                      <span>{money2(quote.subtotal)}</span>
                    </div>
                    {quote.cleaning_fee > 0 && (
                      <div className="flex justify-between">
                        <span>Cleaning fee</span>
                        <span>{money2(quote.cleaning_fee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Airbnb service fee</span>
                      <span>{money2(quote.service_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span>{money2(quote.taxes)}</span>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-between border-t border-line-light pt-5 font-medium">
                    <span>
                      Total <span className="underline">INR</span>
                    </span>
                    <span>{money2(quote.total)}</span>
                  </div>
                  <button onClick={() => setBreakdownOpen(true)} className="mt-4 font-medium underline">
                    Price breakdown
                  </button>
                </>
              ) : (
                <p className="text-sm text-fg-secondary">Add dates to see the total.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <Modal open={breakdownOpen} onClose={() => setBreakdownOpen(false)} title="Price breakdown" size="sm">
        {quote && <PriceBreakdown q={quote} totalLabel="Total INR" />}
        <p className="mt-6 text-sm text-fg-secondary">
          The service fee helps Airbnb run the platform. Taxes are calculated on the nightly price plus cleaning fee. The host sets the
          nightly price and cleaning fee.
        </p>
      </Modal>

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

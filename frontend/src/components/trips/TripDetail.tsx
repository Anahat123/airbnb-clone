"use client";

import { format, isAfter, parseISO, startOfDay } from "date-fns";
import { CircleCheck, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { PriceBreakdown } from "@/components/listing/PriceBreakdown";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Button, Skeleton } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { imageUrl, plural } from "@/lib/format";
import type { Booking } from "@/lib/types";

import { ReviewModal } from "./ReviewModal";

/** Reservation details; doubles as the booking confirmation page (?confirmed=1). */
export function TripDetail({ id }: { id: string }) {
  const params = useSearchParams();
  const toast = useToast();
  const [trip, setTrip] = useState<Booking | null>(null);
  const [missing, setMissing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(() => api.booking(id).then(setTrip).catch(() => setMissing(true)), [id]);
  useEffect(() => {
    load();
  }, [load]);

  if (missing) return <p className="py-16 text-lg">We couldn&apos;t find that reservation.</p>;
  if (!trip) return <Skeleton className="mt-10 h-96 rounded-2xl" />;

  const upcoming = trip.status === "confirmed" && isAfter(parseISO(trip.check_in), startOfDay(new Date()));
  const justBooked = params.get("confirmed") === "1";

  async function cancel() {
    setCancelling(true);
    try {
      setTrip(await api.cancelBooking(trip!.id));
      toast({ message: "Your reservation has been cancelled" });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Couldn't cancel" });
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  }

  const day = (d: string) => format(parseISO(d), "EEE, d MMM yyyy");

  return (
    <div className="grid gap-10 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div>
        {justBooked && trip.status === "confirmed" && (
          <div className="mb-8 flex items-start gap-4 rounded-2xl bg-[#e9f7ef] p-6 text-[#0b5d2a] dark:bg-[#12301f] dark:text-[#8fe3b0]">
            <CircleCheck className="shrink-0" />
            <div>
              <h2 className="text-lg font-semibold">Your reservation is confirmed</h2>
              <p>You&apos;re going to {trip.listing.city}! We&apos;ve blocked these dates on the listing.</p>
            </div>
          </div>
        )}
        <div className="overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(trip.listing.photo ?? "", 1100)} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
        <h1 className="mt-6 text-[26px] font-semibold">
          {trip.status === "cancelled" ? "Cancelled: " : ""}
          {trip.listing.title}
        </h1>
        <p className="text-fg-secondary">
          {trip.listing.property_type} in {trip.listing.city}, {trip.listing.state} · Hosted by {trip.listing.host_name}
        </p>

        <div className="mt-8 grid grid-cols-2 rounded-xl border border-line">
          <div className="border-r border-line p-4">
            <div className="text-sm font-semibold">Check-in</div>
            <div>{day(trip.check_in)}</div>
            <div className="text-sm text-fg-secondary">2:00 pm</div>
          </div>
          <div className="p-4">
            <div className="text-sm font-semibold">Checkout</div>
            <div>{day(trip.check_out)}</div>
            <div className="text-sm text-fg-secondary">11:00 am</div>
          </div>
        </div>

        <div className="mt-6 space-y-4 divide-y divide-line-light">
          <div className="flex justify-between pt-4">
            <span className="font-semibold">Guests</span>
            <span>
              {plural(trip.guests, "guest")}
              {trip.infants ? `, ${plural(trip.infants, "infant")}` : ""}
              {trip.pets ? `, ${plural(trip.pets, "pet")}` : ""}
            </span>
          </div>
          <div className="flex justify-between pt-4">
            <span className="font-semibold">Confirmation code</span>
            <span className="font-mono">HM{String(trip.id).padStart(6, "0")}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/rooms/${trip.listing.id}`} className="rounded-lg border border-fg px-5 py-2.5 text-sm font-semibold hover:bg-bg-hover">
            Show listing
          </Link>
          <button onClick={() => toast({ message: "Messaging hosts is coming soon" })} className="flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-semibold hover:border-fg">
            <MessageSquare size={16} /> Message host
          </button>
          {trip.can_review && <Button onClick={() => setReviewing(true)}>Write a review</Button>}
          {upcoming && (
            <button onClick={() => setConfirmCancel(true)} className="rounded-lg px-5 py-2.5 text-sm font-semibold text-error underline">
              Cancel reservation
            </button>
          )}
        </div>
      </div>

      <aside>
        <div className="sticky top-28 rounded-2xl border border-line p-6">
          <h2 className="mb-4 text-lg font-semibold">{trip.status === "cancelled" ? "Refunded" : "Payment details"}</h2>
          <PriceBreakdown
            q={{ nights: trip.nights, nightly_rate: trip.nightly_rate, cleaning_fee: trip.cleaning_fee, service_fee: trip.service_fee, taxes: trip.taxes, total: trip.total_price }}
            totalLabel="Total paid (INR)"
          />
          <p className="mt-4 text-xs text-fg-secondary">Booked on {format(parseISO(trip.created_at), "d MMM yyyy")} · Mock payment</p>
        </div>
      </aside>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel reservation"
        size="sm"
        footer={
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
              Keep reservation
            </Button>
            <Button loading={cancelling} onClick={cancel} className="!bg-error !text-white">
              Cancel reservation
            </Button>
          </div>
        }
      >
        <p>
          Your stay in {trip.listing.city} from {day(trip.check_in)} will be cancelled and the dates released. You&apos;ll get a full refund.
        </p>
      </Modal>
      <ReviewModal
        booking={reviewing ? trip : null}
        onClose={() => setReviewing(false)}
        onDone={() => {
          setReviewing(false);
          load();
        }}
      />
    </div>
  );
}

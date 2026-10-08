"use client";

import clsx from "clsx";
import { isAfter, parseISO, startOfDay } from "date-fns";
import { Medal, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Avatar, Button, RatingStar, Skeleton } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { imageUrl, listingHeadline, money, plural, rating, shortRange } from "@/lib/format";
import type { Booking, HostListingRow, HostStats } from "@/lib/types";

/* ---------- Reservations (shared by dashboard + reservations page) ---------- */

type ResTab = "upcoming" | "current" | "completed" | "cancelled";

function classify(b: Booking): ResTab {
  const today = startOfDay(new Date());
  if (b.status === "cancelled") return "cancelled";
  if (!isAfter(parseISO(b.check_out), today)) return "completed";
  if (!isAfter(parseISO(b.check_in), today)) return "current";
  return "upcoming";
}

const TAB_LABELS: Record<ResTab, string> = {
  current: "Currently hosting",
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function ReservationList({ bookings, compact = false }: { bookings: Booking[]; compact?: boolean }) {
  const groups = useMemo(() => {
    const g: Record<ResTab, Booking[]> = { current: [], upcoming: [], completed: [], cancelled: [] };
    bookings.forEach((b) => g[classify(b)].push(b));
    g.upcoming.sort((a, b) => a.check_in.localeCompare(b.check_in));
    return g;
  }, [bookings]);
  const [tab, setTab] = useState<ResTab>(groups.current.length ? "current" : "upcoming");
  const tabs = (compact ? ["current", "upcoming"] : ["upcoming", "current", "completed", "cancelled"]) as ResTab[];
  const rows = groups[tab].slice(0, compact ? 6 : undefined);

  return (
    <div>
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx("whitespace-nowrap rounded-full border px-4 py-2 text-sm", tab === t ? "border-fg font-semibold ring-1 ring-fg" : "border-line hover:border-fg")}
          >
            {TAB_LABELS[t]} ({groups[t].length})
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-bg-secondary px-6 py-12 text-center text-fg-secondary">
          You don&apos;t have any {TAB_LABELS[tab].toLowerCase()} reservations.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((b) => (
            <div key={b.id} className="rounded-2xl border border-line-light p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={clsx("text-sm font-semibold", tab === "current" ? "text-rausch" : tab === "cancelled" ? "text-fg-secondary" : "text-success")}>
                    {TAB_LABELS[tab]}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{b.guest.name}</p>
                  <p className="text-sm text-fg-secondary">
                    {shortRange(b.check_in, b.check_out)} · {plural(b.guests, "guest")}
                  </p>
                </div>
                <Avatar user={b.guest} size={44} />
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-line-light pt-4 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(b.listing.photo ?? "", 120)} alt="" className="h-10 w-10 rounded-md object-cover" />
                <span className="min-w-0 flex-1 truncate">{b.listing.title}</span>
                <span className="font-semibold">{money(b.nightly_rate * b.nights + b.cleaning_fee)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Dashboard ---------- */

export function HostDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HostStats | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    api.hostStats().then(setStats).catch(() => {});
    api.hostReservations().then(setBookings).catch(() => setBookings([]));
  }, []);

  const cards = stats
    ? [
        { label: "Total earnings", value: money(stats.total_earnings) },
        { label: "Upcoming bookings", value: stats.upcoming_bookings },
        { label: "Currently hosting", value: stats.hosting_now },
        { label: "Overall rating", value: stats.average_rating ? `${rating(stats.average_rating)} ★` : "–", sub: plural(stats.review_count, "review") },
      ]
    : [];

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold">Welcome back, {user?.name.split(" ")[0]}</h1>
          {stats?.is_superhost ? (
            <p className="mt-1 flex items-center gap-2 font-semibold text-rausch">
              <Medal size={18} /> You&apos;re a Superhost
            </p>
          ) : (
            stats && <p className="mt-1 text-fg-secondary">Keep a 4.8+ rating across 5+ reviews to become a Superhost.</p>
          )}
        </div>
        <Link href="/host/listings/new" className="flex items-center gap-2 rounded-lg bg-fg px-5 py-3 font-semibold text-bg">
          <Plus size={18} /> Create listing
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats
          ? cards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-line-light p-6">
                <p className="text-sm text-fg-secondary">{c.label}</p>
                <p className="mt-2 text-[26px] font-medium">{c.value}</p>
                {c.sub && <p className="text-sm text-fg-secondary">{c.sub}</p>}
              </div>
            ))
          : [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[26px] font-medium">Your reservations</h2>
          <Link href="/host/reservations" className="font-semibold underline">
            All reservations ({bookings?.length ?? 0})
          </Link>
        </div>
        {bookings ? <ReservationList bookings={bookings} compact /> : <Skeleton className="h-40 rounded-2xl" />}
      </section>
    </div>
  );
}

/* ---------- Listings ---------- */

export function HostListings() {
  const toast = useToast();
  const [listings, setListings] = useState<HostListingRow[] | null>(null);
  const [deleting, setDeleting] = useState<HostListingRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.hostListings().then(setListings).catch(() => setListings([])), []);
  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteListing(deleting.id);
      toast({ message: `Deleted "${deleting.title}"` });
      load();
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Couldn't delete listing" });
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[32px] font-semibold">Your listings</h1>
        <Link href="/host/listings/new" aria-label="Create listing" className="grid h-11 w-11 place-items-center rounded-full bg-bg-secondary hover:bg-line-light">
          <Plus size={20} />
        </Link>
      </div>
      {!listings ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl bg-bg-secondary p-10 text-center">
          <h2 className="text-lg font-semibold">You don&apos;t have any listings yet</h2>
          <Link href="/host/listings/new" className="mt-4 inline-block rounded-lg bg-fg px-5 py-3 font-semibold text-bg">
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <div key={l.id}>
              <Link href={`/rooms/${l.id}`} className="relative block overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(l.photos[0], 600)} alt="" className="aspect-[4/3] w-full object-cover" />
                <span className={clsx("absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#222]")}>
                  <span className={clsx("h-2 w-2 rounded-full", l.is_active ? "bg-success" : "bg-fg-tertiary")} />
                  {l.is_active ? "Listed" : "Unlisted"}
                </span>
              </Link>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{l.title}</h3>
                  <p className="text-sm text-fg-secondary">
                    {listingHeadline(l)} · {money(l.price_per_night)} night
                  </p>
                  <p className="flex items-center gap-1 text-sm text-fg-secondary">
                    <RatingStar size={11} /> {l.average_rating ? `${rating(l.average_rating)} (${l.review_count})` : "New"} ·{" "}
                    {plural(l.upcoming_bookings, "upcoming booking")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Link href={`/host/listings/${l.id}/edit`} aria-label="Edit listing" className="grid h-9 w-9 place-items-center rounded-full hover:bg-bg-hover">
                    <Pencil size={16} />
                  </Link>
                  <button aria-label="Delete listing" onClick={() => setDeleting(l)} className="grid h-9 w-9 place-items-center rounded-full text-error hover:bg-bg-hover">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete listing?"
        size="sm"
        footer={
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button className="!bg-error !text-white" loading={busy} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p>
          &ldquo;{deleting?.title}&rdquo; and its photos, past bookings and reviews will be permanently removed. Listings with upcoming
          reservations can&apos;t be deleted; unlist them instead.
        </p>
      </Modal>
    </div>
  );
}

/* ---------- Reservations page ---------- */

export function HostReservations() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  useEffect(() => {
    api.hostReservations().then(setBookings).catch(() => setBookings([]));
  }, []);
  return (
    <div>
      <h1 className="mb-8 text-[32px] font-semibold">Reservations</h1>
      {bookings ? <ReservationList bookings={bookings} /> : <Skeleton className="h-60 rounded-2xl" />}
    </div>
  );
}

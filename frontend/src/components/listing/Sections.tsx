"use client";

import { DoorOpen, Medal, MessageSquare, ShieldCheck, Sparkles, WavesLadder } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Avatar, Button } from "@/components/ui/primitives";
import { rating, yearsSince, yearsSinceCount } from "@/lib/format";
import type { Amenity, HostSummary, ListingDetail } from "@/lib/types";

/** One laurel branch: leaves fanned along a curved stem (mirrored for the right side). */
function LaurelBranch({ flip, large }: { flip?: boolean; large?: boolean }) {
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const x = 15 - Math.sin(t * Math.PI * 0.55) * 9; // stem curves outwards then back in
    const y = 44 - t * 38;
    const angle = -55 + t * 40;
    return { x, y, angle, size: 1 - t * 0.35 };
  });
  return (
    <svg
      viewBox="0 0 24 50"
      className={large ? "h-28 w-14" : "h-10 w-5"}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      <path d="M16 47 C 6 38, 4 22, 9 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.angle})`}>
          <path d={`M0 0 C ${-3 * l.size} ${-3 * l.size}, ${-3 * l.size} ${-8 * l.size}, 0 ${-10 * l.size} C ${3 * l.size} ${-8 * l.size}, ${3 * l.size} ${-3 * l.size}, 0 0Z`} fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

/** Laurel-wrapped badge for "Guest favourite" listings. */
export function Laurels({ children, size = "md" }: { children: React.ReactNode; size?: "md" | "lg" }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <LaurelBranch large={size === "lg"} />
      {children}
      <LaurelBranch flip large={size === "lg"} />
    </div>
  );
}

export function GuestFavouriteBanner({ listing }: { listing: ListingDetail }) {
  return (
    <a href="#reviews" className="flex items-center gap-6 rounded-xl border border-line px-6 py-5 hover:bg-bg-hover">
      <Laurels>
        <span className="text-center text-[15px] font-semibold leading-[18px]">
          Guest
          <br />
          favourite
        </span>
      </Laurels>
      <p className="flex-1 text-[15px] font-semibold">One of the most loved homes on Airbnb, according to guests</p>
      <div className="text-center">
        <div className="text-lg font-semibold">{rating(listing.average_rating)}</div>
        <div className="text-[9px]">★★★★★</div>
      </div>
      <div className="h-10 w-px bg-line" />
      <div className="text-center">
        <div className="text-lg font-semibold">{listing.review_count}</div>
        <div className="text-xs underline">Reviews</div>
      </div>
    </a>
  );
}

export function HostedBy({ host }: { host: HostSummary }) {
  return (
    <div className="flex items-center gap-6 py-6">
      <div className="relative">
        <Avatar user={host} size={40} />
        {host.is_superhost && (
          <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-rausch text-white">
            <Medal size={11} />
          </span>
        )}
      </div>
      <div>
        <div className="font-semibold">Hosted by {host.name.split(" ")[0]}</div>
        <div className="text-sm text-fg-secondary">
          {host.is_superhost ? "Superhost · " : ""}
          {yearsSince(host.created_at)}
        </div>
      </div>
    </div>
  );
}

export function Highlights({ listing }: { listing: ListingDetail }) {
  const has = (name: string) => listing.amenities.some((a) => a.name === name);
  const items = [
    has("Pool") && { icon: <WavesLadder size={24} strokeWidth={1.5} />, title: "Dive right in", text: "This is one of the few places in the area with a pool." },
    has("Self check-in") && { icon: <DoorOpen size={24} strokeWidth={1.5} />, title: "Self check-in", text: "Check yourself in with the keypad." },
    listing.host.is_superhost && { icon: <Medal size={24} strokeWidth={1.5} />, title: `${listing.host.name.split(" ")[0]} is a Superhost`, text: "Superhosts are experienced, highly rated hosts." },
    has("Dedicated workspace") && { icon: <Sparkles size={24} strokeWidth={1.5} />, title: "Dedicated workspace", text: "A room with wifi that's well suited for working." },
  ].filter(Boolean) as { icon: React.ReactNode; title: string; text: string }[];
  if (!items.length) return null;
  return (
    <div className="space-y-6 py-8">
      {items.slice(0, 3).map((i) => (
        <div key={i.title} className="flex gap-6">
          <span className="shrink-0">{i.icon}</span>
          <div>
            <div className="font-semibold">{i.title}</div>
            <div className="text-sm text-fg-secondary">{i.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const preview = text.split("\n\n")[0];
  return (
    <div className="py-8">
      <p className="line-clamp-6 whitespace-pre-line leading-6">{preview}</p>
      <Button variant="grey" className="mt-6" onClick={() => setOpen(true)}>
        Show more
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="" size="lg">
        <h2 className="mb-6 text-[26px] font-medium">About this space</h2>
        <p className="whitespace-pre-line leading-7">{text}</p>
      </Modal>
    </div>
  );
}

// Safety items Airbnb lists as crossed out when a home doesn't have them.
const SAFETY_CHECKS = ["Smoke alarm", "Carbon monoxide alarm"];

export function Amenities({ amenities }: { amenities: Amenity[] }) {
  const [open, setOpen] = useState(false);
  const missing = SAFETY_CHECKS.filter((name) => !amenities.some((a) => a.name === name));
  const shown = amenities.slice(0, 10 - Math.min(missing.length, 1));
  const groups = amenities.reduce<Record<string, Amenity[]>>((acc, a) => ((acc[a.group] ??= []).push(a), acc), {});
  return (
    <div id="amenities" className="py-12">
      <h2 className="mb-6 text-[22px] font-medium">What this place offers</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {shown.map((a) => (
          <li key={a.id} className="flex items-center gap-4">
            <Icon name={a.icon} />
            {a.name}
          </li>
        ))}
        {missing.slice(0, 1).map((name) => (
          <li key={name} className="flex items-center gap-4 text-fg-secondary">
            <Icon name="alarm-smoke" className="opacity-60" />
            <span className="line-through">{name}</span>
          </li>
        ))}
      </ul>
      <button className="mt-8 rounded-lg bg-[#f2f2f2] px-6 py-3 font-medium text-[#222] hover:bg-[#ebebeb] dark:bg-bg-secondary dark:text-fg" onClick={() => setOpen(true)}>
        Show all {amenities.length} amenities
      </button>
      <Modal open={open} onClose={() => setOpen(false)} size="lg">
        <h2 className="mb-6 text-[26px] font-medium">What this place offers</h2>
        {Object.entries(groups).map(([group, items]) => (
          <section key={group} className="mb-8">
            <h3 className="mb-2 text-lg font-semibold">{group}</h3>
            {items.map((a) => (
              <div key={a.id} className="flex items-center gap-4 border-b border-line-light py-6">
                <Icon name={a.icon} />
                {a.name}
              </div>
            ))}
          </section>
        ))}
        {missing.length > 0 && (
          <section className="mb-8">
            <h3 className="mb-2 text-lg font-semibold">Not included</h3>
            {missing.map((name) => (
              <div key={name} className="flex items-center gap-4 border-b border-line-light py-6 text-fg-secondary">
                <Icon name="alarm-smoke" className="opacity-60" />
                <span className="line-through">{name}</span>
              </div>
            ))}
          </section>
        )}
      </Modal>
    </div>
  );
}

export function MeetHost({ host }: { host: HostSummary }) {
  const toast = useToast();
  const years = Math.max(1, yearsSinceCount(host.created_at));
  return (
    <section className="border-t border-line-light py-12">
      <h2 className="mb-8 text-[22px] font-medium">Meet your host</h2>
      <div className="grid gap-10 md:grid-cols-[minmax(0,380px)_1fr]">
        <div className="grid grid-cols-[1fr_auto] items-center gap-6 rounded-3xl bg-bg-elevated p-8 shadow-[0_6px_20px_rgb(0_0_0/0.2)]">
          <div className="text-center">
            <div className="relative mx-auto w-fit">
              <Avatar user={host} size={104} />
              {host.is_superhost && (
                <span className="absolute bottom-1 right-0 grid h-8 w-8 place-items-center rounded-full bg-rausch text-white">
                  <ShieldCheck size={16} />
                </span>
              )}
            </div>
            <div className="mt-3 text-[28px] font-bold leading-8">{host.name.split(" ")[0]}</div>
            <div className="text-sm font-semibold">{host.is_superhost ? "Superhost" : "Host"}</div>
          </div>
          <div className="w-24 divide-y divide-line-light">
            <Stat value={host.review_count} label="Reviews" />
            <Stat value={host.average_rating ? `${rating(host.average_rating)}★` : "New"} label="Rating" />
            <Stat value={years} label={`Year${years > 1 ? "s" : ""} hosting`} />
          </div>
        </div>
        <div>
          {host.is_superhost && (
            <>
              <h3 className="text-lg font-semibold">{host.name.split(" ")[0]} is a Superhost</h3>
              <p className="mb-6 mt-2 text-fg-secondary">
                Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests.
              </p>
            </>
          )}
          {host.bio && <p className="mb-6">{host.bio}</p>}
          <h3 className="text-lg font-semibold">Host details</h3>
          <p className="mb-6 mt-2 text-fg-secondary">
            Response rate: 100%
            <br />
            Responds within an hour
          </p>
          <Button variant="dark" onClick={() => toast({ message: "Messaging hosts is coming soon" })}>
            <MessageSquare size={16} /> Message host
          </Button>
          <p className="mt-8 flex items-start gap-3 border-t border-line-light pt-6 text-xs text-fg-secondary">
            <ShieldCheck size={24} className="shrink-0 text-rausch" />
            To help protect your payment, always use Airbnb to send money and communicate with hosts.
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="py-3">
      <div className="text-[22px] font-bold leading-6">{value}</div>
      <div className="text-[10px] font-semibold">{label}</div>
    </div>
  );
}

export function ThingsToKnow({ listing }: { listing: ListingDetail }) {
  const cols = [
    { title: "Cancellation policy", lines: ["Free cancellation before check-in.", "Review this host's full policy for details."] },
    { title: "House rules", lines: ["Check-in after 2:00 pm", "Checkout before 11:00 am", `${listing.max_guests} guests maximum`] },
    { title: "Safety & property", lines: ["Smoke alarm", "First aid kit", listing.amenities.some((a) => a.name === "Pool") ? "Pool/hot tub without a gate or lock" : "Security cameras: none"] },
  ];
  return (
    <section className="border-t border-line-light py-12">
      <h2 className="mb-6 text-[22px] font-medium">Things to know</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="mb-3 font-semibold">{c.title}</h3>
            {c.lines.map((l) => (
              <p key={l} className="mb-2 text-fg-secondary">
                {l}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

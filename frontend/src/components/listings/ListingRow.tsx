"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { ListingCard } from "@/lib/types";

import { CompactListingCard } from "./ListingCard";

/** A horizontally scrolling row of cards with a title link and prev/next buttons. */
export function ListingRow({ title, subtitle, href, items }: { title: string; subtitle?: string; href: string; items: ListingCard[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  useEffect(update, [items]);

  const page = (dir: number) => {
    const el = track.current;
    el?.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  const arrow = "grid h-8 w-8 place-items-center rounded-full bg-bg-secondary transition hover:bg-line-light disabled:opacity-40";

  return (
    <section className="py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <Link href={href} className="group flex items-center gap-2">
            <h2 className="text-lg font-semibold leading-6 md:text-[20px]">{title}</h2>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f2f2f2] text-[#222] transition group-hover:translate-x-0.5 dark:bg-bg-secondary dark:text-fg">
              <ArrowRight size={14} strokeWidth={2.5} />
            </span>
          </Link>
          {subtitle && <p className="mt-1 text-sm text-fg-secondary">{subtitle}</p>}
        </div>
        <div className="hidden gap-2 md:flex">
          <button aria-label="Previous" className={arrow} disabled={edges.start} onClick={() => page(-1)}>
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <button aria-label="Next" className={arrow} disabled={edges.end} onClick={() => page(1)}>
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div
        ref={track}
        onScroll={update}
        className="no-scrollbar -mx-6 grid snap-x auto-cols-[42%] grid-flow-col gap-3 overflow-x-auto scroll-px-6 px-6 sm:auto-cols-[30%] md:mx-0 md:auto-cols-[calc((100%-36px)/4)] md:px-0 lg:auto-cols-[calc((100%-48px)/5)] xl:auto-cols-[calc((100%-72px)/7)]"
      >
        {items.map((l) => (
          <div key={l.id} className="snap-start">
            <CompactListingCard listing={l} href={`/rooms/${l.id}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

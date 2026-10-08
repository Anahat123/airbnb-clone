"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { RatingStar } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { imageUrl, money, rating } from "@/lib/format";
import type { ListingCard } from "@/lib/types";

const PER_PAGE = 5;

/** "More stays nearby": the closest other listings, five at a time with a "1 / 2" pager. */
export function NearbyStays({ listingId }: { listingId: number }) {
  const [items, setItems] = useState<ListingCard[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.nearby(listingId).then(setItems).catch(() => setItems([]));
  }, [listingId]);

  if (items.length === 0) return null;
  const pages = Math.ceil(items.length / PER_PAGE);
  const visible = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const arrow = "grid h-8 w-8 place-items-center rounded-full bg-[#f2f2f2] text-[#222] disabled:opacity-40 dark:bg-bg-secondary dark:text-fg";

  return (
    <section className="border-t border-line-light py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px] font-medium">More stays nearby</h2>
        {pages > 1 && (
          <div className="flex items-center gap-3 text-sm">
            <span>
              {page + 1} / {pages}
            </span>
            <button aria-label="Previous" className={arrow} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={14} />
            </button>
            <button aria-label="Next" className={arrow} disabled={page === pages - 1} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
        {visible.map((l, i) => (
          <Link key={l.id} href={`/rooms/${l.id}`} className={clsx("group", i === 2 && "hidden sm:block", i >= 3 && "hidden md:block")}>
            <div className="aspect-square overflow-hidden rounded-xl bg-skeleton">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(l.photos[0], 400)} alt={l.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
            </div>
            <h3 className="mt-3 line-clamp-2 font-medium leading-5">{l.title}</h3>
            <p className="mt-1 text-sm text-fg-secondary">
              {money(l.total_price ?? l.price_per_night)}
              {l.average_rating && (
                <>
                  {" · "}
                  <span className="inline-flex items-center gap-0.5">
                    <RatingStar size={10} /> {rating(l.average_rating)}
                  </span>
                </>
              )}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

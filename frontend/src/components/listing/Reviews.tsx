"use client";

import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns";
import Link from "next/link";
import { CircleCheck, KeyRound, Map, MessageSquare, SprayCan, Tag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Avatar, Button, RatingStar, Skeleton, StarRow } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { rating } from "@/lib/format";
import type { ListingDetail, RatingKey, Review } from "@/lib/types";

import { Laurels } from "./Sections";

const CATEGORIES: { key: RatingKey; label: string; icon: React.ReactNode }[] = [
  { key: "cleanliness", label: "Cleanliness", icon: <SprayCan size={28} strokeWidth={1.3} /> },
  { key: "accuracy", label: "Accuracy", icon: <CircleCheck size={28} strokeWidth={1.3} /> },
  { key: "check_in", label: "Check-in", icon: <KeyRound size={28} strokeWidth={1.3} /> },
  { key: "communication", label: "Communication", icon: <MessageSquare size={28} strokeWidth={1.3} /> },
  { key: "location", label: "Location", icon: <Map size={28} strokeWidth={1.3} /> },
  { key: "value", label: "Value", icon: <Tag size={28} strokeWidth={1.3} /> },
];

/** "2 days ago" / "3 weeks ago" for recent reviews, "March 2026" for older ones, like Airbnb. */
function reviewDate(iso: string) {
  const d = parseISO(iso);
  if (differenceInCalendarDays(new Date(), d) < 60) return formatDistanceToNowStrict(d, { addSuffix: true });
  return format(d, "MMMM yyyy");
}

export function ReviewItem({ review, clamp = true }: { review: Review; clamp?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const since = new Date().getFullYear() - new Date(review.author.created_at).getFullYear();
  const long = clamp && review.comment.length > 180;
  return (
    <article>
      <div className="mb-3 flex items-center gap-3">
        <Avatar user={review.author} size={48} />
        <div>
          <div className="font-semibold">{review.author.name.split(" ")[0]}</div>
          <div className="text-sm text-fg-secondary">{since > 0 ? `${since} year${since > 1 ? "s" : ""} on Airbnb` : review.author.city}</div>
        </div>
      </div>
      <div className="mb-1 flex items-center gap-2 text-sm">
        <StarRow value={review.rating} size={9} />
        <span className="text-fg-secondary">· {reviewDate(review.created_at)}</span>
      </div>
      <p className={clamp && !expanded ? "line-clamp-3 leading-6" : "leading-6"}>{review.comment}</p>
      {long && !expanded && (
        <button onClick={() => setExpanded(true)} className="mt-2 font-semibold underline">
          Show more
        </button>
      )}
    </article>
  );
}

/** Rating summary, category scores and review cards, with a "Show all reviews" modal. */
export function Reviews({ listing }: { listing: ListingDetail }) {
  const [first, setFirst] = useState<Review[] | null>(null);
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState<Review[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    api.reviews(listing.id, 1, 6).then((r) => setFirst(r.items)).catch(() => setFirst([]));
  }, [listing.id]);

  const loadMore = useCallback(async () => {
    const next = page + 1;
    const res = await api.reviews(listing.id, next, 10);
    setAll((prev) => (next === 1 ? res.items : [...prev, ...res.items]));
    setPage(next);
    setTotalPages(res.total_pages);
  }, [listing.id, page]);

  if (!listing.review_count)
    return (
      <section id="reviews" className="border-t border-line-light py-12">
        <h2 className="flex items-center gap-2 text-[22px] font-medium">
          <RatingStar size={18} /> No reviews (yet)
        </h2>
        <p className="mt-2 text-fg-secondary">This place is new. Be one of the first guests to stay and leave a review.</p>
      </section>
    );

  const dist = listing.rating_distribution;
  const maxCount = Math.max(1, ...Object.values(dist));

  return (
    <section id="reviews" className="border-t border-line-light py-12">
      {listing.is_guest_favourite ? (
        <div className="mb-10 text-center">
          <Laurels size="lg">
            <span className="text-[64px] font-semibold leading-none tracking-tight md:text-[88px]">{rating(listing.average_rating)}</span>
          </Laurels>
          <h2 className="mt-2 text-[22px] font-medium">Guest favourite</h2>
          <p className="mx-auto mt-1 max-w-sm text-lg text-fg-secondary">
            {(listing.average_rating ?? 0) >= 4.95 && listing.review_count >= 10 ? (
              <>
                This home is in the <strong className="text-fg">top 10%</strong> of eligible listings based on ratings, reviews and reliability
              </>
            ) : (
              "One of the most loved homes on Airbnb based on ratings, reviews and reliability"
            )}
          </p>
          <Link href="/help" className="mt-3 inline-block text-sm text-fg-secondary underline">
            How reviews work
          </Link>
        </div>
      ) : (
        <h2 className="mb-8 flex items-center gap-2 text-[22px] font-medium">
          <RatingStar size={18} /> {rating(listing.average_rating)} · {listing.review_count} reviews
        </h2>
      )}

      <div className="no-scrollbar mb-10 flex gap-0 overflow-x-auto border-b border-line-light pb-8 md:grid md:grid-cols-7">
        <div className="min-w-[140px] pr-6">
          <div className="mb-2 text-sm font-semibold">Overall rating</div>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-2">{star}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-line-light">
                <span className="block h-full rounded-full bg-fg" style={{ width: `${((dist[star] ?? 0) / maxCount) * 100}%` }} />
              </span>
            </div>
          ))}
        </div>
        {CATEGORIES.map((c) => (
          <div key={c.key} className="flex min-w-[110px] flex-col justify-between border-l border-line-light px-4">
            <div>
              <div className="text-sm font-medium">{c.label}</div>
              <div className="text-sm">{listing.rating_breakdown[c.key]?.toFixed(1) ?? "–"}</div>
            </div>
            <span className="mt-6">{c.icon}</span>
          </div>
        ))}
      </div>

      {listing.review_mentions.length > 0 && (
        <div className="mb-10">
          <h3 className="mb-5 text-[22px] font-medium">Guests mention</h3>
          <div className="flex flex-wrap gap-3">
            {listing.review_mentions.map((m) => (
              <span key={m.label} className="flex items-center gap-2 rounded-2xl border border-line-light px-5 py-3 shadow-sm">
                <span aria-hidden>{m.emoji}</span>
                <span className="font-medium">{m.label}</span>
                <span className="text-fg-secondary">{m.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-x-24 gap-y-10 md:grid-cols-2">
        {first === null
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36" />)
          : first.map((r) => <ReviewItem key={r.id} review={r} />)}
      </div>

      {listing.review_count > 6 && (
        <Button
          variant="grey"
          className="mt-10"
          onClick={() => {
            setOpen(true);
            if (page === 0) loadMore();
          }}
        >
          Show all {listing.review_count} reviews
        </Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={`${listing.review_count} reviews`}>
        <div className="space-y-10">
          {all.map((r) => (
            <ReviewItem key={r.id} review={r} clamp={false} />
          ))}
        </div>
        {page < totalPages && (
          <Button variant="outline" className="mt-8" onClick={loadMore}>
            Load more reviews
          </Button>
        )}
      </Modal>
    </section>
  );
}

"use client";

import { Ban, ChevronLeft, ChevronRight, Flag, Languages, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ReviewItem } from "@/components/listing/Reviews";
import { HostCard } from "@/components/listing/Sections";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Button, RatingStar, Skeleton } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { imageUrl, listingHeadline, plural, rating } from "@/lib/format";
import type { Review, UserProfile } from "@/lib/types";

const PER_VIEW = 3;

/** Public host profile: card, About, guest reviews carousel, listings, report/block. */
export function HostProfile({ userId }: { userId: string }) {
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [missing, setMissing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offset, setOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [all, setAll] = useState<Review[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    api.userProfile(userId).then(setProfile).catch(() => setMissing(true));
    api.userReviews(userId, 1, 12).then((r) => setReviews(r.items)).catch(() => setReviews([]));
  }, [userId]);

  const loadMore = useCallback(async () => {
    const next = page + 1;
    const res = await api.userReviews(userId, next, 10);
    setAll((prev) => (next === 1 ? res.items : [...prev, ...res.items]));
    setPage(next);
    setTotalPages(res.total_pages);
  }, [userId, page]);

  if (missing) return <p className="py-16 text-lg">We couldn&apos;t find this person.</p>;
  if (!profile)
    return (
      <div className="grid gap-16 py-10 md:grid-cols-[340px_1fr]">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-40" />
      </div>
    );

  const first = profile.name.split(" ")[0];
  const visible = reviews.slice(offset, offset + PER_VIEW);
  const arrow = "grid h-8 w-8 place-items-center rounded-full border border-line bg-bg-elevated disabled:opacity-30";

  return (
    <div className="pb-8">
      <div className="grid gap-12 py-10 md:grid-cols-[minmax(0,380px)_1fr] md:gap-16">
        <div className="md:sticky md:top-28 md:self-start">
          <HostCard host={profile} />
        </div>
        <div>
          <h1 className="text-[32px] font-bold tracking-tight md:text-[40px]">About {first}</h1>
          <ul className="mt-6 space-y-4 text-lg">
            <li className="flex items-center gap-4">
              <Languages size={24} strokeWidth={1.5} /> Speaks {profile.languages.slice(0, -1).join(", ")} and {profile.languages.at(-1)}
            </li>
            {profile.identity_verified && (
              <li className="flex items-center gap-4">
                <ShieldCheck size={24} strokeWidth={1.5} />
                <Link href="/help" className="underline">
                  Identity verified
                </Link>
              </li>
            )}
          </ul>
          {profile.bio && <p className="mt-8 max-w-2xl text-lg leading-7">{profile.bio}</p>}
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="border-t border-line-light py-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-[22px] font-medium">What guests are saying about {first}</h2>
            <div className="flex gap-2">
              <button aria-label="Previous reviews" className={arrow} disabled={offset === 0} onClick={() => setOffset((o) => o - PER_VIEW)}>
                <ChevronLeft size={14} />
              </button>
              <button aria-label="Next reviews" className={arrow} disabled={offset + PER_VIEW >= reviews.length} onClick={() => setOffset((o) => o + PER_VIEW)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line-light">
            {visible.map((r) => (
              <div key={r.id} className="md:px-6 md:first:pl-0">
                <ReviewItem review={r} />
              </div>
            ))}
          </div>
          {profile.review_count > PER_VIEW && (
            <Button
              variant="grey"
              size="lg"
              className="mt-10"
              onClick={() => {
                setModalOpen(true);
                if (page === 0) loadMore();
              }}
            >
              Show more reviews
            </Button>
          )}
        </section>
      )}

      {profile.listings.length > 0 && (
        <section className="border-t border-line-light py-12">
          <h2 className="mb-8 text-[22px] font-medium">{first}&apos;s listings</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {profile.listings.map((l) => (
              <Link key={l.id} href={`/rooms/${l.id}`} className="group">
                <div className="aspect-square overflow-hidden rounded-xl bg-skeleton">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(l.photos[0], 400)} alt={l.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                </div>
                <div className="mt-3 text-sm">
                  <div className="font-semibold">{listingHeadline(l)}</div>
                  <div className="line-clamp-2 text-fg-secondary">{l.title}</div>
                  {l.average_rating && (
                    <div className="flex items-center gap-1 text-fg-secondary">
                      <RatingStar size={10} /> {rating(l.average_rating)} · {plural(l.review_count, "review")}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6 border-t border-line-light pt-10 text-lg">
        <button className="flex items-center gap-4 underline-offset-2 hover:underline" onClick={() => toast({ message: `Thanks, we'll review your report about ${first}.` })}>
          <Flag size={22} strokeWidth={1.5} /> Report {first}
        </button>
        <button className="flex items-center gap-4 underline-offset-2 hover:underline" onClick={() => toast({ message: "Blocking users is coming soon" })}>
          <Ban size={22} strokeWidth={1.5} /> Block {first}
        </button>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="lg" title={`${profile.review_count} reviews`}>
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
    </div>
  );
}

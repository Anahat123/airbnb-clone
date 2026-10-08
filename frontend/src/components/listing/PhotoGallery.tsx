"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Grip, Share, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { HeartButton } from "@/components/listings/HeartButton";
import { useToast } from "@/components/providers/ToastProvider";
import { useWishlists } from "@/components/providers/WishlistProvider";
import { imageUrl } from "@/lib/format";

/** Share / Save buttons next to the listing title. */
export function TitleActions({ listingId, photos }: { listingId: number; photos: string[] }) {
  const toast = useToast();
  const { isSaved, toggle } = useWishlists();
  const saved = isSaved(listingId);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ message: "Link copied" });
    } catch {
      toast({ message: "Couldn't copy the link" });
    }
  };
  const btn = "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold underline hover:bg-bg-hover";
  return (
    <div className="hidden shrink-0 gap-2 md:flex">
      <button className={btn} onClick={share}>
        <Share size={16} /> Share
      </button>
      <button className={btn} onClick={() => toggle({ id: listingId, photos })}>
        <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden className={saved ? "fill-rausch stroke-rausch" : "fill-none stroke-current"} strokeWidth={2}>
          <path d="M12 21s-7.5-4.6-9.4-9.3C1.2 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.8 3.7 4.4 7.2C19.5 16.4 12 21 12 21Z" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

/** Airbnb's 1-big + 4-small photo grid, the "Show all photos" tour and a full-screen viewer. */
export function PhotoGallery({ photos, title, listingId }: { photos: string[]; title: string; listingId: number }) {
  const [tourOpen, setTourOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const grid = photos.slice(0, 5);

  return (
    <>
      {/* Mobile: swipeable full-width carousel */}
      <div className="relative -mx-6 md:hidden">
        <div className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto">
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={imageUrl(src, 800)} alt={`${title} photo ${i + 1}`} className="h-full w-full shrink-0 snap-center object-cover" onClick={() => setTourOpen(true)} />
          ))}
        </div>
        <HeartButton listing={{ id: listingId, photos }} className="absolute right-4 top-4" />
        <span className="absolute bottom-4 right-4 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">{photos.length} photos</span>
      </div>

      {/* Desktop grid */}
      <div className="relative hidden h-[min(476px,42vw)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl md:grid">
        {grid.map((src, i) => (
          <button
            key={i}
            onClick={() => setTourOpen(true)}
            className={clsx("group relative overflow-hidden bg-skeleton", i === 0 && "col-span-2 row-span-2", grid.length === 1 && "col-span-4")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(src, i === 0 ? 1200 : 600)} alt={`${title} photo ${i + 1}`} className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
          </button>
        ))}
        <button
          onClick={() => setTourOpen(true)}
          className="absolute bottom-6 right-6 flex items-center gap-2 rounded-lg border border-fg bg-bg-elevated px-4 py-1.5 text-sm font-semibold hover:bg-bg-secondary"
        >
          <Grip size={16} /> Show all photos
        </button>
      </div>

      {tourOpen &&
        createPortal(
          <PhotoTour photos={photos} title={title} onClose={() => setTourOpen(false)} onOpen={setViewer} listingId={listingId} />,
          document.body,
        )}
      {viewer !== null &&
        createPortal(<PhotoViewer photos={photos} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />, document.body)}
    </>
  );
}

function PhotoTour({
  photos,
  title,
  onClose,
  onOpen,
  listingId,
}: {
  photos: string[];
  title: string;
  onClose: () => void;
  onOpen: (i: number) => void;
  listingId: number;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="animate-fade-up fixed inset-0 z-[2000] overflow-y-auto bg-bg">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-bg px-6 py-4">
        <button aria-label="Close photo tour" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-bg-hover">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <TitleActions listingId={listingId} photos={photos} />
        </div>
      </div>
      <div className="mx-auto max-w-[760px] px-6 pb-16">
        <h2 className="mb-6 text-[26px] font-medium">Photo tour</h2>
        <div className="grid grid-cols-2 gap-2">
          {photos.map((src, i) => (
            <button key={i} onClick={() => onOpen(i)} className={clsx("overflow-hidden", i % 3 === 0 ? "col-span-2 aspect-[3/2]" : "aspect-square")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(src, 1000)} alt={`${title} photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition hover:opacity-90" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhotoViewer({ photos, index, onIndex, onClose }: { photos: string[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const go = useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, onIndex, photos.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <div className="fixed inset-0 z-[2100] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between p-6">
        <button onClick={onClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10">
          <X size={16} /> Close
        </button>
        <span className="text-sm">
          {index + 1} / {photos.length}
        </span>
        <span className="w-20" />
      </div>
      <div className="flex flex-1 items-center justify-between gap-4 px-4 pb-10">
        <button aria-label="Previous photo" onClick={() => go(-1)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/40 hover:bg-white/10">
          <ChevronLeft />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl(photos[index], 1600)} alt="" className="max-h-[80vh] min-w-0 max-w-full object-contain" />
        <button aria-label="Next photo" onClick={() => go(1)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/40 hover:bg-white/10">
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { Heart } from "lucide-react";

import { useWishlists } from "@/components/providers/WishlistProvider";
import type { ListingCard } from "@/lib/types";

export function HeartButton({ listing, className }: { listing: Pick<ListingCard, "id" | "photos">; className?: string }) {
  const { isSaved, toggle } = useWishlists();
  const saved = isSaved(listing.id);
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={(e) => {
        // Cards are links; the heart must not navigate.
        e.preventDefault();
        e.stopPropagation();
        toggle(listing);
      }}
      className={clsx("grid h-8 w-8 place-items-center transition active:scale-90", className)}
    >
      <Heart
        size={24}
        strokeWidth={2}
        className={clsx("stroke-white drop-shadow", saved ? "fill-rausch" : "fill-black/50")}
      />
    </button>
  );
}

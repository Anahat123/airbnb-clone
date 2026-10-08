"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { SaveToWishlistModal } from "@/components/wishlist/SaveToWishlistModal";
import { api } from "@/lib/api";
import { imageUrl } from "@/lib/format";
import type { ListingCard, WishlistSummary } from "@/lib/types";

import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";

interface WishlistState {
  wishlists: WishlistSummary[];
  isSaved: (listingId: number) => boolean;
  /** Heart button: unsave if saved, otherwise ask which wishlist to save into. */
  toggle: (listing: Pick<ListingCard, "id" | "photos">) => void;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistState | null>(null);
const EMPTY: WishlistSummary[] = [];

export function useWishlists() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlists must be used inside <WishlistProvider>");
  return ctx;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, requireAuth } = useAuth();
  const toast = useToast();
  const [allWishlists, setWishlists] = useState<WishlistSummary[]>([]);
  const [saving, setSaving] = useState<Pick<ListingCard, "id" | "photos"> | null>(null);

  const refresh = useCallback(async () => {
    if (user) setWishlists(await api.wishlists());
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api.wishlists().then((w) => active && setWishlists(w)).catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  // After logout the old lists are ignored rather than cleared in an effect.
  const wishlists = user ? allWishlists : EMPTY;
  const savedIds = useMemo(() => new Set(wishlists.flatMap((w) => w.listing_ids)), [wishlists]);
  const isSaved = useCallback((id: number) => savedIds.has(id), [savedIds]);

  const toggle = useCallback<WishlistState["toggle"]>(
    async (listing) => {
      if (!requireAuth()) return;
      if (!savedIds.has(listing.id)) {
        setSaving(listing);
        return;
      }
      // Optimistic update: un-fill the heart immediately, then sync with the server.
      const name = wishlists.find((w) => w.listing_ids.includes(listing.id))?.name;
      setWishlists((ws) => ws.map((w) => ({ ...w, listing_ids: w.listing_ids.filter((i) => i !== listing.id) })));
      try {
        await api.unsave(listing.id);
        toast({ message: `Removed from ${name ?? "wishlist"}`, image: listing.photos[0] && imageUrl(listing.photos[0], 200) });
      } catch {
        toast({ message: "Couldn't update your wishlist" });
      }
      refresh();
    },
    [requireAuth, savedIds, wishlists, toast, refresh],
  );

  const saveInto = useCallback(
    async (target: { wishlistId: number } | { newName: string }) => {
      if (!saving) return;
      const listing = saving;
      setSaving(null);
      try {
        const saved =
          "wishlistId" in target
            ? await api.addToWishlist(target.wishlistId, listing.id)
            : await api.createWishlist(target.newName, listing.id);
        toast({
          message: `Saved to ${saved.name}`,
          image: listing.photos[0] && imageUrl(listing.photos[0], 200),
          action: { label: "View", href: `/wishlists/${saved.id}` },
        });
      } catch {
        toast({ message: "Couldn't save to wishlist" });
      }
      refresh();
    },
    [saving, toast, refresh],
  );

  const value = useMemo(() => ({ wishlists, isSaved, toggle, refresh }), [wishlists, isSaved, toggle, refresh]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
      {saving && (
        <SaveToWishlistModal
          open
          wishlists={wishlists}
          onClose={() => setSaving(null)}
          onPick={(wishlistId) => saveInto({ wishlistId })}
          onCreate={(newName) => saveInto({ newName })}
        />
      )}
    </WishlistContext.Provider>
  );
}

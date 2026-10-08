"use client";

import { ChevronLeft, Ellipsis } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ListingCard } from "@/components/listings/ListingCard";
import { ListingsMap } from "@/components/map";
import { useToast } from "@/components/providers/ToastProvider";
import { useWishlists } from "@/components/providers/WishlistProvider";
import { Modal } from "@/components/ui/Modal";
import { Button, Skeleton, TextField } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { imageUrl } from "@/lib/format";
import type { WishlistDetail as Detail } from "@/lib/types";

/** /wishlists: one tile per wishlist with a collage of saved photos. */
export function WishlistIndex() {
  const { wishlists, refresh } = useWishlists();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    refresh().finally(() => setLoaded(true));
  }, [refresh]);

  return (
    <>
      <h1 className="mb-8 text-[32px] font-semibold">Wishlists</h1>
      {!loaded && wishlists.length === 0 ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : wishlists.length === 0 ? (
        <div>
          <h2 className="text-lg font-semibold">Create your first wishlist</h2>
          <p className="mt-1 text-fg-secondary">As you search, tap the heart icon to save your favourite places and experiences to a wishlist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {wishlists.map((w) => (
            <Link key={w.id} href={`/wishlists/${w.id}`} className="group">
              <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl bg-bg-secondary shadow-card transition group-hover:shadow-pop">
                {w.cover_photos.slice(0, 3).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={imageUrl(src, 400)} alt="" className={`h-full w-full object-cover ${i === 0 ? "row-span-2" : ""} ${w.cover_photos.length === 1 ? "col-span-2" : ""}`} />
                ))}
              </div>
              <h2 className="mt-3 font-semibold">{w.name}</h2>
              <p className="text-sm text-fg-secondary">{w.item_count} saved</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

/** /wishlists/[id]: saved listings with a map, plus rename/delete. */
export function WishlistDetail({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { wishlists, refresh } = useWishlists();
  const [data, setData] = useState<Detail | null>(null);
  const [settings, setSettings] = useState(false);
  const [name, setName] = useState("");
  const [hovered, setHovered] = useState<number | null>(null);

  // Refetch when hearts change, so un-saved listings disappear from this page.
  const savedHere = wishlists.find((w) => String(w.id) === id)?.listing_ids.join(",");
  useEffect(() => {
    api.wishlist(id).then((d) => {
      setData(d);
      setName(d.name);
    }).catch(() => router.replace("/wishlists"));
  }, [id, savedHere, router]);

  if (!data) return <Skeleton className="h-96" />;

  return (
    <div className="flex gap-10">
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/wishlists" aria-label="Back to wishlists" className="-ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-bg-hover">
            <ChevronLeft size={20} />
          </Link>
          <button aria-label="Wishlist settings" onClick={() => setSettings(true)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-bg-hover">
            <Ellipsis size={20} />
          </button>
        </div>
        <h1 className="mb-8 text-[32px] font-semibold">{data.name}</h1>
        {data.items.length === 0 ? (
          <p className="text-fg-secondary">Nothing saved yet. Tap the heart on any listing to add it here.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
            {data.items.map((l) => (
              <ListingCard key={l.id} listing={l} href={`/rooms/${l.id}`} onHover={setHovered} />
            ))}
          </div>
        )}
      </div>
      <div className="sticky top-28 hidden h-[calc(100dvh-140px)] w-[45%] overflow-hidden rounded-2xl lg:block">
        <ListingsMap listings={data.items} activeId={hovered} fitToListings />
      </div>

      <Modal
        open={settings}
        onClose={() => setSettings(false)}
        title="Settings"
        size="sm"
        footer={
          <div className="flex justify-between">
            <button
              className="font-semibold underline"
              onClick={async () => {
                await api.deleteWishlist(data.id);
                await refresh();
                toast({ message: `Deleted "${data.name}"` });
                router.push("/wishlists");
              }}
            >
              Delete wishlist
            </button>
            <Button
              disabled={!name.trim()}
              onClick={async () => {
                await api.renameWishlist(data.id, name.trim());
                setData({ ...data, name: name.trim() });
                setSettings(false);
                refresh();
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <TextField label="Name" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} />
      </Modal>
    </div>
  );
}

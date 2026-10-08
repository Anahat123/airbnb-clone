"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Button, TextField } from "@/components/ui/primitives";
import { imageUrl } from "@/lib/format";
import type { WishlistSummary } from "@/lib/types";

interface Props {
  open: boolean;
  wishlists: WishlistSummary[];
  onClose: () => void;
  onPick: (wishlistId: number) => void;
  onCreate: (name: string) => void;
}

export function SaveToWishlistModal({ open, wishlists, onClose, onPick, onCreate }: Props) {
  const [creating, setCreating] = useState(wishlists.length === 0);
  const [name, setName] = useState("");

  if (creating)
    return (
      <Modal
        open={open}
        onClose={wishlists.length ? () => setCreating(false) : onClose}
        back={wishlists.length > 0}
        title="Create wishlist"
        size="sm"
        footer={
          <div className="flex items-center justify-between">
            <button className="font-semibold underline" onClick={() => setName("")}>
              Clear
            </button>
            <Button disabled={!name.trim()} onClick={() => onCreate(name.trim())}>
              Create
            </Button>
          </div>
        }
      >
        <TextField label="Name" maxLength={50} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        <p className="mt-2 text-xs font-semibold text-fg-secondary">{name.length}/50 characters</p>
      </Modal>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Save to wishlist"
      size="md"
      footer={
        <Button className="w-full" onClick={() => setCreating(true)}>
          Create new wishlist
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
        {wishlists.map((w) => (
          <button key={w.id} className="text-left" onClick={() => onPick(w.id)}>
            <div className="aspect-square overflow-hidden rounded-xl bg-bg-secondary shadow-card">
              {w.cover_photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl(w.cover_photos[0], 400)} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="mt-2 text-sm font-semibold">{w.name}</div>
            <div className="text-sm text-fg-secondary">{w.item_count} saved</div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

"use client";

import { ImagePlus, Link2, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { Button, Spinner } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { imageUrl } from "@/lib/format";

/** Upload files (to Cloudinary or the API's disk) or paste URLs; first photo is the cover. */
export function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [url, setUrl] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading((n) => n + list.length);
    const added: string[] = [];
    for (const file of list) {
      try {
        added.push((await api.upload(file)).url);
      } catch (e) {
        toast({ message: e instanceof Error ? e.message : `Couldn't upload ${file.name}` });
      } finally {
        setUploading((n) => n - 1);
      }
    }
    onChange([...photos, ...added]);
  }

  function addUrl() {
    try {
      const u = new URL(url.trim());
      if (!/^https?:$/.test(u.protocol)) throw new Error();
      onChange([...photos, u.toString()]);
      setUrl("");
    } catch {
      toast({ message: "Enter a valid image URL starting with https://" });
    }
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
        className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-fg-tertiary px-6 py-12 text-center"
      >
        <ImagePlus size={48} strokeWidth={1} />
        <div>
          <p className="text-lg font-semibold">Drag your photos here</p>
          <p className="text-sm text-fg-secondary">JPEG, PNG or WebP, up to 8 MB each</p>
        </div>
        <Button variant="outline" type="button" onClick={() => input.current?.click()}>
          Upload from your device
        </Button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      <div className="flex gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-line px-3 focus-within:border-fg">
          <Link2 size={16} className="text-fg-secondary" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
            placeholder="…or paste an image URL"
            className="h-11 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <Button type="button" onClick={addUrl} disabled={!url.trim()}>
          Add
        </Button>
      </div>

      {(photos.length > 0 || uploading > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((src, i) => (
            <div key={src + i} className={`group relative overflow-hidden rounded-xl bg-skeleton ${i === 0 ? "col-span-2 row-span-2 sm:col-span-2" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(src, 600)} alt="" className="aspect-[4/3] h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#222]">Cover photo</span>}
              <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                {i > 0 && (
                  <button
                    type="button"
                    aria-label="Make cover photo"
                    onClick={() => onChange([src, ...photos.filter((_, j) => j !== i)])}
                    className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#222] shadow"
                  >
                    <Star size={14} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => onChange(photos.filter((_, j) => j !== i))}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#222] shadow"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <div key={`up-${i}`} className="skeleton grid aspect-[4/3] place-items-center rounded-xl">
              <Spinner />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

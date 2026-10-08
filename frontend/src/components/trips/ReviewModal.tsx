"use client";

import clsx from "clsx";
import { Star } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";

const CATEGORIES = [
  ["cleanliness", "Cleanliness"],
  ["accuracy", "Accuracy"],
  ["check_in", "Check-in"],
  ["communication", "Communication"],
  ["location", "Location"],
  ["value", "Value"],
] as const;

function Stars({ value, onChange, size = 28, label }: { value: number; onChange: (n: number) => void; size?: number; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}>
          <Star size={size} strokeWidth={1.5} className={clsx("transition", n <= (hover || value) ? "fill-fg stroke-fg" : "stroke-line")} />
        </button>
      ))}
    </div>
  );
}

/** Post-stay review: overall stars, six category ratings and a written comment. */
export function ReviewModal({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [overall, setOverall] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const complete = overall > 0 && CATEGORIES.every(([k]) => scores[k]) && comment.trim().length >= 10;

  async function submit() {
    if (!booking) return;
    setBusy(true);
    try {
      await api.createReview({ booking_id: booking.id, rating: overall, comment, ...scores });
      toast({ message: "Thanks for your review!" });
      onDone();
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Couldn't post your review" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={booking !== null}
      onClose={onClose}
      title="Write a review"
      size="md"
      footer={
        <Button className="w-full" size="lg" disabled={!complete} loading={busy} onClick={submit}>
          Submit review
        </Button>
      }
    >
      {booking && (
        <div className="space-y-8">
          <div>
            <h3 className="text-[22px] font-medium">How was your stay at {booking.listing.title}?</h3>
            <p className="mt-1 text-sm text-fg-secondary">Hosted by {booking.listing.host_name}</p>
            <div className="mt-4">
              <Stars value={overall} onChange={setOverall} size={36} label="Overall rating" />
            </div>
          </div>
          <div className="divide-y divide-line-light">
            {CATEGORIES.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-3">
                <span className="font-medium">{label}</span>
                <Stars value={scores[key] ?? 0} onChange={(n) => setScores((s) => ({ ...s, [key]: n }))} size={20} label={label} />
              </div>
            ))}
          </div>
          <label className="block">
            <span className="mb-2 block font-semibold">Tell future guests about your stay</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="What did you love? Anything future guests should know?"
              className="w-full rounded-lg border border-line bg-transparent p-3 outline-none focus:border-fg"
            />
            <span className="text-xs text-fg-secondary">{comment.trim().length < 10 ? "At least 10 characters" : `${comment.length}/2000`}</span>
          </label>
        </div>
      )}
    </Modal>
  );
}

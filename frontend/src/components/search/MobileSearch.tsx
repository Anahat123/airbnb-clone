"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import { Calendar } from "@/components/ui/Calendar";
import { Button } from "@/components/ui/primitives";
import { guestLabel, type SearchState, searchToParams } from "@/lib/search";

import { DestinationList } from "./DestinationList";
import { GuestsPicker } from "./GuestsPicker";

type Step = "where" | "when" | "who";

/** Full-screen search used on phones: Where, When and Who as stacked expandable cards. */
export function MobileSearch({ initial, open, onClose }: { initial: SearchState; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [step, setStep] = useState<Step>("where");

  if (!open) return null;

  const submit = () => {
    onClose();
    router.push(`/s?${new URLSearchParams(searchToParams(state))}`);
  };

  const card = (s: Step, title: string, summary: string, body: React.ReactNode) => (
    <section className={clsx("rounded-3xl bg-bg-elevated shadow-card", step === s ? "p-6" : "px-6 py-4")}>
      {step === s ? (
        <>
          <h2 className="mb-4 text-[22px] font-bold">{title}</h2>
          {body}
        </>
      ) : (
        <button className="flex w-full justify-between text-sm" onClick={() => setStep(s)}>
          <span className="text-fg-secondary">{title.replace("?", "")}</span>
          <span className="font-semibold">{summary}</span>
        </button>
      )}
    </section>
  );

  return createPortal(
    <div className="animate-fade-up fixed inset-0 z-[2000] flex flex-col bg-bg-secondary">
      <div className="flex items-center p-4">
        <button aria-label="Close" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-bg-elevated">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        {card(
          "where",
          "Where to?",
          state.location || "I'm flexible",
          <>
            <label className="mb-4 flex items-center gap-3 rounded-xl border border-line px-4 py-3">
              <Search size={16} />
              <input
                autoFocus
                value={state.location}
                onChange={(e) => setState({ ...state, location: e.target.value })}
                placeholder="Search destinations"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <div className="-mx-4">
              <DestinationList
                query={state.location}
                onPick={(place) => {
                  setState({ ...state, location: place });
                  setStep("when");
                }}
              />
            </div>
          </>,
        )}
        {card(
          "when",
          "When's your trip?",
          state.checkIn && state.checkOut ? `${state.checkIn} → ${state.checkOut}` : "Add dates",
          <Calendar
            months={1}
            checkIn={state.checkIn}
            checkOut={state.checkOut}
            onChange={(checkIn, checkOut) => setState({ ...state, checkIn, checkOut })}
          />,
        )}
        {card("who", "Who's coming?", guestLabel(state), <GuestsPicker value={state} onChange={(g) => setState({ ...state, ...g })} />)}
      </div>
      <div className="flex items-center justify-between border-t border-line-light bg-bg-elevated px-6 py-4">
        <button
          className="font-semibold underline"
          onClick={() => setState({ location: "", checkIn: null, checkOut: null, adults: 0, children: 0, infants: 0, pets: 0 })}
        >
          Clear all
        </button>
        <Button variant="primary" size="lg" onClick={submit}>
          <Search size={16} strokeWidth={3} /> Search
        </Button>
      </div>
    </div>,
    document.body,
  );
}

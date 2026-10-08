"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Calendar } from "@/components/ui/Calendar";
import { parseDay } from "@/lib/format";
import { guestLabel, type SearchState, searchToParams } from "@/lib/search";

import { DestinationList } from "./DestinationList";
import { GuestsPicker } from "./GuestsPicker";

type Panel = "where" | "when" | "who" | null;

function ClearButton({ onClick, show }: { onClick: () => void; show: boolean }) {
  if (!show) return null;
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Clear"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute right-4 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-bg-hover hover:bg-line"
    >
      <X size={12} strokeWidth={3} />
    </span>
  );
}

function dateLabel(checkIn: string | null, checkOut: string | null) {
  const a = parseDay(checkIn);
  const b = parseDay(checkOut);
  if (a && b) return `${format(a, "d MMM")} – ${format(b, "d MMM")}`;
  if (a) return `${format(a, "d MMM")} – Add checkout`;
  return null;
}

/**
 * The big pill search bar: Where / When / Who segments, each opening a dropdown panel.
 * Submitting navigates to /s with the search encoded in the URL.
 */
export function SearchBar({
  initial,
  initialPanel = null,
  onDone,
}: {
  initial: SearchState;
  initialPanel?: Panel;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [panel, setPanel] = useState<Panel>(initialPanel);
  const root = useRef<HTMLFormElement>(null);
  const whereInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (panel === "where") whereInput.current?.focus();
  }, [panel]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setPanel(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setPanel(null);
    onDone?.();
    router.push(`/s?${new URLSearchParams(searchToParams(state))}`);
  }

  const dates = dateLabel(state.checkIn, state.checkOut);
  const guests = guestLabel(state, "");

  const segment = (name: Exclude<Panel, null>) =>
    clsx(
      "relative flex h-full flex-col justify-center rounded-full px-8 text-left transition-colors",
      panel === name ? "bg-bg-elevated shadow-card" : "hover:bg-[var(--bg-hover)]",
      panel && panel !== name && "hover:bg-[#dddddd] dark:hover:bg-[#333]",
    );

  return (
    <form ref={root} onSubmit={submit} className="relative mx-auto w-full max-w-[850px]">
      <div
        className={clsx(
          "grid h-[66px] grid-cols-[1.3fr_1fr_1.2fr] items-center rounded-full border border-line shadow-search",
          panel ? "bg-bg-secondary" : "bg-bg-elevated",
        )}
      >
        <div className={segment("where")} onClick={() => setPanel("where")}>
          <label htmlFor="where" className="text-xs font-semibold">
            Where
          </label>
          <input
            id="where"
            ref={whereInput}
            value={state.location}
            onChange={(e) => setState({ ...state, location: e.target.value })}
            onFocus={() => setPanel("where")}
            placeholder="Search destinations"
            autoComplete="off"
            className="w-full truncate bg-transparent pr-6 text-sm outline-none placeholder:text-fg-secondary"
          />
          <ClearButton show={panel === "where" && !!state.location} onClick={() => setState({ ...state, location: "" })} />
        </div>

        <button type="button" className={clsx(segment("when"), "border-l border-line-light")} onClick={() => setPanel("when")}>
          <span className="text-xs font-semibold">When</span>
          <span className={clsx("truncate text-sm", dates ? "text-fg" : "text-fg-secondary")}>{dates ?? "Add dates"}</span>
          <ClearButton
            show={panel === "when" && !!state.checkIn}
            onClick={() => setState({ ...state, checkIn: null, checkOut: null })}
          />
        </button>

        <div
          role="button"
          tabIndex={0}
          className={clsx(segment("who"), "border-l border-line-light pr-2")}
          onClick={() => setPanel("who")}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold">Who</div>
              <div className={clsx("truncate text-sm", guests ? "text-fg" : "text-fg-secondary")}>{guests || "Add guests"}</div>
            </div>
            <button
              type="submit"
              aria-label="Search"
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                "flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-rausch-gradient font-semibold text-white transition-all",
                panel ? "px-4" : "w-12",
              )}
            >
              <Search size={16} strokeWidth={3} />
              {panel && <span className="pr-1">Search</span>}
            </button>
          </div>
        </div>
      </div>

      {panel === "where" && (
        <div className="absolute left-0 top-[78px] z-50 w-[425px] rounded-[32px] bg-bg-elevated py-6 shadow-pop">
          <DestinationList
            query={state.location}
            onPick={(place) => {
              setState({ ...state, location: place });
              setPanel("when");
            }}
          />
        </div>
      )}
      {panel === "when" && (
        <div className="absolute left-0 right-0 top-[78px] z-50 rounded-[32px] bg-bg-elevated px-10 py-8 shadow-pop">
          <Calendar
            checkIn={state.checkIn}
            checkOut={state.checkOut}
            onChange={(checkIn, checkOut) => {
              setState({ ...state, checkIn, checkOut });
              if (checkIn && checkOut) setPanel("who");
            }}
          />
        </div>
      )}
      {panel === "who" && (
        <div className="absolute right-0 top-[78px] z-50 w-[400px] rounded-[32px] bg-bg-elevated px-8 py-4 shadow-pop">
          <GuestsPicker value={state} onChange={(g) => setState({ ...state, ...g })} />
        </div>
      )}
    </form>
  );
}

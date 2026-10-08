"use client";

import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

import { parseDay, toDay } from "@/lib/format";
import type { DateRange } from "@/lib/types";

interface CalendarProps {
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  /** Confirmed bookings, as half-open [check_in, check_out) ranges. */
  booked?: DateRange[];
  minNights?: number;
  months?: 1 | 2;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Two-month range picker that mirrors Airbnb's rules:
 * - a night is unavailable if any booking covers it (check_in <= night < check_out);
 * - after picking check-in, you can only check out up to the next booked night,
 *   and at least `minNights` later.
 */
export function Calendar({ checkIn, checkOut, onChange, booked = [], minNights = 1, months = 2 }: CalendarProps) {
  const today = startOfDay(new Date());
  const start = parseDay(checkIn);
  const end = parseDay(checkOut);
  const [visible, setVisible] = useState(() => startOfMonth(start ?? today));
  const [hover, setHover] = useState<Date | null>(null);

  const ranges = useMemo(
    () => booked.map((r) => [parseDay(r.check_in)!, parseDay(r.check_out)!] as const),
    [booked],
  );

  const nightBooked = (d: Date) => ranges.some(([a, b]) => !isBefore(d, a) && isBefore(d, b));

  // When only check-in is chosen, the latest possible check-out is the start of the next booking.
  const checkoutLimit = useMemo(() => {
    if (!start || end) return null;
    const next = ranges.map(([a]) => a).filter((a) => isAfter(a, start)).sort((x, y) => +x - +y)[0];
    return next ?? null;
  }, [start, end, ranges]);

  const choosingCheckout = start !== null && end === null;

  function isDisabled(d: Date): boolean {
    if (isBefore(d, today)) return true;
    if (choosingCheckout) {
      if (!isAfter(d, start)) return nightBooked(d); // earlier days can restart the selection
      if (differenceInCalendarDays(d, start) < minNights) return true;
      return checkoutLimit !== null && isAfter(d, checkoutLimit);
    }
    return nightBooked(d);
  }

  function pick(d: Date) {
    if (isDisabled(d)) return;
    if (choosingCheckout && isAfter(d, start)) onChange(checkIn, toDay(d));
    else onChange(toDay(d), null);
  }

  const rangeEnd = end ?? (choosingCheckout && hover && isAfter(hover, start) && !isDisabled(hover) ? hover : null);

  return (
    <div className="select-none">
      <div className={clsx("relative grid gap-x-12 gap-y-6", months === 2 ? "md:grid-cols-2" : "")}>
        <button
          type="button"
          aria-label="Previous month"
          disabled={!isAfter(visible, startOfMonth(today))}
          onClick={() => setVisible((v) => addMonths(v, -1))}
          className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full hover:bg-bg-hover disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setVisible((v) => addMonths(v, 1))}
          className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full hover:bg-bg-hover"
        >
          <ChevronRight size={16} />
        </button>

        {Array.from({ length: months }, (_, i) => addMonths(visible, i)).map((month, i) => (
          <div key={month.toISOString()} className={clsx(i === 1 && "hidden md:block")}>
            <h3 className="mb-4 text-center text-base font-semibold leading-8">{format(month, "MMMM yyyy")}</h3>
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-fg-secondary">
              {WEEKDAYS.map((w, j) => (
                <div key={j} className="pb-2">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
              {Array.from({ length: getDay(month) }, (_, j) => (
                <div key={`pad-${j}`} />
              ))}
              {eachDayOfInterval({ start: month, end: endOfMonth(month) }).map((day) => {
                const disabled = isDisabled(day);
                const isStart = start !== null && isSameDay(day, start);
                const isEnd = rangeEnd !== null && isSameDay(day, rangeEnd);
                const inRange = start && rangeEnd && isAfter(day, start) && isBefore(day, rangeEnd);
                return (
                  <div
                    key={day.toISOString()}
                    className={clsx(
                      "relative h-12 py-px",
                      inRange && "bg-bg-secondary",
                      isStart && rangeEnd && "rounded-l-full bg-bg-secondary",
                      isEnd && "rounded-r-full bg-bg-secondary",
                    )}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => pick(day)}
                      onMouseEnter={() => setHover(day)}
                      aria-label={format(day, "EEEE, d MMMM yyyy")}
                      aria-pressed={isStart || isEnd}
                      className={clsx(
                        "mx-auto grid h-full aspect-square place-items-center rounded-full text-sm font-semibold",
                        disabled
                          ? "text-fg-tertiary line-through decoration-1"
                          : "hover:border hover:border-fg",
                        (isStart || isEnd) && "bg-fg text-bg hover:border-0",
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Earliest free window of `nights` nights, used to pre-fill sensible dates. */
export function firstAvailable(booked: DateRange[], nights: number, from = addDays(new Date(), 7)) {
  let d = startOfDay(from);
  for (let i = 0; i < 365; i++) {
    const end = addDays(d, nights);
    const clash = booked.some((r) => isBefore(parseDay(r.check_in)!, end) && isBefore(d, parseDay(r.check_out)!));
    if (!clash) return { checkIn: toDay(d), checkOut: toDay(end) };
    d = addDays(d, 1);
  }
  return null;
}

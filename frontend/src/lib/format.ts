import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** ₹12,345 */
export const money = (amount: number) => inr.format(amount);

/** Dates travel as "YYYY-MM-DD" strings. Parsed as local dates, so no timezone shifts. */
export const parseDay = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
};

export const toDay = (d: Date) => format(d, "yyyy-MM-dd");

export const nightsBetween = (checkIn: string, checkOut: string) =>
  differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));

/** "10–15 Oct" or "28 Oct – 2 Nov", like Airbnb's cards. */
export function shortRange(checkIn: string, checkOut: string): string {
  const a = parseISO(checkIn);
  const b = parseISO(checkOut);
  if (a.getMonth() === b.getMonth()) return `${format(a, "d")}–${format(b, "d MMM")}`;
  return `${format(a, "d MMM")} – ${format(b, "d MMM")}`;
}

export const longDate = (value: string) => format(parseISO(value), "d MMM yyyy");

export const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;

/** "Flat in Goa" */
export const listingHeadline = (l: { property_type: string; city: string; room_type: string }) =>
  l.room_type === "private_room" ? `Room in ${l.city}` : `${l.property_type} in ${l.city}`;

export const roomTypeLabel: Record<string, string> = {
  entire_home: "Entire home",
  private_room: "Room",
  shared_room: "Shared room",
};

export const rating = (avg: number | null) => (avg === null ? null : avg.toFixed(avg % 1 === 0 ? 1 : 2));

/** Unsplash URLs accept a width; other image URLs are returned unchanged. */
export function imageUrl(url: string, width: number): string {
  if (!url.includes("images.unsplash.com")) return url;
  const u = new URL(url);
  u.searchParams.set("w", String(width));
  return u.toString();
}

export const yearsSinceCount = (iso: string) => Math.floor(differenceInCalendarDays(new Date(), parseISO(iso)) / 365);

/** "3 years hosting" */
export function yearsSince(iso: string): string {
  const days = differenceInCalendarDays(new Date(), parseISO(iso));
  if (days < 30) return "New host";
  if (days < 365) return plural(Math.floor(days / 30), "month") + " hosting";
  return plural(Math.floor(days / 365), "year") + " hosting";
}

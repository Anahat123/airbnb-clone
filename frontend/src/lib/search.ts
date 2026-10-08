// The search lives in the URL (/s?location=Goa&check_in=...), so results are shareable,
// survive refreshes and work with the browser's back button.

export interface Guests {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export interface SearchState extends Guests {
  location: string;
  checkIn: string | null;
  checkOut: string | null;
}

export const EMPTY_GUESTS: Guests = { adults: 0, children: 0, infants: 0, pets: 0 };

type ParamsLike = { get(key: string): string | null };

const int = (v: string | null) => Math.max(0, parseInt(v ?? "0", 10) || 0);

export function readSearch(params: ParamsLike): SearchState {
  return {
    location: params.get("location") ?? "",
    checkIn: params.get("check_in"),
    checkOut: params.get("check_out"),
    adults: int(params.get("adults")),
    children: int(params.get("children")),
    infants: int(params.get("infants")),
    pets: int(params.get("pets")),
  };
}

export function searchToParams(s: Partial<SearchState>): Record<string, string> {
  const out: Record<string, string> = {};
  if (s.location) out.location = s.location;
  if (s.checkIn && s.checkOut) {
    out.check_in = s.checkIn;
    out.check_out = s.checkOut;
  }
  if (s.adults) out.adults = String(s.adults);
  if (s.children) out.children = String(s.children);
  if (s.infants) out.infants = String(s.infants);
  if (s.pets) out.pets = String(s.pets);
  return out;
}

export function guestLabel(g: Guests, empty = "Add guests"): string {
  const guests = g.adults + g.children;
  if (!guests) return empty;
  const parts = [`${guests} guest${guests > 1 ? "s" : ""}`];
  if (g.infants) parts.push(`${g.infants} infant${g.infants > 1 ? "s" : ""}`);
  if (g.pets) parts.push(`${g.pets} pet${g.pets > 1 ? "s" : ""}`);
  return parts.join(", ");
}

// Thin fetch wrapper around the FastAPI backend. Every call goes through `request`
// so errors, auth headers and JSON handling live in one place.

import type {
  Availability,
  Booking,
  Destination,
  HomeSection,
  HostListingRow,
  HostStats,
  ListingDetail,
  ListingWrite,
  Meta,
  Paginated,
  Quote,
  Review,
  ReviewPage,
  User,
  WishlistDetail,
  WishlistSummary,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const TOKEN_KEY = "airbnb_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export function toQuery(params: Query): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== false) qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(isForm || !init.body ? {} : { "Content-Type": "application/json" }),
      ...authHeader(),
      ...init.headers,
    },
  });
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      // FastAPI validation errors: [{loc, msg}, ...]
      else if (Array.isArray(body.detail) && body.detail[0]?.msg)
        message = String(body.detail[0].msg).replace(/^Value error, /, "");
    } catch {}
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  // Reference & public data
  meta: () => request<Meta>("/api/meta"),
  home: (group: "city" | "category" = "city") => request<HomeSection[]>(`/api/home${toQuery({ group })}`),
  destinations: (q: string) => request<Destination[]>(`/api/destinations${toQuery({ q })}`),
  search: (params: Query) => request<Paginated>(`/api/listings${toQuery(params)}`),
  listing: (id: number | string) => request<ListingDetail>(`/api/listings/${id}`),
  availability: (id: number | string) => request<Availability>(`/api/listings/${id}/availability`),
  quote: (id: number | string, check_in: string, check_out: string) =>
    request<Quote>(`/api/listings/${id}/quote${toQuery({ check_in, check_out })}`),
  reviews: (id: number | string, page = 1, page_size = 6) =>
    request<ReviewPage>(`/api/listings/${id}/reviews${toQuery({ page, page_size })}`),

  // Auth
  login: (email: string) =>
    request<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: json({ email }) }),
  signup: (name: string, email: string) =>
    request<{ token: string; user: User }>("/api/auth/signup", { method: "POST", body: json({ name, email }) }),
  demoUsers: () => request<User[]>("/api/auth/demo-users"),
  me: () => request<User>("/api/auth/me"),
  becomeHost: () => request<User>("/api/auth/become-host", { method: "POST" }),

  // Bookings & reviews
  createBooking: (body: {
    listing_id: number;
    check_in: string;
    check_out: string;
    adults: number;
    children: number;
    infants: number;
    pets: number;
  }) => request<Booking>("/api/bookings", { method: "POST", body: json(body) }),
  myTrips: () => request<Booking[]>("/api/bookings/me"),
  booking: (id: number | string) => request<Booking>(`/api/bookings/${id}`),
  cancelBooking: (id: number) => request<Booking>(`/api/bookings/${id}/cancel`, { method: "POST" }),
  createReview: (body: Record<string, number | string>) =>
    request<Review>("/api/reviews", { method: "POST", body: json(body) }),

  // Wishlists
  wishlists: () => request<WishlistSummary[]>("/api/wishlists"),
  wishlist: (id: number | string) => request<WishlistDetail>(`/api/wishlists/${id}`),
  createWishlist: (name: string, listing_id?: number) =>
    request<WishlistSummary>("/api/wishlists", { method: "POST", body: json({ name, listing_id }) }),
  renameWishlist: (id: number, name: string) =>
    request<WishlistSummary>(`/api/wishlists/${id}`, { method: "PATCH", body: json({ name }) }),
  deleteWishlist: (id: number) => request<void>(`/api/wishlists/${id}`, { method: "DELETE" }),
  addToWishlist: (id: number, listing_id: number) =>
    request<WishlistSummary>(`/api/wishlists/${id}/items`, { method: "POST", body: json({ listing_id }) }),
  unsave: (listing_id: number) => request<void>(`/api/wishlists/items/${listing_id}`, { method: "DELETE" }),

  // Host
  hostStats: () => request<HostStats>("/api/host/stats"),
  hostListings: () => request<HostListingRow[]>("/api/host/listings"),
  hostListing: (id: number | string) => request<ListingDetail>(`/api/host/listings/${id}`),
  createListing: (body: ListingWrite) =>
    request<ListingDetail>("/api/host/listings", { method: "POST", body: json(body) }),
  updateListing: (id: number, body: ListingWrite) =>
    request<ListingDetail>(`/api/host/listings/${id}`, { method: "PUT", body: json(body) }),
  deleteListing: (id: number) => request<void>(`/api/host/listings/${id}`, { method: "DELETE" }),
  hostReservations: () => request<Booking[]>("/api/host/reservations"),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string; storage: string }>("/api/uploads", { method: "POST", body: form });
  },
};

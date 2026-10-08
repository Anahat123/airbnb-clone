// TypeScript mirrors of the backend's Pydantic schemas (backend/app/schemas.py).

export type RoomType = "entire_home" | "private_room" | "shared_room";
export type BookingStatus = "confirmed" | "cancelled";

export interface User {
  id: number;
  name: string;
  email?: string;
  avatar_url: string | null;
  city: string | null;
  is_host: boolean;
  created_at: string;
}

export interface HostSummary extends User {
  bio: string | null;
  is_superhost: boolean;
  review_count: number;
  average_rating: number | null;
  listing_count: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
  group: string;
}

export interface PriceBucket {
  min: number;
  max: number;
  count: number;
}

export interface Meta {
  categories: Category[];
  amenities: Amenity[];
  property_types: string[];
  price_histogram: PriceBucket[];
  price_min: number;
  price_max: number;
}

export interface ListingCard {
  id: number;
  title: string;
  city: string;
  state: string;
  country: string;
  property_type: string;
  room_type: RoomType;
  latitude: number;
  longitude: number;
  price_per_night: number;
  total_price: number | null;
  nights: number | null;
  photos: string[];
  average_rating: number | null;
  review_count: number;
  is_guest_favourite: boolean;
  host_name: string;
  is_superhost: boolean;
  bedrooms: number;
  beds: number;
  max_guests: number;
}

export interface Paginated {
  items: ListingCard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface HomeSection {
  title: string;
  city: string;
  items: ListingCard[];
}

export interface Photo {
  id: number;
  url: string;
  caption: string | null;
  position: number;
}

export type RatingKey = "cleanliness" | "accuracy" | "check_in" | "communication" | "location" | "value";

export interface ListingDetail extends ListingCard {
  description: string;
  address: string;
  bathrooms: number;
  cleaning_fee: number;
  min_nights: number;
  category: Category | null;
  photo_items: Photo[];
  amenities: Amenity[];
  host: HostSummary;
  rating_breakdown: Partial<Record<RatingKey, number | null>>;
  rating_distribution: Record<string, number>;
  is_active: boolean;
  created_at: string;
}

export interface DateRange {
  check_in: string;
  check_out: string;
}

export interface Availability {
  listing_id: number;
  min_nights: number;
  booked: DateRange[];
}

export interface Quote {
  available: boolean;
  nights: number;
  nightly_rate: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total: number;
}

export interface Booking {
  id: number;
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  infants: number;
  pets: number;
  nights: number;
  nightly_rate: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  listing: {
    id: number;
    title: string;
    city: string;
    state: string;
    property_type: string;
    photo: string | null;
    host_name: string;
  };
  guest: User;
  has_review: boolean;
  can_review: boolean;
}

export interface Review {
  id: number;
  listing_id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: User;
}

export interface ReviewPage {
  items: Review[];
  total: number;
  page: number;
  total_pages: number;
}

export interface WishlistSummary {
  id: number;
  name: string;
  item_count: number;
  cover_photos: string[];
  listing_ids: number[];
}

export interface WishlistDetail {
  id: number;
  name: string;
  items: ListingCard[];
}

export interface HostStats {
  listing_count: number;
  upcoming_bookings: number;
  hosting_now: number;
  total_earnings: number;
  average_rating: number | null;
  review_count: number;
  is_superhost: boolean;
}

export interface HostListingRow extends ListingCard {
  is_active: boolean;
  upcoming_bookings: number;
  updated_at: string;
}

export interface ListingWrite {
  title: string;
  description: string;
  property_type: string;
  room_type: RoomType;
  category_id: number | null;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  min_nights: number;
  amenity_ids: number[];
  photo_urls: string[];
  is_active: boolean;
}

export interface Destination {
  city: string;
  state: string;
  country: string;
  count: number;
}

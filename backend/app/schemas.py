"""Pydantic models: the JSON shapes the API accepts and returns."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator, model_validator

from .models import BookingStatus, RoomType


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Users & auth ----------


class UserPublic(ORMModel):
    id: int
    name: str
    avatar_url: str | None
    city: str | None
    is_host: bool
    created_at: datetime


class UserMe(UserPublic):
    email: str


class HostSummary(UserPublic):
    bio: str | None
    is_superhost: bool
    review_count: int
    average_rating: float | None
    listing_count: int


class LoginRequest(BaseModel):
    email: EmailStr


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr


class AuthResponse(BaseModel):
    token: str
    user: UserMe


# ---------- Reference data ----------


class CategoryOut(ORMModel):
    id: int
    slug: str
    name: str
    icon: str


class AmenityOut(ORMModel):
    id: int
    name: str
    icon: str
    group: str


class PriceBucket(BaseModel):
    min: int
    max: int
    count: int


class MetaOut(BaseModel):
    categories: list[CategoryOut]
    amenities: list[AmenityOut]
    property_types: list[str]
    price_histogram: list[PriceBucket]
    price_min: int
    price_max: int


# ---------- Listings ----------


class PhotoOut(ORMModel):
    id: int
    url: str
    caption: str | None
    position: int


class ListingCard(BaseModel):
    """Everything a listing card or map pin needs, nothing more."""

    id: int
    title: str
    city: str
    state: str
    country: str
    property_type: str
    room_type: RoomType
    latitude: float
    longitude: float
    price_per_night: int
    # Filled only when the search has dates: total for the stay incl. fees.
    total_price: int | None = None
    nights: int | None = None
    photos: list[str]
    average_rating: float | None
    review_count: int
    is_guest_favourite: bool
    host_name: str
    is_superhost: bool
    bedrooms: int
    beds: int
    max_guests: int


class Paginated(BaseModel):
    items: list[ListingCard]
    total: int
    page: int
    page_size: int
    total_pages: int


class HomeSection(BaseModel):
    title: str
    city: str
    items: list[ListingCard]


class RatingBreakdown(BaseModel):
    cleanliness: float | None = None
    accuracy: float | None = None
    check_in: float | None = None
    communication: float | None = None
    location: float | None = None
    value: float | None = None


class ListingDetail(ListingCard):
    description: str
    address: str
    bathrooms: float
    cleaning_fee: int
    min_nights: int
    category: CategoryOut | None
    photo_items: list[PhotoOut]
    amenities: list[AmenityOut]
    host: HostSummary
    rating_breakdown: RatingBreakdown
    rating_distribution: dict[int, int]
    is_active: bool
    created_at: datetime


class ListingWrite(BaseModel):
    """Body for creating or fully updating a listing."""

    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=5000)
    property_type: str = Field(min_length=2, max_length=30)
    room_type: RoomType = RoomType.entire_home
    category_id: int | None = None
    address: str = Field(min_length=3, max_length=255)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    country: str = "India"
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    price_per_night: int = Field(gt=0, le=1_000_000)
    cleaning_fee: int = Field(ge=0, le=100_000, default=0)
    max_guests: int = Field(ge=1, le=16)
    bedrooms: int = Field(ge=0, le=50)
    beds: int = Field(ge=1, le=50)
    bathrooms: float = Field(ge=0, le=50)
    min_nights: int = Field(ge=1, le=30, default=1)
    amenity_ids: list[int] = []
    photo_urls: list[HttpUrl] = Field(min_length=1, max_length=20)
    is_active: bool = True


# ---------- Availability & pricing ----------


class DateRange(BaseModel):
    check_in: date
    check_out: date


class AvailabilityOut(BaseModel):
    listing_id: int
    min_nights: int
    booked: list[DateRange]


class QuoteOut(BaseModel):
    available: bool
    nights: int
    nightly_rate: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    taxes: int
    total: int


# ---------- Bookings ----------


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    adults: int = Field(ge=1, le=16)
    children: int = Field(ge=0, le=15, default=0)
    infants: int = Field(ge=0, le=5, default=0)
    pets: int = Field(ge=0, le=5, default=0)

    @model_validator(mode="after")
    def _dates_in_order(self):
        if self.check_out <= self.check_in:
            raise ValueError("Check-out must be after check-in")
        return self


class BookingListing(BaseModel):
    id: int
    title: str
    city: str
    state: str
    property_type: str
    photo: str | None
    host_name: str


class BookingOut(ORMModel):
    id: int
    listing_id: int
    check_in: date
    check_out: date
    guests: int
    infants: int
    pets: int
    nights: int
    nightly_rate: int
    cleaning_fee: int
    service_fee: int
    taxes: int
    total_price: int
    status: BookingStatus
    created_at: datetime
    listing: BookingListing
    guest: UserPublic
    has_review: bool
    can_review: bool


# ---------- Reviews ----------


class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
    cleanliness: int = Field(ge=1, le=5)
    accuracy: int = Field(ge=1, le=5)
    check_in: int = Field(ge=1, le=5)
    communication: int = Field(ge=1, le=5)
    location: int = Field(ge=1, le=5)
    value: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=2000)

    @field_validator("comment")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class ReviewOut(ORMModel):
    id: int
    listing_id: int
    rating: int
    comment: str
    created_at: datetime
    author: UserPublic


class ReviewPage(BaseModel):
    items: list[ReviewOut]
    total: int
    page: int
    total_pages: int


# ---------- Wishlists ----------


class WishlistCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    listing_id: int | None = None  # optionally save a listing straight into the new list


class WishlistSummary(BaseModel):
    id: int
    name: str
    item_count: int
    cover_photos: list[str]
    listing_ids: list[int]


class WishlistDetail(BaseModel):
    id: int
    name: str
    items: list[ListingCard]


# ---------- Host dashboard ----------


class HostStats(BaseModel):
    listing_count: int
    upcoming_bookings: int
    hosting_now: int
    total_earnings: int
    average_rating: float | None
    review_count: int
    is_superhost: bool


class UploadOut(BaseModel):
    url: str
    storage: str  # "cloudinary" or "local"

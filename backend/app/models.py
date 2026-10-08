"""SQLAlchemy ORM models — the database schema.

Relationships at a glance:
    users 1─* listings (as host)        users 1─* bookings (as guest)
    listings 1─* listing_photos         listings *─* amenities (listing_amenities)
    listings *─1 categories             listings 1─* bookings
    bookings 1─0..1 reviews             users 1─* reviews (as author)
    users 1─* wishlists 1─* wishlist_items *─1 listings
"""

from __future__ import annotations

import enum
from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RoomType(str, enum.Enum):
    entire_home = "entire_home"
    private_room = "private_room"
    shared_room = "shared_room"


class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"


# Pure join table: a listing has many amenities, an amenity belongs to many listings.
listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    # Guest vs host: every user can book; only hosts can manage listings.
    is_host: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    listings: Mapped[list[Listing]] = relationship(back_populates="host", cascade="all, delete-orphan")
    bookings: Mapped[list[Booking]] = relationship(back_populates="guest")
    wishlists: Mapped[list[Wishlist]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    """The icon row on the search page (Beachfront, Cabins, Amazing pools, ...)."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(50))
    icon: Mapped[str] = mapped_column(String(50))  # icon key the frontend maps to an SVG


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    icon: Mapped[str] = mapped_column(String(50))
    group: Mapped[str] = mapped_column(String(50))  # "Essentials", "Features", "Safety", ...


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("price_per_night > 0", name="ck_listing_price_positive"),
        CheckConstraint("max_guests >= 1", name="ck_listing_guests_positive"),
        Index("ix_listings_city", "city"),
        Index("ix_listings_price", "price_per_night"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"))

    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    property_type: Mapped[str] = mapped_column(String(30))  # House, Flat, Villa, Cabin, ...
    room_type: Mapped[RoomType] = mapped_column(Enum(RoomType), default=RoomType.entire_home)

    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100), default="India")
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

    # Money is stored as whole rupees (integers) to avoid float rounding errors.
    price_per_night: Mapped[int] = mapped_column(Integer)
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)

    max_guests: Mapped[int] = mapped_column(Integer)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    beds: Mapped[int] = mapped_column(Integer, default=1)
    bathrooms: Mapped[float] = mapped_column(Float, default=1)
    min_nights: Mapped[int] = mapped_column(Integer, default=1)

    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    host: Mapped[User] = relationship(back_populates="listings")
    category: Mapped[Category | None] = relationship()
    photos: Mapped[list[ListingPhoto]] = relationship(
        back_populates="listing", cascade="all, delete-orphan", order_by="ListingPhoto.position"
    )
    amenities: Mapped[list[Amenity]] = relationship(secondary=listing_amenities)
    bookings: Mapped[list[Booking]] = relationship(back_populates="listing", cascade="all, delete-orphan")
    reviews: Mapped[list[Review]] = relationship(back_populates="listing", cascade="all, delete-orphan")


class ListingPhoto(Base):
    __tablename__ = "listing_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(500))
    caption: Mapped[str | None] = mapped_column(String(200))
    position: Mapped[int] = mapped_column(Integer, default=0)  # 0 = cover photo

    listing: Mapped[Listing] = relationship(back_populates="photos")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_booking_dates_order"),
        CheckConstraint("guests >= 1", name="ck_booking_guests_positive"),
        # The availability check scans bookings by listing and date range.
        Index("ix_bookings_listing_dates", "listing_id", "check_in", "check_out"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)  # exclusive: the guest leaves that morning
    guests: Mapped[int] = mapped_column(Integer)  # adults + children (counts toward max_guests)
    infants: Mapped[int] = mapped_column(Integer, default=0)
    pets: Mapped[int] = mapped_column(Integer, default=0)

    # Price snapshot at booking time, so later price edits don't change past bookings.
    nights: Mapped[int] = mapped_column(Integer)
    nightly_rate: Mapped[int] = mapped_column(Integer)
    cleaning_fee: Mapped[int] = mapped_column(Integer)
    service_fee: Mapped[int] = mapped_column(Integer)
    taxes: Mapped[int] = mapped_column(Integer)
    total_price: Mapped[int] = mapped_column(Integer)

    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.confirmed)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    listing: Mapped[Listing] = relationship(back_populates="bookings")
    guest: Mapped[User] = relationship(back_populates="bookings")
    review: Mapped[Review | None] = relationship(back_populates="booking")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating_range"),
        # One review per stay.
        UniqueConstraint("booking_id", name="uq_review_booking"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    booking_id: Mapped[int | None] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"))

    rating: Mapped[int] = mapped_column(Integer)  # overall 1-5
    # Category ratings shown on the listing page.
    cleanliness: Mapped[int] = mapped_column(Integer)
    accuracy: Mapped[int] = mapped_column(Integer)
    check_in: Mapped[int] = mapped_column(Integer)
    communication: Mapped[int] = mapped_column(Integer)
    location: Mapped[int] = mapped_column(Integer)
    value: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    listing: Mapped[Listing] = relationship(back_populates="reviews")
    author: Mapped[User] = relationship()
    booking: Mapped[Booking | None] = relationship(back_populates="review")


class Wishlist(Base):
    __tablename__ = "wishlists"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[User] = relationship(back_populates="wishlists")
    items: Mapped[list[WishlistItem]] = relationship(
        back_populates="wishlist", cascade="all, delete-orphan", order_by="WishlistItem.created_at.desc()"
    )


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    wishlist_id: Mapped[int] = mapped_column(ForeignKey("wishlists.id", ondelete="CASCADE"), primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    wishlist: Mapped[Wishlist] = relationship(back_populates="items")
    listing: Mapped[Listing] = relationship()

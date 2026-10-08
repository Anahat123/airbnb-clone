"""Turn ORM objects into API schemas.

Rating and Superhost stats are loaded for a whole page of listings in two GROUP BY
queries, instead of one query per card (the "N+1 queries" problem).
"""

from datetime import date

from sqlalchemy.orm import Session

from . import schemas
from .models import Booking, BookingStatus, Listing, User
from .services import pricing, ratings


def listing_cards(
    db: Session,
    listings: list[Listing],
    check_in: date | None = None,
    check_out: date | None = None,
) -> list[schemas.ListingCard]:
    listing_stats = ratings.stats_for_listings(db, [l.id for l in listings])
    host_stats = ratings.host_stats(db, list({l.host_id for l in listings}))

    cards = []
    for listing in listings:
        stats = listing_stats.get(listing.id, ratings.EMPTY)
        # Like airbnb.co.in, cards show the all-in price: for the searched dates, or for one night.
        if check_in and check_out and check_out > check_in:
            q = pricing.quote(listing.price_per_night, listing.cleaning_fee, check_in, check_out)
        else:
            q = pricing.one_night(listing.price_per_night, listing.cleaning_fee)
        total, nights = q.total, q.nights
        cards.append(
            schemas.ListingCard(
                id=listing.id,
                title=listing.title,
                city=listing.city,
                state=listing.state,
                country=listing.country,
                property_type=listing.property_type,
                room_type=listing.room_type,
                latitude=listing.latitude,
                longitude=listing.longitude,
                price_per_night=listing.price_per_night,
                total_price=total,
                nights=nights,
                photos=[p.url for p in listing.photos[:5]],
                average_rating=stats.average,
                review_count=stats.count,
                is_guest_favourite=stats.is_guest_favourite,
                host_name=listing.host.name.split(" ")[0],
                is_superhost=ratings.is_superhost(host_stats.get(listing.host_id)),
                bedrooms=listing.bedrooms,
                beds=listing.beds,
                max_guests=listing.max_guests,
            )
        )
    return cards


def host_summary(db: Session, host: User) -> schemas.HostSummary:
    stats = ratings.host_stats(db, [host.id]).get(host.id, ratings.EMPTY)
    return schemas.HostSummary(
        **schemas.UserPublic.model_validate(host).model_dump(),
        bio=host.bio,
        is_superhost=ratings.is_superhost(stats),
        review_count=stats.count,
        average_rating=stats.average,
        listing_count=len(host.listings),
    )


def listing_detail(db: Session, listing: Listing) -> schemas.ListingDetail:
    card = listing_cards(db, [listing])[0]
    return schemas.ListingDetail(
        **card.model_dump(exclude={"photos"}),
        photos=[p.url for p in listing.photos],
        description=listing.description,
        address=listing.address,
        bathrooms=listing.bathrooms,
        cleaning_fee=listing.cleaning_fee,
        min_nights=listing.min_nights,
        category=listing.category,
        photo_items=listing.photos,
        amenities=listing.amenities,
        host=host_summary(db, listing.host),
        rating_breakdown=schemas.RatingBreakdown(**ratings.category_averages(db, listing.id)),
        rating_distribution=ratings.rating_distribution(db, listing.id),
        is_active=listing.is_active,
        created_at=listing.created_at,
    )


def booking_out(booking: Booking, today: date) -> schemas.BookingOut:
    listing = booking.listing
    return schemas.BookingOut(
        id=booking.id,
        listing_id=booking.listing_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guests=booking.guests,
        infants=booking.infants,
        pets=booking.pets,
        nights=booking.nights,
        nightly_rate=booking.nightly_rate,
        cleaning_fee=booking.cleaning_fee,
        service_fee=booking.service_fee,
        taxes=booking.taxes,
        total_price=booking.total_price,
        status=booking.status,
        created_at=booking.created_at,
        listing=schemas.BookingListing(
            id=listing.id,
            title=listing.title,
            city=listing.city,
            state=listing.state,
            property_type=listing.property_type,
            photo=listing.photos[0].url if listing.photos else None,
            host_name=listing.host.name,
        ),
        guest=schemas.UserPublic.model_validate(booking.guest),
        has_review=booking.review is not None,
        can_review=can_review(booking, today),
    )


def can_review(booking: Booking, today: date) -> bool:
    """A guest may review a confirmed stay once it has ended, once."""
    return booking.status == BookingStatus.confirmed and booking.check_out <= today and booking.review is None

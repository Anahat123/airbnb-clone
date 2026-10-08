"""Host experience: dashboard stats, listing CRUD, and reservations on the host's listings."""

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .. import schemas, serializers
from ..auth import require_host
from ..database import get_db
from ..models import Amenity, Booking, BookingStatus, Category, Listing, ListingPhoto, User
from ..services import ratings
from .bookings import booking_query

router = APIRouter(prefix="/api/host", tags=["host"])


class HostListingRow(schemas.ListingCard):
    is_active: bool
    upcoming_bookings: int
    updated_at: datetime


def _own_listing(db: Session, listing_id: int, host: User) -> Listing:
    listing = db.scalar(
        select(Listing)
        .where(Listing.id == listing_id)
        .options(selectinload(Listing.photos), selectinload(Listing.amenities), selectinload(Listing.host))
    )
    if listing is None or listing.host_id != host.id:
        raise HTTPException(404, "Listing not found")
    return listing


def _apply(db: Session, listing: Listing, body: schemas.ListingWrite) -> None:
    """Copy the request body onto a listing, validating the foreign keys it references."""
    if body.category_id is not None and db.get(Category, body.category_id) is None:
        raise HTTPException(422, "Unknown category")
    amenities = db.scalars(select(Amenity).where(Amenity.id.in_(body.amenity_ids))).all()
    if len(amenities) != len(set(body.amenity_ids)):
        raise HTTPException(422, "Unknown amenity")

    for field, value in body.model_dump(exclude={"amenity_ids", "photo_urls"}).items():
        setattr(listing, field, value)
    listing.amenities = list(amenities)
    # Photos are replaced as a whole; their order in the request becomes their position.
    listing.photos = [ListingPhoto(url=str(url), position=i) for i, url in enumerate(body.photo_urls)]


@router.get("/stats", response_model=schemas.HostStats)
def host_stats(host: User = Depends(require_host), db: Session = Depends(get_db)):
    today = date.today()
    mine = select(Listing.id).where(Listing.host_id == host.id)
    confirmed = (Booking.listing_id.in_(mine), Booking.status == BookingStatus.confirmed)
    stats = ratings.host_stats(db, [host.id]).get(host.id, ratings.EMPTY)
    return schemas.HostStats(
        listing_count=db.scalar(select(func.count()).select_from(mine.subquery())) or 0,
        upcoming_bookings=db.scalar(select(func.count(Booking.id)).where(*confirmed, Booking.check_in > today)) or 0,
        hosting_now=db.scalar(
            select(func.count(Booking.id)).where(*confirmed, Booking.check_in <= today, Booking.check_out > today)
        )
        or 0,
        total_earnings=db.scalar(
            select(func.coalesce(func.sum(Booking.nightly_rate * Booking.nights + Booking.cleaning_fee), 0)).where(
                *confirmed
            )
        )
        or 0,
        average_rating=stats.average,
        review_count=stats.count,
        is_superhost=ratings.is_superhost(stats),
    )


@router.get("/listings", response_model=list[HostListingRow])
def my_listings(host: User = Depends(require_host), db: Session = Depends(get_db)):
    listings = db.scalars(
        select(Listing)
        .where(Listing.host_id == host.id)
        .options(selectinload(Listing.photos), selectinload(Listing.host))
        .order_by(Listing.updated_at.desc())
    ).all()
    upcoming = dict(
        db.execute(
            select(Booking.listing_id, func.count(Booking.id))
            .where(
                Booking.listing_id.in_([l.id for l in listings]),
                Booking.status == BookingStatus.confirmed,
                Booking.check_out > date.today(),
            )
            .group_by(Booking.listing_id)
        ).all()
    )
    cards = serializers.listing_cards(db, listings)
    return [
        HostListingRow(
            **card.model_dump(),
            is_active=listing.is_active,
            upcoming_bookings=upcoming.get(listing.id, 0),
            updated_at=listing.updated_at,
        )
        for card, listing in zip(cards, listings)
    ]


@router.get("/listings/{listing_id}", response_model=schemas.ListingDetail)
def get_my_listing(listing_id: int, host: User = Depends(require_host), db: Session = Depends(get_db)):
    return serializers.listing_detail(db, _own_listing(db, listing_id, host))


@router.post("/listings", response_model=schemas.ListingDetail, status_code=status.HTTP_201_CREATED)
def create_listing(body: schemas.ListingWrite, host: User = Depends(require_host), db: Session = Depends(get_db)):
    listing = Listing(host_id=host.id)
    _apply(db, listing, body)
    db.add(listing)
    db.commit()
    return serializers.listing_detail(db, _own_listing(db, listing.id, host))


@router.put("/listings/{listing_id}", response_model=schemas.ListingDetail)
def update_listing(
    listing_id: int, body: schemas.ListingWrite, host: User = Depends(require_host), db: Session = Depends(get_db)
):
    listing = _own_listing(db, listing_id, host)
    _apply(db, listing, body)
    db.commit()
    return serializers.listing_detail(db, _own_listing(db, listing.id, host))


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(listing_id: int, host: User = Depends(require_host), db: Session = Depends(get_db)):
    listing = _own_listing(db, listing_id, host)
    has_upcoming = db.scalar(
        select(Booking.id)
        .where(
            Booking.listing_id == listing.id,
            Booking.status == BookingStatus.confirmed,
            Booking.check_out > date.today(),
        )
        .limit(1)
    )
    if has_upcoming:
        raise HTTPException(400, "This listing has upcoming reservations. Unlist it instead, or cancel them first.")
    db.delete(listing)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/reservations", response_model=list[schemas.BookingOut])
def my_reservations(host: User = Depends(require_host), db: Session = Depends(get_db)):
    mine = select(Listing.id).where(Listing.host_id == host.id)
    bookings = db.scalars(booking_query().where(Booking.listing_id.in_(mine)).order_by(Booking.check_in.desc())).all()
    today = date.today()
    return [serializers.booking_out(b, today) for b in bookings]

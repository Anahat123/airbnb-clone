"""Booking flow: create (with overlap check), list my trips, view, cancel."""

import threading
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import schemas, serializers
from ..auth import get_current_user
from ..database import get_db
from ..models import Booking, BookingStatus, Listing, User
from ..services import availability, pricing

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

# The availability check and the INSERT must happen as one step, or two guests
# booking the same dates at the same moment could both pass the check. The app runs
# as a single process, so a lock is enough; with several workers you would use a
# database-level lock or exclusion constraint instead.
_booking_lock = threading.Lock()


def booking_query():
    return select(Booking).options(
        selectinload(Booking.listing).selectinload(Listing.photos),
        selectinload(Booking.listing).selectinload(Listing.host),
        selectinload(Booking.guest),
        selectinload(Booking.review),
    )


@router.post("", response_model=schemas.BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(body: schemas.BookingCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    listing = db.get(Listing, body.listing_id)
    if listing is None or not listing.is_active:
        raise HTTPException(404, "Listing not found")
    if listing.host_id == user.id:
        raise HTTPException(400, "You can't book your own listing")

    today = date.today()
    if body.check_in < today:
        raise HTTPException(400, "Check-in can't be in the past")
    nights = pricing.nights_between(body.check_in, body.check_out)
    if nights < listing.min_nights:
        raise HTTPException(400, f"This place has a {listing.min_nights}-night minimum")
    guests = body.adults + body.children
    if guests > listing.max_guests:
        raise HTTPException(400, f"This place has a maximum of {listing.max_guests} guests")
    if body.pets and not any(a.name == "Pets allowed" for a in listing.amenities):
        raise HTTPException(400, "This place doesn't allow pets")

    q = pricing.quote(listing.price_per_night, listing.cleaning_fee, body.check_in, body.check_out)

    with _booking_lock:
        if not availability.is_available(db, listing.id, body.check_in, body.check_out):
            raise HTTPException(status.HTTP_409_CONFLICT, "Those dates are no longer available")
        booking = Booking(
            listing_id=listing.id,
            guest_id=user.id,
            check_in=body.check_in,
            check_out=body.check_out,
            guests=guests,
            infants=body.infants,
            pets=body.pets,
            nights=q.nights,
            nightly_rate=q.nightly_rate,
            cleaning_fee=q.cleaning_fee,
            service_fee=q.service_fee,
            taxes=q.taxes,
            total_price=q.total,
        )
        db.add(booking)
        db.commit()

    booking = db.scalar(booking_query().where(Booking.id == booking.id))
    return serializers.booking_out(booking, today)


@router.get("/me", response_model=list[schemas.BookingOut])
def my_trips(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = db.scalars(booking_query().where(Booking.guest_id == user.id).order_by(Booking.check_in.desc())).all()
    today = date.today()
    return [serializers.booking_out(b, today) for b in bookings]


def _get_visible_booking(db: Session, booking_id: int, user: User) -> Booking:
    booking = db.scalar(booking_query().where(Booking.id == booking_id))
    # Only the guest and the listing's host may see a booking.
    if booking is None or user.id not in (booking.guest_id, booking.listing.host_id):
        raise HTTPException(404, "Booking not found")
    return booking


@router.get("/{booking_id}", response_model=schemas.BookingOut)
def get_booking(booking_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serializers.booking_out(_get_visible_booking(db, booking_id, user), date.today())


@router.post("/{booking_id}/cancel", response_model=schemas.BookingOut)
def cancel_booking(booking_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = _get_visible_booking(db, booking_id, user)
    if booking.status == BookingStatus.cancelled:
        raise HTTPException(400, "This reservation is already cancelled")
    if booking.check_in <= date.today():
        raise HTTPException(400, "Trips that have started can't be cancelled")
    # Cancelling frees the dates: the overlap check only counts confirmed bookings.
    booking.status = BookingStatus.cancelled
    db.commit()
    return serializers.booking_out(booking, date.today())

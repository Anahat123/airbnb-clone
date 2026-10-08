"""Date-availability rules.

Dates are half-open ranges [check_in, check_out): a guest checking out on the 10th
frees the 10th for the next guest's check-in. Two ranges overlap exactly when
    existing.check_in < new.check_out  AND  new.check_in < existing.check_out
"""

from datetime import date

from sqlalchemy import and_, exists, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from ..models import Booking, BookingStatus, Listing


def overlaps(check_in: date, check_out: date) -> ColumnElement[bool]:
    """SQL condition: a booking row overlaps the given range and still holds the dates."""
    return and_(
        Booking.status == BookingStatus.confirmed,
        Booking.check_in < check_out,
        check_in < Booking.check_out,
    )


def listing_is_free(listing_id_col, check_in: date, check_out: date) -> ColumnElement[bool]:
    """SQL condition for search: no confirmed booking on this listing overlaps the range."""
    return ~exists().where(Booking.listing_id == listing_id_col, overlaps(check_in, check_out))


def is_available(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    clash = db.scalar(
        select(Booking.id).where(Booking.listing_id == listing_id, overlaps(check_in, check_out)).limit(1)
    )
    return clash is None


def booked_ranges(db: Session, listing: Listing, from_date: date) -> list[tuple[date, date]]:
    """Confirmed bookings that end on/after from_date, for greying out the calendar."""
    rows = db.execute(
        select(Booking.check_in, Booking.check_out)
        .where(
            Booking.listing_id == listing.id,
            Booking.status == BookingStatus.confirmed,
            Booking.check_out >= from_date,
        )
        .order_by(Booking.check_in)
    ).all()
    return [(r.check_in, r.check_out) for r in rows]

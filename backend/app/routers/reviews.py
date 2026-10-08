"""Reviews: paginated list per listing, and posting a review after a completed stay."""

import math
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .. import schemas, serializers
from ..auth import get_current_user
from ..database import get_db
from ..models import Booking, Review, User

router = APIRouter(prefix="/api", tags=["reviews"])


@router.get("/listings/{listing_id}/reviews", response_model=schemas.ReviewPage)
def list_reviews(
    listing_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(6, ge=1, le=50),
    db: Session = Depends(get_db),
):
    total = db.scalar(select(func.count(Review.id)).where(Review.listing_id == listing_id)) or 0
    items = db.scalars(
        select(Review)
        .where(Review.listing_id == listing_id)
        .options(selectinload(Review.author))
        .order_by(Review.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return schemas.ReviewPage(items=items, total=total, page=page, total_pages=max(1, math.ceil(total / page_size)))


@router.post("/reviews", response_model=schemas.ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(body: schemas.ReviewCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.scalar(select(Booking).where(Booking.id == body.booking_id).options(selectinload(Booking.review)))
    if booking is None or booking.guest_id != user.id:
        raise HTTPException(404, "Booking not found")
    if booking.review is not None:
        raise HTTPException(400, "You've already reviewed this stay")
    if not serializers.can_review(booking, date.today()):
        raise HTTPException(400, "You can review a stay once it's over")

    review = Review(listing_id=booking.listing_id, author_id=user.id, **body.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

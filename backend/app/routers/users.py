"""Public host profiles: the page you reach by clicking a host on a listing."""

import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from .. import schemas, serializers
from ..database import get_db
from ..models import Listing, Review, User

router = APIRouter(prefix="/api/users", tags=["users"])

# Languages aren't stored per user; derive a plausible set from where the host lives.
REGIONAL_LANGUAGE = {
    "Goa": "Konkani",
    "Manali": "Pahari",
    "Jaipur": "Rajasthani",
    "Bengaluru": "Kannada",
    "Alappuzha": "Malayalam",
    "Mumbai": "Marathi",
}


def _languages(user: User) -> list[str]:
    langs = ["English", "Hindi"]
    if user.city in REGIONAL_LANGUAGE:
        langs.append(REGIONAL_LANGUAGE[user.city])
    return langs


@router.get("/{user_id}", response_model=schemas.UserProfile)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "User not found")
    listings = db.scalars(
        select(Listing)
        .where(Listing.host_id == user.id, Listing.is_active.is_(True))
        .options(selectinload(Listing.photos), selectinload(Listing.host))
        .order_by(Listing.id)
    ).all()
    return schemas.UserProfile(
        **serializers.host_summary(db, user).model_dump(),
        languages=_languages(user),
        identity_verified=user.is_host,
        listings=serializers.listing_cards(db, listings),
    )


@router.get("/{user_id}/reviews", response_model=schemas.ReviewPage)
def host_reviews(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(6, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Reviews guests left on any of this host's listings, newest first."""
    on_my_listings = Review.listing_id.in_(select(Listing.id).where(Listing.host_id == user_id))
    total = db.scalar(select(func.count(Review.id)).where(on_my_listings)) or 0
    items = db.scalars(
        select(Review)
        .where(on_my_listings)
        .options(selectinload(Review.author))
        .order_by(Review.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return schemas.ReviewPage(items=items, total=total, page=page, total_pages=max(1, math.ceil(total / page_size)))

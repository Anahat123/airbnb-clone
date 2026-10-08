"""Rating aggregation, Guest favourite and Superhost rules.

Ratings are computed from the reviews table with GROUP BY instead of being stored
on listings, so they can never go stale when a review is added or deleted.
"""

from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Listing, Review

GUEST_FAVOURITE_MIN_RATING = 4.8
GUEST_FAVOURITE_MIN_REVIEWS = 5
SUPERHOST_MIN_RATING = 4.8
SUPERHOST_MIN_REVIEWS = 5


@dataclass(frozen=True)
class RatingStats:
    average: float | None
    count: int

    @property
    def is_guest_favourite(self) -> bool:
        return (
            self.average is not None
            and self.count >= GUEST_FAVOURITE_MIN_REVIEWS
            and self.average >= GUEST_FAVOURITE_MIN_RATING
        )


EMPTY = RatingStats(average=None, count=0)


def rating_subquery():
    """(listing_id, avg_rating, review_count) per listing, joinable into other queries."""
    return (
        select(
            Review.listing_id.label("listing_id"),
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .group_by(Review.listing_id)
        .subquery()
    )


def stats_for_listings(db: Session, listing_ids: list[int]) -> dict[int, RatingStats]:
    if not listing_ids:
        return {}
    rows = db.execute(
        select(Review.listing_id, func.avg(Review.rating), func.count(Review.id))
        .where(Review.listing_id.in_(listing_ids))
        .group_by(Review.listing_id)
    ).all()
    return {lid: RatingStats(round(avg, 2), count) for lid, avg, count in rows}


def category_averages(db: Session, listing_id: int) -> dict[str, float]:
    """Per-category averages for the listing page's rating breakdown."""
    cols = ["cleanliness", "accuracy", "check_in", "communication", "location", "value"]
    row = db.execute(
        select(*[func.avg(getattr(Review, c)) for c in cols]).where(Review.listing_id == listing_id)
    ).one()
    return {c: round(v, 1) for c, v in zip(cols, row) if v is not None}


def rating_distribution(db: Session, listing_id: int) -> dict[int, int]:
    rows = db.execute(
        select(Review.rating, func.count()).where(Review.listing_id == listing_id).group_by(Review.rating)
    ).all()
    counts = {star: 0 for star in range(1, 6)}
    counts.update({rating: n for rating, n in rows})
    return counts


def host_stats(db: Session, host_ids: list[int]) -> dict[int, RatingStats]:
    """Ratings across all of a host's listings (used for Superhost)."""
    if not host_ids:
        return {}
    rows = db.execute(
        select(Listing.host_id, func.avg(Review.rating), func.count(Review.id))
        .join(Review, Review.listing_id == Listing.id)
        .where(Listing.host_id.in_(host_ids))
        .group_by(Listing.host_id)
    ).all()
    return {hid: RatingStats(round(avg, 2), count) for hid, avg, count in rows}


def is_superhost(stats: RatingStats | None) -> bool:
    return (
        stats is not None
        and stats.average is not None
        and stats.count >= SUPERHOST_MIN_REVIEWS
        and stats.average >= SUPERHOST_MIN_RATING
    )

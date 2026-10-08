"""Public listing endpoints: reference data, home page, search, detail, availability, quotes."""

import math
from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Select, and_, desc, func, or_, select
from sqlalchemy.orm import Session, selectinload

from .. import schemas, serializers
from ..database import get_db
from ..models import Amenity, Category, Listing, RoomType, listing_amenities
from ..services import availability, pricing, ratings

router = APIRouter(prefix="/api", tags=["listings"])

PROPERTY_TYPES = ["House", "Flat", "Villa", "Cabin", "Cottage", "Guest house", "Farm stay", "Treehouse", "Room"]
CITY_BLURBS = {
    "Goa": "Beach shacks, villas and Portuguese-era homes",
    "Manali": "Cabins and cottages in the Himalayas",
    "Jaipur": "Havelis and homes in the Pink City",
    "Udaipur": "Lakeside stays in the City of Lakes",
    "Mumbai": "Flats close to the sea and the city",
    "Bengaluru": "Garden city homes for work and play",
    "Lonavala": "Weekend villas in the Western Ghats",
}
HOME_SECTION_TITLES = [
    "Popular homes in {city}",
    "Available next month in {city}",
    "Stay in {city}",
    "Guest favourites in {city}",
    "Homes in {city}",
    "Check out homes in {city}",
]


def _card_query() -> Select:
    """Base query with the relationships a listing card needs, loaded in bulk."""
    return select(Listing).where(Listing.is_active.is_(True)).options(
        selectinload(Listing.photos), selectinload(Listing.host)
    )


def _get_listing_or_404(db: Session, listing_id: int) -> Listing:
    listing = db.scalar(
        select(Listing)
        .where(Listing.id == listing_id)
        .options(
            selectinload(Listing.photos),
            selectinload(Listing.amenities),
            selectinload(Listing.host),
            selectinload(Listing.category),
        )
    )
    if listing is None:
        raise HTTPException(404, "Listing not found")
    return listing


@router.get("/meta", response_model=schemas.MetaOut)
def get_meta(db: Session = Depends(get_db)):
    """Reference data for the filter UI: categories, amenities, types and a price histogram."""
    prices = sorted(db.scalars(select(Listing.price_per_night).where(Listing.is_active.is_(True))).all())
    price_min, price_max = (prices[0], prices[-1]) if prices else (0, 0)
    bucket_count = 30
    width = max(1, math.ceil((price_max - price_min + 1) / bucket_count))
    buckets = [
        schemas.PriceBucket(min=price_min + i * width, max=price_min + (i + 1) * width - 1, count=0)
        for i in range(bucket_count)
    ]
    for p in prices:
        buckets[min((p - price_min) // width, bucket_count - 1)].count += 1

    return schemas.MetaOut(
        categories=db.scalars(select(Category).order_by(Category.id)).all(),
        amenities=db.scalars(select(Amenity).order_by(Amenity.id)).all(),
        property_types=PROPERTY_TYPES,
        price_histogram=buckets,
        price_min=price_min,
        price_max=price_max,
    )


@router.get("/destinations", response_model=list[dict])
def destinations(q: str = "", db: Session = Depends(get_db)):
    """Autocomplete for the 'Where' field: cities that have listings."""
    stmt = (
        select(Listing.city, Listing.state, Listing.country, func.count(Listing.id))
        .where(Listing.is_active.is_(True))
        .group_by(Listing.city, Listing.state, Listing.country)
        .order_by(desc(func.count(Listing.id)))
    )
    if q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(or_(Listing.city.ilike(term), Listing.state.ilike(term)))
    return [
        {"city": city, "state": state, "country": country, "count": count}
        for city, state, country, count in db.execute(stmt.limit(8)).all()
    ]


CATEGORY_TITLES = {
    "trending": "Trending homes",
    "amazing-views": "Homes with amazing views",
    "beachfront": "Beachfront stays",
    "cabins": "Cosy cabins",
    "lakefront": "Lakefront homes",
    "top-cities": "Stays in top cities",
    "amazing-pools": "Homes with amazing pools",
    "countryside": "Countryside escapes",
}
CATEGORY_BLURBS = {
    "amazing-pools": "Dive into homes with a pool of their own",
    "cabins": "Cosy hideaways in the woods and mountains",
    "beachfront": "Wake up steps from the sea",
    "amazing-views": "Rooms with a view worth the trip",
    "lakefront": "Homes on the water's edge",
    "countryside": "Slow down in farms and villages",
    "top-cities": "Stay close to the action",
    "trending": "Homes guests are booking right now",
}


def _home_row(db: Session, rating, where) -> list[Listing]:
    return db.scalars(
        _card_query()
        .outerjoin(rating, rating.c.listing_id == Listing.id)
        .where(where)
        .order_by(desc(func.coalesce(rating.c.avg_rating, 0)), Listing.id)
        .limit(10)
    ).all()


@router.get("/home", response_model=list[schemas.HomeSection])
def home_sections(group: Literal["city", "category"] = "city", db: Session = Depends(get_db)):
    """Home page carousels, best-rated first: one row per popular city (All tab)
    or per category (Homes tab)."""
    rating = ratings.rating_subquery()

    if group == "category":
        top = db.execute(
            select(Category.slug, Category.name, Category.id)
            .join(Listing, Listing.category_id == Category.id)
            .where(Listing.is_active.is_(True))
            .group_by(Category.id)
            .having(func.count(Listing.id) >= 3)
            .order_by(desc(func.count(Listing.id)), Category.id)
            .limit(6)
        ).all()
        return [
            schemas.HomeSection(
                title=CATEGORY_TITLES.get(slug, name),
                subtitle=CATEGORY_BLURBS.get(slug, "Guests often rate these homes highly"),
                city="",
                search_query=f"category={slug}",
                items=serializers.listing_cards(db, _home_row(db, rating, Listing.category_id == cid)),
            )
            for slug, name, cid in top
        ]

    cities = db.execute(
        select(Listing.city)
        .where(Listing.is_active.is_(True))
        .group_by(Listing.city)
        .order_by(desc(func.count(Listing.id)), Listing.city)
        .limit(6)
    ).scalars()

    sections = []
    for i, city in enumerate(cities):
        listings = _home_row(db, rating, Listing.city == city)
        title = HOME_SECTION_TITLES[i % len(HOME_SECTION_TITLES)].format(city=city)
        subtitle = CITY_BLURBS.get(city, "Guests often rate these homes highly")
        sections.append(
            schemas.HomeSection(
                title=title,
                subtitle=subtitle,
                city=city,
                search_query=f"location={city}",
                items=serializers.listing_cards(db, listings),
            )
        )
    return sections


def _csv_ints(value: str | None) -> list[int]:
    return [int(v) for v in value.split(",") if v.strip().isdigit()] if value else []


@router.get("/listings", response_model=schemas.Paginated)
def search_listings(
    db: Session = Depends(get_db),
    location: str | None = None,
    check_in: date | None = None,
    check_out: date | None = None,
    guests: Annotated[int, Query(ge=1, le=16)] = 1,
    category: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    room_type: RoomType | None = None,
    property_types: Annotated[str | None, Query(description="Comma-separated, e.g. House,Villa")] = None,
    amenities: Annotated[str | None, Query(description="Comma-separated amenity ids")] = None,
    bedrooms: int = 0,
    beds: int = 0,
    bathrooms: int = 0,
    guest_favourite: bool = False,
    # Map bounds: when present, only listings visible in the map viewport are returned.
    sw_lat: float | None = None,
    sw_lng: float | None = None,
    ne_lat: float | None = None,
    ne_lng: float | None = None,
    sort: Literal["recommended", "price_asc", "price_desc", "rating"] = "recommended",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 18,
):
    if check_in and check_out and check_out <= check_in:
        raise HTTPException(422, "Check-out must be after check-in")

    rating = ratings.rating_subquery()
    stmt = _card_query().outerjoin(rating, rating.c.listing_id == Listing.id)
    filters = [Listing.max_guests >= guests]

    if location and location.strip():
        # "Goa, India" -> match on "Goa"
        term = f"%{location.split(',')[0].strip()}%"
        filters.append(or_(Listing.city.ilike(term), Listing.state.ilike(term), Listing.country.ilike(term)))
    if check_in and check_out:
        filters.append(availability.listing_is_free(Listing.id, check_in, check_out))
        filters.append(Listing.min_nights <= pricing.nights_between(check_in, check_out))
    if category:
        stmt = stmt.join(Category, Category.id == Listing.category_id)
        filters.append(Category.slug == category)
    if min_price is not None:
        filters.append(Listing.price_per_night >= min_price)
    if max_price is not None:
        filters.append(Listing.price_per_night <= max_price)
    if room_type:
        filters.append(Listing.room_type == room_type)
    if property_types:
        filters.append(Listing.property_type.in_([p.strip() for p in property_types.split(",")]))
    if bedrooms:
        filters.append(Listing.bedrooms >= bedrooms)
    if beds:
        filters.append(Listing.beds >= beds)
    if bathrooms:
        filters.append(Listing.bathrooms >= bathrooms)
    if guest_favourite:
        filters.append(rating.c.avg_rating >= ratings.GUEST_FAVOURITE_MIN_RATING)
        filters.append(rating.c.review_count >= ratings.GUEST_FAVOURITE_MIN_REVIEWS)
    if None not in (sw_lat, sw_lng, ne_lat, ne_lng):
        filters.append(and_(Listing.latitude.between(sw_lat, ne_lat), Listing.longitude.between(sw_lng, ne_lng)))

    amenity_ids = _csv_ints(amenities)
    if amenity_ids:
        # Listing must have *all* selected amenities.
        has_all = (
            select(listing_amenities.c.listing_id)
            .where(listing_amenities.c.amenity_id.in_(amenity_ids))
            .group_by(listing_amenities.c.listing_id)
            .having(func.count() == len(set(amenity_ids)))
        )
        filters.append(Listing.id.in_(has_all))

    stmt = stmt.where(*filters)
    total = db.scalar(select(func.count()).select_from(stmt.with_only_columns(Listing.id).subquery())) or 0

    order = {
        "price_asc": [Listing.price_per_night.asc()],
        "price_desc": [Listing.price_per_night.desc()],
        "rating": [desc(func.coalesce(rating.c.avg_rating, 0)), desc(func.coalesce(rating.c.review_count, 0))],
        "recommended": [
            desc(func.coalesce(rating.c.avg_rating, 0) * func.min(func.coalesce(rating.c.review_count, 0), 20))
        ],
    }[sort]
    listings = db.scalars(stmt.order_by(*order, Listing.id).offset((page - 1) * page_size).limit(page_size)).all()

    return schemas.Paginated(
        items=serializers.listing_cards(db, listings, check_in, check_out),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/listings/{listing_id}", response_model=schemas.ListingDetail)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    return serializers.listing_detail(db, _get_listing_or_404(db, listing_id))


@router.get("/listings/{listing_id}/availability", response_model=schemas.AvailabilityOut)
def get_availability(listing_id: int, db: Session = Depends(get_db)):
    listing = _get_listing_or_404(db, listing_id)
    ranges = availability.booked_ranges(db, listing, date.today())
    return schemas.AvailabilityOut(
        listing_id=listing.id,
        min_nights=listing.min_nights,
        booked=[schemas.DateRange(check_in=a, check_out=b) for a, b in ranges],
    )


@router.get("/listings/{listing_id}/quote", response_model=schemas.QuoteOut)
def get_quote(listing_id: int, check_in: date, check_out: date, db: Session = Depends(get_db)):
    listing = _get_listing_or_404(db, listing_id)
    if check_out <= check_in:
        raise HTTPException(422, "Check-out must be after check-in")
    q = pricing.quote(listing.price_per_night, listing.cleaning_fee, check_in, check_out)
    return schemas.QuoteOut(available=availability.is_available(db, listing.id, check_in, check_out), **q.to_dict())

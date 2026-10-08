"""Wishlists: named lists of saved listings, like Airbnb's heart button."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from .. import schemas, serializers
from ..auth import get_current_user
from ..database import get_db
from ..models import Listing, User, Wishlist, WishlistItem

router = APIRouter(prefix="/api/wishlists", tags=["wishlists"])


class AddItem(BaseModel):
    listing_id: int


def _wishlist_query():
    return select(Wishlist).options(
        selectinload(Wishlist.items).selectinload(WishlistItem.listing).selectinload(Listing.photos)
    )


def _own_wishlist(db: Session, wishlist_id: int, user: User) -> Wishlist:
    wishlist = db.scalar(_wishlist_query().where(Wishlist.id == wishlist_id))
    if wishlist is None or wishlist.user_id != user.id:
        raise HTTPException(404, "Wishlist not found")
    return wishlist


def _summary(w: Wishlist) -> schemas.WishlistSummary:
    return schemas.WishlistSummary(
        id=w.id,
        name=w.name,
        item_count=len(w.items),
        cover_photos=[i.listing.photos[0].url for i in w.items[:3] if i.listing.photos],
        listing_ids=[i.listing_id for i in w.items],
    )


@router.get("", response_model=list[schemas.WishlistSummary])
def my_wishlists(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wishlists = db.scalars(_wishlist_query().where(Wishlist.user_id == user.id).order_by(Wishlist.created_at.desc()))
    return [_summary(w) for w in wishlists]


@router.post("", response_model=schemas.WishlistSummary, status_code=status.HTTP_201_CREATED)
def create_wishlist(body: schemas.WishlistCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wishlist = Wishlist(user_id=user.id, name=body.name.strip())
    if body.listing_id is not None:
        if db.get(Listing, body.listing_id) is None:
            raise HTTPException(404, "Listing not found")
        wishlist.items.append(WishlistItem(listing_id=body.listing_id))
    db.add(wishlist)
    db.commit()
    return _summary(_own_wishlist(db, wishlist.id, user))


@router.get("/{wishlist_id}", response_model=schemas.WishlistDetail)
def get_wishlist(wishlist_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wishlist = _own_wishlist(db, wishlist_id, user)
    listings = db.scalars(
        select(Listing)
        .where(Listing.id.in_([i.listing_id for i in wishlist.items]))
        .options(selectinload(Listing.photos), selectinload(Listing.host))
    ).all()
    return schemas.WishlistDetail(id=wishlist.id, name=wishlist.name, items=serializers.listing_cards(db, listings))


@router.patch("/{wishlist_id}", response_model=schemas.WishlistSummary)
def rename_wishlist(
    wishlist_id: int, body: schemas.WishlistCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    wishlist = _own_wishlist(db, wishlist_id, user)
    wishlist.name = body.name.strip()
    db.commit()
    return _summary(wishlist)


@router.delete("/{wishlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wishlist(wishlist_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_own_wishlist(db, wishlist_id, user))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{wishlist_id}/items", response_model=schemas.WishlistSummary)
def add_item(wishlist_id: int, body: AddItem, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wishlist = _own_wishlist(db, wishlist_id, user)
    if db.get(Listing, body.listing_id) is None:
        raise HTTPException(404, "Listing not found")
    if body.listing_id not in {i.listing_id for i in wishlist.items}:
        db.add(WishlistItem(wishlist_id=wishlist.id, listing_id=body.listing_id))
        db.commit()
    return _summary(_own_wishlist(db, wishlist_id, user))


@router.delete("/items/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_listing(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Un-heart: remove the listing from every one of the user's wishlists."""
    own_lists = select(Wishlist.id).where(Wishlist.user_id == user.id)
    db.execute(delete(WishlistItem).where(WishlistItem.listing_id == listing_id, WishlistItem.wishlist_id.in_(own_lists)))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

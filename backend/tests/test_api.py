"""End-to-end API tests against a freshly seeded temporary database."""

import os
import tempfile
from datetime import date, timedelta

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["SEED_ON_STARTUP"] = "false"
os.environ["UPLOAD_DIR"] = f"{_tmp}/uploads"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import seed  # noqa: E402


@pytest.fixture(scope="module")
def client():
    seed()
    with TestClient(app) as c:
        yield c


def login(client, email):
    res = client.post("/api/auth/login", json={"email": email})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['token']}"}


def day(offset: int) -> str:
    return (date.today() + timedelta(days=offset)).isoformat()


def test_forged_token_is_rejected(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer 1.not-a-real-signature"})
    assert res.status_code == 401


def test_search_filters_by_location_and_price(client):
    res = client.get("/api/listings", params={"location": "Goa, India", "max_price": 5000})
    data = res.json()
    assert res.status_code == 200 and data["total"] > 0
    assert all(i["city"] == "Goa" and i["price_per_night"] <= 5000 for i in data["items"])


def test_booking_blocks_dates_and_rejects_overlaps(client):
    guest = login(client, "guest@demo.com")
    other = login(client, "isha@demo.com")
    # 200+ days out is beyond every seeded booking, so these dates start free.
    check_in, check_out = day(200), day(203)
    body = {"listing_id": 5, "check_in": check_in, "check_out": check_out, "adults": 2}

    res = client.post("/api/bookings", json=body, headers=guest)
    assert res.status_code == 201, res.text
    booking = res.json()
    assert booking["nights"] == 3 and booking["total_price"] > booking["nightly_rate"] * 3

    # Same dates, and a range that overlaps by one night, are both rejected.
    assert client.post("/api/bookings", json=body, headers=other).status_code == 409
    shifted = {**body, "check_in": day(202), "check_out": day(206)}
    assert client.post("/api/bookings", json=shifted, headers=other).status_code == 409

    # Back-to-back is fine: check-in on the previous guest's check-out day.
    back_to_back = {**body, "check_in": check_out, "check_out": day(205)}
    assert client.post("/api/bookings", json=back_to_back, headers=other).status_code == 201

    # The booked range shows in availability, and search with those dates excludes the listing.
    booked = client.get("/api/listings/5/availability").json()["booked"]
    assert {"check_in": check_in, "check_out": check_out} in booked
    found = client.get("/api/listings", params={"check_in": check_in, "check_out": check_out, "page_size": 50})
    assert 5 not in [i["id"] for i in found.json()["items"]]

    # Cancelling frees the dates again.
    assert client.post(f"/api/bookings/{booking['id']}/cancel", headers=guest).json()["status"] == "cancelled"
    assert client.post("/api/bookings", json=body, headers=other).status_code == 201


def test_booking_validation(client):
    guest = login(client, "guest@demo.com")
    base = {"listing_id": 2, "adults": 1}
    past = {**base, "check_in": day(-3), "check_out": day(-1)}
    assert client.post("/api/bookings", json=past, headers=guest).status_code == 400
    reversed_dates = {**base, "check_in": day(210), "check_out": day(209)}
    assert client.post("/api/bookings", json=reversed_dates, headers=guest).status_code == 422
    too_many = {**base, "check_in": day(210), "check_out": day(212), "adults": 16}
    assert client.post("/api/bookings", json=too_many, headers=guest).status_code == 400
    # Not logged in.
    assert client.post("/api/bookings", json={**base, "check_in": day(210), "check_out": day(212)}).status_code == 401


def test_host_cannot_book_own_listing(client):
    host = login(client, "priya@demo.com")
    body = {"listing_id": 1, "check_in": day(300), "check_out": day(303), "adults": 1}
    assert client.post("/api/bookings", json=body, headers=host).status_code == 400


def test_review_only_after_completed_stay(client):
    guest = login(client, "guest@demo.com")
    trips = client.get("/api/bookings/me", headers=guest).json()
    reviewable = next(t for t in trips if t["can_review"])
    upcoming = next(t for t in trips if t["check_in"] > day(0) and t["status"] == "confirmed")
    review = {"rating": 5, "cleanliness": 5, "accuracy": 5, "check_in": 5, "communication": 5,
              "location": 4, "value": 5, "comment": "Wonderful stay, would come back."}

    assert client.post("/api/reviews", json={**review, "booking_id": upcoming["id"]}, headers=guest).status_code == 400
    assert client.post("/api/reviews", json={**review, "booking_id": reviewable["id"]}, headers=guest).status_code == 201
    # Only one review per stay.
    assert client.post("/api/reviews", json={**review, "booking_id": reviewable["id"]}, headers=guest).status_code == 400


def test_wishlist_save_and_unsave(client):
    guest = login(client, "kabir@demo.com")
    created = client.post("/api/wishlists", json={"name": "Weekend", "listing_id": 3}, headers=guest).json()
    assert created["listing_ids"] == [3]
    client.post(f"/api/wishlists/{created['id']}/items", json={"listing_id": 4}, headers=guest)
    client.delete("/api/wishlists/items/3", headers=guest)
    lists = client.get("/api/wishlists", headers=guest).json()
    assert lists[0]["listing_ids"] == [4]
    # Another user can't read it.
    other = login(client, "isha@demo.com")
    assert client.get(f"/api/wishlists/{created['id']}", headers=other).status_code == 404


LISTING = {
    "title": "Test treehouse", "description": "A tiny treehouse used in tests.", "property_type": "Treehouse",
    "room_type": "entire_home", "category_id": 1, "address": "Somewhere, Goa", "city": "Goa", "state": "Goa",
    "latitude": 15.5, "longitude": 73.8, "price_per_night": 3000, "cleaning_fee": 300, "max_guests": 2,
    "bedrooms": 1, "beds": 1, "bathrooms": 1, "amenity_ids": [1, 2],
    "photo_urls": ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"],
}


def test_host_listing_crud(client):
    host = login(client, "priya@demo.com")
    created = client.post("/api/host/listings", json=LISTING, headers=host)
    assert created.status_code == 201, created.text
    listing_id = created.json()["id"]

    updated = client.put(f"/api/host/listings/{listing_id}", json={**LISTING, "price_per_night": 3500}, headers=host)
    assert updated.json()["price_per_night"] == 3500
    assert listing_id in [l["id"] for l in client.get("/api/host/listings", headers=host).json()]

    # Another host can't edit or delete it.
    other_host = login(client, "rohan@demo.com")
    assert client.delete(f"/api/host/listings/{listing_id}", headers=other_host).status_code == 404

    assert client.delete(f"/api/host/listings/{listing_id}", headers=host).status_code == 204
    assert client.get(f"/api/listings/{listing_id}").status_code == 404


def test_guest_must_switch_to_hosting(client):
    guest = login(client, "nisha@demo.com")
    assert client.post("/api/host/listings", json=LISTING, headers=guest).status_code == 403
    client.post("/api/auth/become-host", headers=guest)
    assert client.post("/api/host/listings", json=LISTING, headers=guest).status_code == 201


def test_cannot_delete_listing_with_upcoming_reservations(client):
    host = login(client, "priya@demo.com")
    assert client.delete("/api/host/listings/1", headers=host).status_code == 400

"""Seed the database with hosts, guests, listings, bookings, reviews and wishlists.

Run with:  python -m app.seed   (drops and recreates all tables)

Dates are generated relative to today, so there are always past stays (with
reviews), stays in progress and upcoming bookings that block calendar dates.
Randomness is seeded, so every run produces the same data.
"""

import random
from datetime import date, datetime, time, timedelta, timezone

from .database import Base, SessionLocal, engine
from .models import (
    Amenity,
    Booking,
    BookingStatus,
    Category,
    Listing,
    ListingPhoto,
    Review,
    RoomType,
    User,
    Wishlist,
    WishlistItem,
)
from .seed_photos import EXTERIORS, INTERIORS, photo_url
from .services import pricing

rng = random.Random(42)

CATEGORIES = [
    ("trending", "Trending", "flame"),
    ("beachfront", "Beachfront", "umbrella"),
    ("amazing-pools", "Amazing pools", "waves-ladder"),
    ("cabins", "Cabins", "tree-pine"),
    ("amazing-views", "Amazing views", "mountain-snow"),
    ("countryside", "Countryside", "wheat"),
    ("mansions", "Mansions", "landmark"),
    ("castles", "Castles", "castle"),
    ("lakefront", "Lakefront", "sailboat"),
    ("tropical", "Tropical", "palmtree"),
    ("top-cities", "Top cities", "building-2"),
    ("design", "Design", "pen-tool"),
    ("tiny-homes", "Tiny homes", "house"),
    ("farms", "Farms", "tractor"),
]

AMENITIES = [
    ("Wifi", "wifi", "Essentials"),
    ("Kitchen", "utensils", "Essentials"),
    ("Washing machine", "washing-machine", "Essentials"),
    ("Air conditioning", "snowflake", "Essentials"),
    ("Heating", "heater", "Essentials"),
    ("Dedicated workspace", "laptop", "Essentials"),
    ("TV", "tv", "Essentials"),
    ("Hair dryer", "wind", "Essentials"),
    ("Iron", "shirt", "Essentials"),
    ("Pool", "waves-ladder", "Features"),
    ("Hot tub", "bath", "Features"),
    ("Free parking on premises", "car", "Features"),
    ("EV charger", "plug-zap", "Features"),
    ("Gym", "dumbbell", "Features"),
    ("BBQ grill", "flame", "Features"),
    ("Breakfast", "coffee", "Features"),
    ("Indoor fireplace", "flame-kindling", "Features"),
    ("Patio or balcony", "fence", "Features"),
    ("Garden", "trees", "Features"),
    ("Beach access", "umbrella", "Location"),
    ("Lake access", "sailboat", "Location"),
    ("Mountain view", "mountain", "Location"),
    ("Sea view", "waves", "Location"),
    ("Smoke alarm", "alarm-smoke", "Safety"),
    ("First aid kit", "briefcase-medical", "Safety"),
    ("Fire extinguisher", "fire-extinguisher", "Safety"),
    ("Pets allowed", "paw-print", "Policies"),
    ("Self check-in", "key-round", "Policies"),
    ("Long-term stays allowed", "calendar-days", "Policies"),
]
BASE_AMENITIES = ["Wifi", "Kitchen", "Smoke alarm", "First aid kit", "TV", "Hair dryer", "Iron"]
OPTIONAL_AMENITIES = [
    "Washing machine", "Dedicated workspace", "Free parking on premises", "Self check-in",
    "Patio or balcony", "Fire extinguisher", "Long-term stays allowed", "BBQ grill", "Breakfast",
    "Pets allowed", "EV charger", "Gym",
]

# (name, email, gender for avatar, avatar number, city, bio, is_host)
HOSTS = [
    ("Priya Mehta", "priya@demo.com", "women", 44, "Goa",
     "Architect turned host. I restore old Goan homes and love helping guests find the quiet beaches.", True),
    ("Rohan Kapoor", "rohan@demo.com", "men", 32, "Manali",
     "Mountain guide and coffee nerd. My cabins are where I'd want to stay after a long trek.", True),
    ("Ananya Iyer", "ananya@demo.com", "women", 68, "Bengaluru",
     "Software engineer by weekday, host by weekend. I keep my places spotless and well-stocked.", True),
    ("Vikram Singh Rathore", "vikram@demo.com", "men", 75, "Jaipur",
     "Fourth-generation Jaipuri. Our family havelis have hosted travellers for decades.", True),
    ("Meera Nair", "meera@demo.com", "women", 26, "Alappuzha",
     "Born on the backwaters. Ask me about the best appam in town.", True),
    ("Arjun Desai", "arjun@demo.com", "men", 52, "Mumbai",
     "Mumbai local through and through. Happy to share my favourite street food spots.", True),
]
GUESTS = [
    ("Aarav Sharma", "guest@demo.com", "men", 11, "New Delhi"),
    ("Isha Kulkarni", "isha@demo.com", "women", 17, "Pune"),
    ("Kabir Malhotra", "kabir@demo.com", "men", 22, "Chandigarh"),
    ("Sara Thomas", "sara@demo.com", "women", 33, "Kochi"),
    ("Dev Patel", "dev@demo.com", "men", 41, "Ahmedabad"),
    ("Nisha Reddy", "nisha@demo.com", "women", 50, "Hyderabad"),
    ("Aditya Rao", "aditya@demo.com", "men", 63, "Bengaluru"),
    ("Tara Banerjee", "tara@demo.com", "women", 65, "Kolkata"),
    ("Liam Carter", "liam@demo.com", "men", 8, "London"),
    ("Zoya Khan", "zoya@demo.com", "women", 79, "Lucknow"),
    ("Neel Joshi", "neel@demo.com", "men", 88, "Mumbai"),
    ("Emma Fischer", "emma@demo.com", "women", 90, "Berlin"),
]

# City -> (state, lat, lng, host index, [(area, style, property_type, room_type, category, price, title, features)])
CITIES = {
    "Goa": ("Goa", 15.55, 73.78, 0, [
        ("Anjuna", "villa", "Villa", "entire_home", "amazing-pools", 18500, "Sunlit 4BHK villa with private pool", ["Pool", "Garden", "Air conditioning", "Patio or balcony"]),
        ("Calangute", "beach", "Flat", "entire_home", "beachfront", 4200, "Beach-facing studio, 2 min walk to the sea", ["Beach access", "Sea view", "Air conditioning"]),
        ("Assagao", "cottage", "Cottage", "entire_home", "tropical", 6800, "Portuguese-era cottage in the palms", ["Garden", "Breakfast", "Patio or balcony"]),
        ("Palolem", "beach", "Cabin", "entire_home", "beachfront", 3500, "Bamboo beach hut on Palolem", ["Beach access", "Sea view"]),
        ("Vagator", "villa", "Villa", "entire_home", "amazing-views", 14200, "Cliffside villa with sunset deck", ["Pool", "Sea view", "Air conditioning"]),
        ("Candolim", "city", "Flat", "entire_home", "trending", 3900, "Modern 2BHK with rooftop pool access", ["Pool", "Air conditioning", "Gym"]),
        ("Siolim", "cottage", "House", "entire_home", "countryside", 7600, "Riverside home with mango orchard", ["Garden", "Lake access", "Pets allowed"]),
        ("Panaji", "city", "Room", "private_room", "top-cities", 1900, "Bright room in a Fontainhas heritage home", ["Air conditioning", "Breakfast"]),
    ]),
    "Manali": ("Himachal Pradesh", 32.24, 77.19, 1, [
        ("Old Manali", "mountain", "Cabin", "entire_home", "cabins", 5200, "Pine cabin with Himalayan views", ["Mountain view", "Indoor fireplace", "Heating"]),
        ("Vashisht", "mountain", "Cottage", "entire_home", "amazing-views", 4600, "Stone cottage near the hot springs", ["Mountain view", "Heating", "Garden"]),
        ("Solang", "mountain", "Cabin", "entire_home", "cabins", 6900, "A-frame cabin by Solang valley", ["Mountain view", "Indoor fireplace", "Hot tub"]),
        ("Naggar", "cottage", "House", "entire_home", "countryside", 3800, "Apple orchard farmhouse in Naggar", ["Mountain view", "Garden", "Pets allowed"]),
        ("Old Manali", "mountain", "Room", "private_room", "trending", 1600, "Cosy attic room above a cafe", ["Mountain view", "Heating", "Breakfast"]),
        ("Sethan", "mountain", "Cabin", "entire_home", "amazing-views", 8400, "Glass-front cabin above the clouds", ["Mountain view", "Indoor fireplace", "Heating"]),
    ]),
    "Jaipur": ("Rajasthan", 26.91, 75.79, 3, [
        ("Old City", "villa", "Villa", "entire_home", "castles", 21000, "Restored 200-year-old haveli suite", ["Pool", "Air conditioning", "Breakfast"]),
        ("C-Scheme", "city", "Flat", "entire_home", "top-cities", 3200, "Designer flat near MI Road", ["Air conditioning", "Dedicated workspace"]),
        ("Amer", "villa", "Villa", "entire_home", "mansions", 16500, "Fort-view villa with courtyard pool", ["Pool", "Mountain view", "Air conditioning"]),
        ("Bani Park", "cottage", "Guest house", "private_room", "design", 2400, "Block-print themed guest room", ["Air conditioning", "Breakfast", "Garden"]),
        ("Vaishali Nagar", "city", "Flat", "entire_home", "trending", 2800, "Calm 2BHK with balcony garden", ["Air conditioning", "Patio or balcony"]),
    ]),
    "Udaipur": ("Rajasthan", 24.58, 73.69, 3, [
        ("Lake Pichola", "villa", "Villa", "entire_home", "lakefront", 19800, "Lake Pichola palace-view villa", ["Lake access", "Pool", "Air conditioning"]),
        ("Ambamata", "city", "Flat", "entire_home", "lakefront", 4100, "Rooftop flat facing Fateh Sagar", ["Lake access", "Air conditioning", "Patio or balcony"]),
        ("Badi", "cottage", "Farm stay", "entire_home", "farms", 5600, "Aravalli hills farm stay", ["Garden", "Mountain view", "Breakfast", "Pets allowed"]),
        ("Hanuman Ghat", "city", "Room", "private_room", "castles", 2200, "Haveli room with jharokha window", ["Lake access", "Air conditioning"]),
    ]),
    "Mumbai": ("Maharashtra", 19.08, 72.85, 5, [
        ("Bandra West", "city", "Flat", "entire_home", "top-cities", 7800, "Sea-breeze 1BHK in Bandra", ["Sea view", "Air conditioning", "Dedicated workspace"]),
        ("Colaba", "city", "Flat", "entire_home", "design", 9200, "Art deco flat steps from the Gateway", ["Air conditioning", "Dedicated workspace"]),
        ("Juhu", "beach", "Flat", "entire_home", "beachfront", 11500, "Juhu beach apartment with balcony", ["Beach access", "Sea view", "Air conditioning"]),
        ("Andheri", "city", "Room", "private_room", "trending", 2600, "Quiet room near the metro", ["Air conditioning", "Dedicated workspace"]),
        ("Worli", "city", "Flat", "entire_home", "amazing-views", 13800, "High-floor flat with sea link views", ["Sea view", "Pool", "Gym", "Air conditioning"]),
    ]),
    "Bengaluru": ("Karnataka", 12.97, 77.6, 2, [
        ("Indiranagar", "city", "Flat", "entire_home", "top-cities", 4500, "Indiranagar loft near 100 Feet Road", ["Air conditioning", "Dedicated workspace"]),
        ("Koramangala", "city", "Flat", "entire_home", "trending", 3600, "Work-friendly studio in Koramangala", ["Dedicated workspace", "Air conditioning"]),
        ("Whitefield", "villa", "Villa", "entire_home", "amazing-pools", 12500, "Gated villa with lap pool", ["Pool", "Garden", "Air conditioning"]),
        ("Jayanagar", "cottage", "Room", "private_room", "design", 1800, "Room in a leafy Jayanagar bungalow", ["Garden", "Breakfast"]),
    ]),
    "Lonavala": ("Maharashtra", 18.75, 73.41, 0, [
        ("Tungarli", "villa", "Villa", "entire_home", "amazing-pools", 15500, "Monsoon villa with infinity pool", ["Pool", "Mountain view", "Garden"]),
        ("Khandala", "mountain", "Cottage", "entire_home", "amazing-views", 6200, "Valley-view cottage in Khandala", ["Mountain view", "Garden", "Pets allowed"]),
        ("Pawna Lake", "mountain", "Cabin", "entire_home", "lakefront", 4900, "Lakeside cabin at Pawna", ["Lake access", "BBQ grill", "Mountain view"]),
        ("Kune", "villa", "Villa", "entire_home", "mansions", 24000, "Six-bedroom estate for big groups", ["Pool", "Garden", "Mountain view", "Hot tub"]),
    ]),
    "Coorg": ("Karnataka", 12.42, 75.74, 2, [
        ("Madikeri", "mountain", "Cottage", "entire_home", "countryside", 5400, "Coffee estate cottage in the mist", ["Garden", "Mountain view", "Breakfast"]),
        ("Virajpet", "cottage", "Farm stay", "entire_home", "farms", 4300, "Plantation farm stay with river walk", ["Garden", "Lake access", "Pets allowed"]),
        ("Kakkabe", "mountain", "Cabin", "entire_home", "cabins", 3900, "Treetop cabin near Thadiandamol", ["Mountain view", "Heating"]),
    ]),
    "Rishikesh": ("Uttarakhand", 30.12, 78.31, 1, [
        ("Tapovan", "mountain", "Room", "private_room", "amazing-views", 1500, "Yoga retreat room over the Ganga", ["Mountain view", "Breakfast"]),
        ("Laxman Jhula", "cottage", "Guest house", "entire_home", "trending", 3300, "Riverside guest house by the bridge", ["Lake access", "Mountain view"]),
        ("Shivpuri", "mountain", "Cabin", "entire_home", "cabins", 4700, "Jungle cabin near the rafting camps", ["Mountain view", "BBQ grill", "Garden"]),
    ]),
    "Alappuzha": ("Kerala", 9.5, 76.34, 4, [
        ("Punnamada", "beach", "House", "entire_home", "lakefront", 7200, "Backwater home with private jetty", ["Lake access", "Garden", "Breakfast"]),
        ("Marari", "beach", "Cottage", "entire_home", "tropical", 6100, "Coconut-grove cottage near Marari beach", ["Beach access", "Garden", "Sea view"]),
        ("Kuttanad", "cottage", "Farm stay", "entire_home", "farms", 3400, "Paddy-field farm stay", ["Lake access", "Breakfast", "Garden"]),
    ]),
    "Puducherry": ("Puducherry", 11.93, 79.83, 4, [
        ("White Town", "cottage", "House", "entire_home", "design", 6400, "French Quarter house with courtyard", ["Garden", "Air conditioning"]),
        ("Auroville", "cottage", "Cottage", "entire_home", "tropical", 3700, "Earth-built cottage in Auroville", ["Garden", "Breakfast", "Pets allowed"]),
        ("Serenity Beach", "beach", "Flat", "entire_home", "beachfront", 4800, "Surf flat on Serenity beach", ["Beach access", "Sea view", "Air conditioning"]),
    ]),
}

DESCRIPTION_OPENERS = {
    "villa": "Spread across two floors, this villa is made for slow days by the pool and long dinners outdoors.",
    "beach": "Wake up to the sound of waves. The beach is a short barefoot walk from the door.",
    "mountain": "Wrapped in pine and mountain air, this is a place to slow down and watch the weather roll in.",
    "cottage": "A characterful, lovingly restored home with old-world details and modern comforts.",
    "city": "A bright, well-designed base in one of the city's liveliest neighbourhoods.",
}
DESCRIPTION_MIDDLES = [
    "Bedrooms have blackout curtains and fresh, crisp linen. The kitchen is fully stocked for cooking in.",
    "Fast wifi and a proper desk make it easy to stay longer and work remotely.",
    "Our caretaker lives nearby and can arrange airport pickups, a cook or day trips on request.",
    "Local cafes, markets and a pharmacy are all within a ten-minute walk.",
]
DESCRIPTION_CLOSER = (
    "\n\nThe space\nEverything you see in the photos is yours for the stay. Check-in is flexible and we're always a "
    "message away.\n\nOther things to note\nQuiet hours are from 10pm to 7am. No parties or events, please."
)

REVIEW_COMMENTS = [
    "Exactly like the photos. Spotless, comfortable and the host was super responsive. Would stay again!",
    "Beautiful place with an amazing view. We didn't want to leave. Check-in was smooth and simple.",
    "Great location, everything within walking distance. The bed was very comfortable.",
    "One of the best stays we've had in India. Thoughtful touches everywhere, from the snacks to the local tips.",
    "Lovely and peaceful. Perfect for a long weekend with family. Kids loved the garden.",
    "The host went above and beyond to make us feel at home. Highly recommend.",
    "Clean, cosy and well-equipped kitchen. Wifi was fast enough for video calls all week.",
    "Gorgeous property, though the road leading up is a bit bumpy. Totally worth it.",
    "Good value for money. A few things could be updated but overall a pleasant stay.",
    "Stunning sunsets from the balcony every evening. The host's restaurant tips were spot on.",
    "Felt safe and comfortable throughout. Communication was quick and friendly.",
    "Perfect for a workcation. Quiet, comfortable and the chai in the morning was a lovely touch.",
    "Location is unbeatable. Slight noise from the street at night, but nothing major.",
    "Even nicer than the pictures! Super clean and the caretaker was very helpful.",
    "We celebrated our anniversary here and it was magical. Thank you for the decorations!",
    "Nice place overall, but hot water took a while in the mornings. Host fixed it quickly.",
]


def _days_ago(days: int) -> datetime:
    return datetime.combine(date.today() - timedelta(days=days), time(12), tzinfo=timezone.utc)


def _avatar(gender: str, n: int) -> str:
    return f"https://randomuser.me/api/portraits/{gender}/{n}.jpg"


def _photos_for(style: str, index: int) -> list[str]:
    exteriors = EXTERIORS[style]
    cover = exteriors[index % len(exteriors)]
    interiors = rng.sample(INTERIORS, 6)
    return [photo_url(cover)] + [photo_url(p) for p in interiors]


def _jitter(value: float, spread: float) -> float:
    return round(value + rng.uniform(-spread, spread), 5)


class Calendar:
    """Tracks booked ranges per listing so seeded bookings never overlap."""

    def __init__(self) -> None:
        self.ranges: dict[int, list[tuple[date, date]]] = {}

    def free(self, listing_id: int, start: date, end: date) -> bool:
        return all(not (s < end and start < e) for s, e in self.ranges.get(listing_id, []))

    def take(self, listing_id: int, start: date, end: date) -> None:
        self.ranges.setdefault(listing_id, []).append((start, end))


def _make_booking(listing: Listing, guest: User, start: date, nights: int, status=BookingStatus.confirmed) -> Booking:
    end = start + timedelta(days=nights)
    q = pricing.quote(listing.price_per_night, listing.cleaning_fee, start, end)
    return Booking(
        listing=listing,
        guest=guest,
        check_in=start,
        check_out=end,
        guests=rng.randint(1, listing.max_guests),
        nights=q.nights,
        nightly_rate=q.nightly_rate,
        cleaning_fee=q.cleaning_fee,
        service_fee=q.service_fee,
        taxes=q.taxes,
        total_price=q.total,
        status=status,
        created_at=_days_ago(max(0, (date.today() - start).days + rng.randint(5, 40))),
    )


def _make_review(booking: Booking, quality: float) -> Review:
    def score() -> int:
        return 5 if rng.random() < quality else rng.choice([4, 4, 4, 3])

    subs = {k: score() for k in ("cleanliness", "accuracy", "check_in", "communication", "location", "value")}
    overall = round(sum(subs.values()) / 6)
    return Review(
        listing=booking.listing,
        author=booking.guest,
        booking=booking,
        rating=overall,
        comment=rng.choice(REVIEW_COMMENTS),
        created_at=datetime.combine(booking.check_out + timedelta(days=rng.randint(1, 6)), time(10), tzinfo=timezone.utc),
        **subs,
    )


def seed() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    today = date.today()

    with SessionLocal() as db:
        categories = {slug: Category(slug=slug, name=name, icon=icon) for slug, name, icon in CATEGORIES}
        amenities = {name: Amenity(name=name, icon=icon, group=group) for name, icon, group in AMENITIES}
        db.add_all([*categories.values(), *amenities.values()])

        hosts = [
            User(name=n, email=e, avatar_url=_avatar(g, a), city=c, bio=b, is_host=h,
                 created_at=_days_ago(rng.randint(700, 2600)))
            for n, e, g, a, c, b, h in HOSTS
        ]
        guests = [
            User(name=n, email=e, avatar_url=_avatar(g, a), city=c, created_at=_days_ago(rng.randint(100, 1500)))
            for n, e, g, a, c in GUESTS
        ]
        db.add_all(hosts + guests)

        # Review quality per host: most are excellent (Superhosts); Vikram's are good, not great.
        host_quality = {0: 0.92, 1: 0.9, 2: 0.88, 3: 0.55, 4: 0.9, 5: 0.7}

        listings: list[Listing] = []
        quality: dict[int, float] = {}  # chance each review score is a 5, keyed by list index
        style_counter: dict[str, int] = {}
        for city, (state, lat, lng, host_index, specs) in CITIES.items():
            for area, style, ptype, rtype, cat, price, title, features in specs:
                idx = style_counter.get(style, 0)
                style_counter[style] = idx + 1
                entire = rtype == "entire_home"
                bedrooms = (rng.randint(3, 6) if ptype == "Villa" else rng.randint(1, 3)) if entire else 1
                beds = bedrooms + rng.randint(0, 2)
                listing = Listing(
                    host=hosts[host_index],
                    category=categories[cat],
                    title=title,
                    description=f"{DESCRIPTION_OPENERS[style]} {' '.join(rng.sample(DESCRIPTION_MIDDLES, 2))}"
                    f"{DESCRIPTION_CLOSER}",
                    property_type=ptype,
                    room_type=RoomType(rtype),
                    address=f"{area}, {city}, {state}",
                    city=city,
                    state=state,
                    latitude=_jitter(lat, 0.06),
                    longitude=_jitter(lng, 0.06),
                    price_per_night=price,
                    cleaning_fee=0 if price < 2500 else round(price * rng.uniform(0.08, 0.15) / 50) * 50,
                    max_guests=min(16, bedrooms * 2 + rng.randint(0, 2)) if entire else 2,
                    bedrooms=bedrooms,
                    beds=beds,
                    bathrooms=max(1, bedrooms - rng.randint(0, 1)) if entire else 1,
                    min_nights=2 if price > 10000 else 1,
                    created_at=_days_ago(rng.randint(400, 900)),
                    photos=[
                        ListingPhoto(url=url, position=i) for i, url in enumerate(_photos_for(style, idx))
                    ],
                    amenities=[amenities[a] for a in set(BASE_AMENITIES + features + rng.sample(OPTIONAL_AMENITIES, 4))],
                )
                quality[len(listings)] = host_quality[host_index] + rng.uniform(-0.08, 0.06)
                listings.append(listing)
        db.add_all(listings)
        db.flush()  # assigns ids, used by the Calendar

        cal = Calendar()
        demo_guest = guests[0]

        # The demo guest's own trips, covering every state of the My Trips page.
        demo_trips = [
            (listings[0], -40, 4, True, BookingStatus.confirmed),  # past, reviewed
            (listings[9], -9, 3, False, BookingStatus.confirmed),  # past, can still be reviewed
            (listings[20], -2, 5, False, BookingStatus.confirmed),  # happening now
            (listings[1], 18, 4, False, BookingStatus.confirmed),  # upcoming
            (listings[13], 45, 3, False, BookingStatus.confirmed),  # upcoming
            (listings[30], 25, 2, False, BookingStatus.cancelled),  # cancelled
        ]
        for listing, offset, nights, reviewed, status in demo_trips:
            start = today + timedelta(days=offset)
            booking = _make_booking(listing, demo_guest, start, nights, status)
            booking.guests = min(2, listing.max_guests)
            db.add(booking)
            if status == BookingStatus.confirmed:
                cal.take(listing.id, start, booking.check_out)
            if reviewed:
                db.add(_make_review(booking, 1.0))

        other_guests = guests[1:]
        for index, listing in enumerate(listings):
            # Past stays (most of them reviewed), spread over the last ~14 months.
            for _ in range(rng.randint(5, 14)):
                for _attempt in range(10):
                    start = today - timedelta(days=rng.randint(10, 420))
                    nights = rng.randint(listing.min_nights, listing.min_nights + 4)
                    end = start + timedelta(days=nights)
                    if end <= today - timedelta(days=1) and cal.free(listing.id, start, end):
                        booking = _make_booking(listing, rng.choice(other_guests), start, nights)
                        cal.take(listing.id, start, end)
                        db.add(booking)
                        if rng.random() < 0.85:
                            db.add(_make_review(booking, quality[index]))
                        break
            # Upcoming stays that block dates in the calendar.
            for _ in range(rng.randint(1, 4)):
                for _attempt in range(10):
                    start = today + timedelta(days=rng.randint(3, 100))
                    nights = rng.randint(listing.min_nights, listing.min_nights + 5)
                    if cal.free(listing.id, start, start + timedelta(days=nights)):
                        cal.take(listing.id, start, start + timedelta(days=nights))
                        db.add(_make_booking(listing, rng.choice(other_guests), start, nights))
                        break

        db.add_all([
            Wishlist(user=demo_guest, name="Goa getaways", created_at=_days_ago(30),
                     items=[WishlistItem(listing=listings[i]) for i in (2, 4, 6)]),
            Wishlist(user=demo_guest, name="Mountain escapes", created_at=_days_ago(12),
                     items=[WishlistItem(listing=listings[i]) for i in (8, 10, 13)]),
        ])
        db.commit()

        print(
            f"Seeded {len(hosts) + len(guests)} users, {len(listings)} listings, "
            f"{db.query(Booking).count()} bookings, {db.query(Review).count()} reviews."
        )


if __name__ == "__main__":
    seed()

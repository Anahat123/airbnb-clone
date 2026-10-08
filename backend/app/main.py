from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from .config import settings
from .database import Base, SessionLocal, engine
from .models import User
from .routers import auth, bookings, host, listings, reviews, uploads, wishlists


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    if settings.seed_on_startup:
        with SessionLocal() as db:
            empty = db.scalar(select(User.id).limit(1)) is None
        if empty:
            from .seed import seed

            seed()
    yield


app = FastAPI(title="Airbnb Clone API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth.router, listings.router, bookings.router, reviews.router, wishlists.router, host.router, uploads.router):
    app.include_router(router)

settings.upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}

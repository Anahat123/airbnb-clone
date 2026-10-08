"""Photo uploads. Uses Cloudinary when configured, otherwise saves to local disk."""

import uuid

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from .. import schemas
from ..auth import require_host
from ..config import settings
from ..models import User

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif"}
MAX_BYTES = 8 * 1024 * 1024


@router.post("", response_model=schemas.UploadOut)
async def upload_photo(file: UploadFile = File(...), _host: User = Depends(require_host)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, "Upload a JPEG, PNG, WebP or AVIF image")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Images must be 8 MB or smaller")

    if settings.cloudinary_cloud_name and settings.cloudinary_upload_preset:
        # Unsigned upload: the preset (configured in Cloudinary) decides folder and limits.
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/image/upload",
                data={"upload_preset": settings.cloudinary_upload_preset},
                files={"file": (file.filename or "photo", data, file.content_type)},
            )
        if res.status_code != 200:
            raise HTTPException(502, "Image upload failed, try again")
        return schemas.UploadOut(url=res.json()["secure_url"], storage="cloudinary")

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ALLOWED_TYPES[file.content_type]}"
    (settings.upload_dir / name).write_bytes(data)
    return schemas.UploadOut(url=f"{settings.public_base_url}/uploads/{name}", storage="local")

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """App settings, read from environment variables (or a .env file)."""

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    database_url: str = f"sqlite:///{BASE_DIR / 'airbnb.db'}"
    # Comma-separated list of origins allowed to call the API (the Next.js frontend).
    cors_origins: str = "http://localhost:3000"
    # Used to sign the mock auth tokens. Override in production.
    secret_key: str = "dev-secret-change-me"
    # Seed the database on startup when it is empty (handy on hosts with ephemeral disks).
    seed_on_startup: bool = True

    # Optional Cloudinary config. When unset, uploads are stored on local disk.
    cloudinary_cloud_name: str = ""
    cloudinary_upload_preset: str = ""

    upload_dir: Path = BASE_DIR / "uploads"
    public_base_url: str = "http://localhost:8000"

    # Fee rules used by the price breakdown.
    service_fee_rate: float = 0.14
    tax_rate: float = 0.12

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

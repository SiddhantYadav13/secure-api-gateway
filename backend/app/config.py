"""
config.py — Central configuration for the whole backend.

Values come from environment variables (loaded from .env) so real secrets are
never committed. Different environments (dev/test/prod) are separate classes.
"""

import os
from datetime import timedelta


class BaseConfig:
    """Settings shared by every environment."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")

    # --- JWT settings (Flask-JWT-Extended reads these) ---
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    # Access-token lifetime is configurable at runtime via the Settings page,
    # but this is the startup default (minutes).
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("JWT_EXPIRY_MINUTES", "30"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Gateway security defaults (mutable at runtime from Settings page) ---
    RATE_LIMIT_MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_MAX_REQUESTS", "10"))
    RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "60"))
    REPLAY_WINDOW_SECONDS = int(os.environ.get("REPLAY_WINDOW_SECONDS", "120"))
    MAX_FAILED_LOGINS = int(os.environ.get("MAX_FAILED_LOGINS", "5"))


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///gateway_dev.db"
    )


class TestingConfig(BaseConfig):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}

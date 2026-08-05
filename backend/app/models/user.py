"""User model — an account that can authenticate and send requests."""

from datetime import datetime, timezone

import bcrypt

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    role = db.relationship("Role", back_populates="users")

    is_blocked = db.Column(db.Boolean, default=False, nullable=False)
    failed_login_attempts = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # --- Password handling (bcrypt) ---
    def set_password(self, plaintext: str) -> None:
        """Hash and store a password. We never store the raw password."""
        self.password_hash = bcrypt.hashpw(
            plaintext.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, plaintext: str) -> bool:
        """Return True if the given password matches the stored hash."""
        return bcrypt.checkpw(
            plaintext.encode("utf-8"), self.password_hash.encode("utf-8")
        )

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role.name if self.role else None,
            "is_blocked": self.is_blocked,
            "failed_login_attempts": self.failed_login_attempts,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

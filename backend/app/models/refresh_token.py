"""
RefreshToken model — tracks issued refresh tokens so they can be revoked.

A refresh token lets a user get a new short-lived access token without logging
in again. Storing each token's unique id (jti) lets us invalidate them (logout,
key rotation, blocking a user).
"""

from datetime import datetime, timezone

from app.extensions import db


class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    jti = db.Column(db.String(64), unique=True, nullable=False, index=True)
    revoked = db.Column(db.Boolean, default=False, nullable=False)
    expires_at = db.Column(db.DateTime)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "jti": self.jti,
            "revoked": self.revoked,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

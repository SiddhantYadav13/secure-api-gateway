"""
BlockedRequest model — a focused record of requests the gateway REJECTED.

While api_logs records everything, this table gives the admin console a quick,
clean view of just the blocked traffic (and why).
"""

from datetime import datetime, timezone

from app.extensions import db


class BlockedRequest(db.Model):
    __tablename__ = "blocked_requests"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    username = db.Column(db.String(80))
    endpoint = db.Column(db.String(255))
    reason = db.Column(db.String(255))
    risk_score = db.Column(db.Integer, default=0)
    ip_address = db.Column(db.String(64))

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "user_id": self.user_id,
            "username": self.username,
            "endpoint": self.endpoint,
            "reason": self.reason,
            "risk_score": self.risk_score,
            "ip_address": self.ip_address,
        }

"""
SecurityEvent model — notable security incidents worth surfacing on the
dashboard's "recent events" feed and the admin threat overview.

Examples: login_success, login_failure, replay_blocked, tamper_detected,
key_rotation, user_blocked.
"""

from datetime import datetime, timezone

from app.extensions import db


class SecurityEvent(db.Model):
    __tablename__ = "security_events"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    username = db.Column(db.String(80))
    event_type = db.Column(db.String(50), index=True)
    severity = db.Column(db.String(20))  # info | warning | danger | success
    description = db.Column(db.String(255))
    ip_address = db.Column(db.String(64))

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "user_id": self.user_id,
            "username": self.username,
            "event_type": self.event_type,
            "severity": self.severity,
            "description": self.description,
            "ip_address": self.ip_address,
        }

"""
ApiLog model — one row per request that passes through the gateway.

This is the audit trail the Logs page and dashboard analytics read from.
Each column records the outcome of one security gate.
"""

from datetime import datetime, timezone

from app.extensions import db


class ApiLog(db.Model):
    __tablename__ = "api_logs"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    username = db.Column(db.String(80))          # denormalized for fast display
    endpoint = db.Column(db.String(255))
    method = db.Column(db.String(10))
    ip_address = db.Column(db.String(64))

    # Per-gate results (pass / fail / valid / invalid / etc.)
    jwt_status = db.Column(db.String(20))        # valid | invalid | expired
    role_status = db.Column(db.String(20))       # allowed | denied
    hash_status = db.Column(db.String(20))       # match | mismatch | n/a
    replay_status = db.Column(db.String(20))     # ok | replay
    rate_limit_status = db.Column(db.String(20)) # ok | exceeded

    # Overall outcome
    status = db.Column(db.String(20), index=True)  # allowed | flagged | blocked
    http_status = db.Column(db.Integer)
    risk_score = db.Column(db.Integer, default=0)
    risk_label = db.Column(db.String(20))          # safe | suspicious | blocked
    action_taken = db.Column(db.String(20))        # allow | flag | reject
    reason = db.Column(db.String(255))             # why it was blocked/flagged

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "user_id": self.user_id,
            "username": self.username,
            "endpoint": self.endpoint,
            "method": self.method,
            "ip_address": self.ip_address,
            "jwt_status": self.jwt_status,
            "role_status": self.role_status,
            "hash_status": self.hash_status,
            "replay_status": self.replay_status,
            "rate_limit_status": self.rate_limit_status,
            "status": self.status,
            "http_status": self.http_status,
            "risk_score": self.risk_score,
            "risk_label": self.risk_label,
            "action_taken": self.action_taken,
            "reason": self.reason,
        }

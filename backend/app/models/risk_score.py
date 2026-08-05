"""
RiskScore model — a detailed breakdown of how one request's risk score was
computed. The Risk Center page reads these to explain WHY a score was high.

`factors` stores the individual contributions as JSON text, e.g.
[{"factor": "expired_jwt", "points": 40}, {"factor": "replay", "points": 50}].
"""

import json
from datetime import datetime, timezone

from app.extensions import db


class RiskScore(db.Model):
    __tablename__ = "risk_scores"

    id = db.Column(db.Integer, primary_key=True)
    log_id = db.Column(db.Integer, db.ForeignKey("api_logs.id"), nullable=True)
    timestamp = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    username = db.Column(db.String(80))
    endpoint = db.Column(db.String(255))
    score = db.Column(db.Integer, default=0)
    label = db.Column(db.String(20))          # safe | suspicious | blocked
    factors_json = db.Column(db.Text)         # JSON string of contributing factors

    def set_factors(self, factors: list):
        self.factors_json = json.dumps(factors)

    def get_factors(self) -> list:
        return json.loads(self.factors_json) if self.factors_json else []

    def to_dict(self):
        return {
            "id": self.id,
            "log_id": self.log_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "username": self.username,
            "endpoint": self.endpoint,
            "score": self.score,
            "label": self.label,
            "factors": self.get_factors(),
        }

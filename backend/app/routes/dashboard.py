"""
dashboard.py — Aggregated analytics for the Dashboard and Risk Center pages.

Reads the audit tables and returns summary counts, time-series data for charts,
recent security events, and risk distribution.
"""

from collections import Counter
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app.extensions import db
from app.models import ApiLog, RiskScore, SecurityEvent

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    total = db.session.query(func.count(ApiLog.id)).scalar() or 0
    allowed = db.session.query(func.count(ApiLog.id)).filter(
        ApiLog.status == "allowed"
    ).scalar() or 0
    blocked = db.session.query(func.count(ApiLog.id)).filter(
        ApiLog.status == "blocked"
    ).scalar() or 0
    flagged = db.session.query(func.count(ApiLog.id)).filter(
        ApiLog.status == "flagged"
    ).scalar() or 0
    failed_logins = db.session.query(func.count(SecurityEvent.id)).filter(
        SecurityEvent.event_type == "login_failure"
    ).scalar() or 0
    replays = db.session.query(func.count(ApiLog.id)).filter(
        ApiLog.replay_status == "replay"
    ).scalar() or 0
    avg_risk = db.session.query(func.avg(ApiLog.risk_score)).scalar() or 0

    return jsonify(
        {
            "total_requests": total,
            "successful_requests": allowed,
            "blocked_requests": blocked,
            "suspicious_requests": flagged,
            "failed_logins": failed_logins,
            "replay_attacks": replays,
            "average_risk": round(float(avg_risk), 1),
        }
    )


@dashboard_bp.route("/timeline", methods=["GET"])
@jwt_required()
def timeline():
    """Requests grouped by hour for the last 24 hours (for the activity chart)."""
    now = datetime.now(timezone.utc)
    since = now - timedelta(hours=24)
    logs = ApiLog.query.filter(ApiLog.timestamp >= since).all()

    buckets = {}
    for i in range(24):
        hour = (since + timedelta(hours=i)).strftime("%H:00")
        buckets[hour] = {"time": hour, "allowed": 0, "blocked": 0, "flagged": 0}

    for log in logs:
        if log.timestamp is None:
            continue
        ts = log.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        hour = ts.strftime("%H:00")
        if hour in buckets and log.status in ("allowed", "blocked", "flagged"):
            buckets[hour][log.status] += 1

    return jsonify({"timeline": list(buckets.values())})


@dashboard_bp.route("/risk-distribution", methods=["GET"])
@jwt_required()
def risk_distribution():
    labels = [r.label for r in db.session.query(RiskScore.label).all()]
    counts = Counter(labels)
    return jsonify(
        {
            "distribution": [
                {"label": "safe", "value": counts.get("safe", 0)},
                {"label": "suspicious", "value": counts.get("suspicious", 0)},
                {"label": "blocked", "value": counts.get("blocked", 0)},
            ]
        }
    )


@dashboard_bp.route("/recent-events", methods=["GET"])
@jwt_required()
def recent_events():
    events = (
        SecurityEvent.query.order_by(SecurityEvent.timestamp.desc()).limit(15).all()
    )
    return jsonify({"events": [e.to_dict() for e in events]})


@dashboard_bp.route("/top-endpoints", methods=["GET"])
@jwt_required()
def top_endpoints():
    rows = (
        db.session.query(ApiLog.endpoint, func.count(ApiLog.id).label("count"))
        .group_by(ApiLog.endpoint)
        .order_by(func.count(ApiLog.id).desc())
        .limit(6)
        .all()
    )
    return jsonify({"endpoints": [{"endpoint": r[0], "count": r[1]} for r in rows]})


@dashboard_bp.route("/security-status", methods=["GET"])
@jwt_required()
def security_status():
    from app.services import security_state

    return jsonify(
        {
            "jwt": "active",
            "encryption": "active",
            "logging": "active",
            "replay_protection": (
                "active"
                if security_state.settings["replay_protection_enabled"]
                else "disabled"
            ),
            "risk_scoring": (
                "active"
                if security_state.settings["risk_scoring_enabled"]
                else "disabled"
            ),
        }
    )

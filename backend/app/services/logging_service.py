"""
logging_service.py — Central place that writes the audit trail.

Every gateway decision and notable security incident flows through here so the
Logs page, Risk Center, and Admin console all read consistent data.
"""

from datetime import datetime, timezone

from app.extensions import db
from app.models import ApiLog, BlockedRequest, RiskScore, SecurityEvent


def record_request(*, user, endpoint, method, ip, gate_results, risk, decision):
    """
    Persist a full record of one analyzed request across the relevant tables:
    api_logs (always), risk_scores (always), blocked_requests (only if rejected).
    Returns the created ApiLog.
    """
    status = {"allow": "allowed", "flag": "flagged", "reject": "blocked"}[decision]
    http_status = {"allow": 200, "flag": 200, "reject": 403}[decision]

    log = ApiLog(
        user_id=user.id if user else None,
        username=user.username if user else "anonymous",
        endpoint=endpoint,
        method=method,
        ip_address=ip,
        jwt_status=gate_results.get("jwt_status"),
        role_status=gate_results.get("role_status"),
        hash_status=gate_results.get("hash_status"),
        replay_status=gate_results.get("replay_status"),
        rate_limit_status=gate_results.get("rate_limit_status"),
        status=status,
        http_status=http_status,
        risk_score=risk["score"],
        risk_label=risk["label"],
        action_taken=decision,
        reason=gate_results.get("reason", ""),
    )
    db.session.add(log)
    db.session.flush()  # assigns log.id without a full commit

    rs = RiskScore(
        log_id=log.id,
        username=log.username,
        endpoint=endpoint,
        score=risk["score"],
        label=risk["label"],
    )
    rs.set_factors(risk["factors"])
    db.session.add(rs)

    if decision == "reject":
        db.session.add(
            BlockedRequest(
                user_id=user.id if user else None,
                username=log.username,
                endpoint=endpoint,
                reason=gate_results.get("reason", ""),
                risk_score=risk["score"],
                ip_address=ip,
            )
        )

    db.session.commit()
    return log


def record_event(*, event_type, severity, description, user=None, ip=None):
    """Write a SecurityEvent row for the dashboard's recent-events feed."""
    event = SecurityEvent(
        user_id=user.id if user else None,
        username=user.username if user else None,
        event_type=event_type,
        severity=severity,
        description=description,
        ip_address=ip,
        timestamp=datetime.now(timezone.utc),
    )
    db.session.add(event)
    db.session.commit()
    return event

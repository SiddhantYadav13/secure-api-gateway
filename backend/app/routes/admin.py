"""
admin.py — Admin Security Console endpoints (admin role only).

User management (list/block/unblock), threat overview, key rotation, and
high-level security event feeds.
"""

from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify
from sqlalchemy import func

from app.extensions import db
from app.middleware.auth_guard import admin_required
from app.models import ApiLog, BlockedRequest, SecurityEvent, User
from app.services import security_state
from app.services.logging_service import record_event

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]})


@admin_bp.route("/users/<int:user_id>/block", methods=["POST"])
@admin_required
def block_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    user.is_blocked = True
    db.session.commit()
    record_event(
        event_type="user_blocked",
        severity="danger",
        description=f"Admin blocked user '{user.username}'",
        user=user,
    )
    return jsonify({"message": "user blocked", "user": user.to_dict()})


@admin_bp.route("/users/<int:user_id>/unblock", methods=["POST"])
@admin_required
def unblock_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    user.is_blocked = False
    user.failed_login_attempts = 0
    db.session.commit()
    record_event(
        event_type="user_unblocked",
        severity="info",
        description=f"Admin unblocked user '{user.username}'",
        user=user,
    )
    return jsonify({"message": "user unblocked", "user": user.to_dict()})


@admin_bp.route("/threats", methods=["GET"])
@admin_required
def threats():
    now = datetime.now(timezone.utc)
    since = now - timedelta(hours=24)

    blocked_total = db.session.query(func.count(BlockedRequest.id)).scalar() or 0
    failed_logins = db.session.query(func.count(SecurityEvent.id)).filter(
        SecurityEvent.event_type == "login_failure"
    ).scalar() or 0
    replays = db.session.query(func.count(ApiLog.id)).filter(
        ApiLog.replay_status == "replay"
    ).scalar() or 0
    tamper = db.session.query(func.count(ApiLog.id)).filter(
        ApiLog.hash_status == "mismatch"
    ).scalar() or 0
    blocked_users = db.session.query(func.count(User.id)).filter(
        User.is_blocked.is_(True)
    ).scalar() or 0

    recent_blocked = (
        BlockedRequest.query.order_by(BlockedRequest.timestamp.desc()).limit(10).all()
    )

    return jsonify(
        {
            "blocked_requests": blocked_total,
            "failed_logins": failed_logins,
            "replay_attacks": replays,
            "tamper_attempts": tamper,
            "blocked_users": blocked_users,
            "recent_blocked": [b.to_dict() for b in recent_blocked],
            "key_rotated_at": security_state.key_rotated_at,
        }
    )


@admin_bp.route("/rotate-keys", methods=["POST"])
@admin_required
def rotate_keys():
    pem = security_state.rotate_keys()
    record_event(
        event_type="key_rotation",
        severity="warning",
        description="Admin rotated the RSA key pair",
    )
    return jsonify({"message": "keys rotated", "public_key": pem})

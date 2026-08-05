"""
settings.py — Security Controls page backend.

Read and update the runtime-tunable gateway settings (JWT expiry, rate limit,
replay window, toggles). Admin-only for changes.
"""

from flask import Blueprint, jsonify, request

from app.middleware.auth_guard import admin_required
from app.services import security_state
from app.services.logging_service import record_event

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

# Which settings are editable, and how to coerce their incoming values.
_EDITABLE = {
    "jwt_expiry_minutes": int,
    "rate_limit_max_requests": int,
    "rate_limit_window_seconds": int,
    "replay_window_seconds": int,
    "replay_protection_enabled": bool,
    "risk_scoring_enabled": bool,
    "max_failed_logins": int,
}


@settings_bp.route("", methods=["GET"])
def get_settings():
    return jsonify({"settings": dict(security_state.settings)})


@settings_bp.route("", methods=["PUT"])
@admin_required
def update_settings():
    data = request.get_json(silent=True) or {}
    updates = {}
    for key, caster in _EDITABLE.items():
        if key in data:
            try:
                updates[key] = caster(data[key])
            except (ValueError, TypeError):
                return jsonify({"error": f"invalid value for {key}"}), 400

    new_settings = security_state.update_settings(updates)
    record_event(
        event_type="settings_updated",
        severity="info",
        description=f"Security settings updated: {', '.join(updates.keys())}",
    )
    return jsonify({"message": "settings updated", "settings": new_settings})

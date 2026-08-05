"""
auth_guard.py — Reusable decorators that protect routes.

`@admin_required` builds on Flask-JWT-Extended's `@jwt_required` and additionally
checks the caller's role claim. This keeps authorization logic in ONE place
instead of copy-pasting role checks into every admin route.
"""

from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

from app.extensions import db
from app.models import User


def _current_user():
    """Load the User row for the identity in the current JWT (or None)."""
    from flask_jwt_extended import get_jwt_identity

    user_id = get_jwt_identity()
    if user_id is None:
        return None
    return db.session.get(User, int(user_id))


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        user = _current_user()
        if user and user.is_blocked:
            return jsonify({"error": "Account is blocked"}), 403
        return fn(*args, **kwargs)

    return wrapper

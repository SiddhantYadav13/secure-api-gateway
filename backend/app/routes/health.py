"""
routes/health.py — A "health check" endpoint.

WHY this file exists:
    Every production service needs a URL that answers "are you alive?".
    Load balancers, Docker, and uptime monitors ping it constantly. It is also
    the simplest possible way for US to confirm the server is wired up correctly
    before we add any real logic.

WHY a "Blueprint":
    A Flask Blueprint is a group of related routes that live in their own file.
    Instead of registering every route on one giant `app` object (spaghetti),
    each feature area (health, auth, crypto, logs...) gets its own Blueprint,
    and the app factory plugs them in. This keeps the codebase modular — the
    "separate folders / reusable" rule from the project spec.
"""

from datetime import datetime, timezone

from flask import Blueprint, jsonify

# Create a Blueprint named "health". The url_prefix means every route in this
# file automatically starts with /api — so the route below becomes /api/health.
health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.route("/health", methods=["GET"])
def health_check():
    """
    Return a small JSON object proving the server is up.

    jsonify() converts a Python dict into a proper JSON HTTP response with the
    correct 'Content-Type: application/json' header — what our frontend expects.
    """
    return jsonify(
        {
            "status": "ok",
            "service": "secure-api-gateway",
            "phase": 1,
            "time": datetime.now(timezone.utc).isoformat(),
        }
    )

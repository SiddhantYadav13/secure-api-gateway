from datetime import datetime, timezone

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__, url_prefix="/api")


# ---------------- HOME PAGE ----------------
# This route is NOT inside /api because it is added directly to the Flask app.
# It gives visitors a friendly landing page instead of "404 Not Found".
root_bp = Blueprint("root", __name__)


@root_bp.route("/", methods=["GET"])
def home():
    return jsonify(
        {
            "project": "Secure API Gateway",
            "status": "Running ✅",
            "health_endpoint": "/api/health",
            "message": "Backend is deployed successfully on Render."
        }
    )


# ---------------- HEALTH CHECK ----------------

@health_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify(
        {
            "status": "ok",
            "service": "secure-api-gateway",
            "phase": 1,
            "time": datetime.now(timezone.utc).isoformat(),
        }
    )

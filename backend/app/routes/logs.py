"""
logs.py — The Logs / Monitoring page backend.

Provides a paginated, searchable, filterable view over api_logs, plus a CSV
export. Non-admin users only see their own logs; admins see everything.
"""

import csv
import io

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.extensions import db
from app.models import ApiLog, User

logs_bp = Blueprint("logs", __name__, url_prefix="/api/logs")


def _base_query():
    """Restrict to the caller's own logs unless they're an admin."""
    query = ApiLog.query
    claims = get_jwt()
    if claims.get("role") != "admin":
        user = db.session.get(User, int(get_jwt_identity()))
        query = query.filter(ApiLog.user_id == (user.id if user else -1))
    return query


@logs_bp.route("", methods=["GET"])
@jwt_required()
def list_logs():
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 15)), 100)
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    risk = request.args.get("risk", "").strip()

    query = _base_query()

    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(ApiLog.endpoint.ilike(like), ApiLog.username.ilike(like))
        )
    if status:
        query = query.filter(ApiLog.status == status)
    if risk:
        query = query.filter(ApiLog.risk_label == risk)

    query = query.order_by(ApiLog.timestamp.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "logs": [log.to_dict() for log in pagination.items],
            "total": pagination.total,
            "page": page,
            "per_page": per_page,
            "pages": pagination.pages,
        }
    )


@logs_bp.route("/export", methods=["GET"])
@jwt_required()
def export_csv():
    logs = _base_query().order_by(ApiLog.timestamp.desc()).limit(5000).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "timestamp", "username", "endpoint", "method", "status",
            "risk_score", "risk_label", "jwt_status", "role_status",
            "hash_status", "replay_status", "rate_limit_status",
            "action_taken", "reason", "ip_address",
        ]
    )
    for log in logs:
        writer.writerow(
            [
                log.timestamp.isoformat() if log.timestamp else "",
                log.username, log.endpoint, log.method, log.status,
                log.risk_score, log.risk_label, log.jwt_status, log.role_status,
                log.hash_status, log.replay_status, log.rate_limit_status,
                log.action_taken, log.reason, log.ip_address,
            ]
        )

    return Response(
        buffer.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=gateway_logs.csv"},
    )

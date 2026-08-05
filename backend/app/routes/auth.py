"""
auth.py — Authentication endpoints: register, login, refresh, logout, me.

Flow:
  register -> create user (bcrypt-hashed password), default role "client".
  login    -> verify password, enforce brute-force lockout, issue JWT access +
              refresh tokens (role embedded as a claim).
  refresh  -> exchange a valid refresh token for a new access token.
  me       -> return the current user's profile.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from app.extensions import db
from app.models import Role, User
from app.services import security_state
from app.services.logging_service import record_event

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _issue_tokens(user: User):
    """Create access + refresh tokens carrying the user's role and username."""
    claims = {"role": user.role.name, "username": user.username}
    access = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh = create_refresh_token(identity=str(user.id), additional_claims=claims)
    return access, refresh


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    requested_role = (data.get("role") or "client").lower()

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "username or email already exists"}), 409

    # Only allow "client" or "admin"; default/fallback is client.
    role_name = "admin" if requested_role == "admin" else "client"
    role = Role.query.filter_by(name=role_name).first()

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    record_event(
        event_type="user_registered",
        severity="info",
        description=f"New user registered: {username} ({role_name})",
        user=user,
        ip=request.remote_addr,
    )

    access, refresh = _issue_tokens(user)
    return (
        jsonify(
            {
                "message": "registered",
                "user": user.to_dict(),
                "access_token": access,
                "refresh_token": refresh,
            }
        ),
        201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        # Track failed attempts for brute-force protection.
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= security_state.settings["max_failed_logins"]:
                user.is_blocked = True
            db.session.commit()
            record_event(
                event_type="login_failure",
                severity="warning",
                description=f"Failed login for {username} "
                f"(attempt {user.failed_login_attempts})",
                user=user,
                ip=request.remote_addr,
            )
        else:
            record_event(
                event_type="login_failure",
                severity="warning",
                description=f"Failed login for unknown user '{username}'",
                ip=request.remote_addr,
            )
        return jsonify({"error": "invalid credentials"}), 401

    if user.is_blocked:
        record_event(
            event_type="login_blocked",
            severity="danger",
            description=f"Blocked user '{username}' attempted login",
            user=user,
            ip=request.remote_addr,
        )
        return jsonify({"error": "account is blocked. contact an administrator."}), 403

    # Success: reset the failure counter.
    user.failed_login_attempts = 0
    db.session.commit()

    access, refresh = _issue_tokens(user)

    record_event(
        event_type="login_success",
        severity="success",
        description=f"User '{username}' logged in",
        user=user,
        ip=request.remote_addr,
    )
    return jsonify(
        {
            "message": "logged in",
            "user": user.to_dict(),
            "access_token": access,
            "refresh_token": refresh,
        }
    )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or user.is_blocked:
        return jsonify({"error": "cannot refresh"}), 401
    claims = {"role": user.role.name, "username": user.username}
    access = create_access_token(identity=str(user.id), additional_claims=claims)
    return jsonify({"access_token": access})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    # With stateless JWTs, "logout" is primarily client-side (drop the token).
    # We record the event for the audit trail.
    user = db.session.get(User, int(get_jwt_identity()))
    record_event(
        event_type="logout",
        severity="info",
        description=f"User '{user.username}' logged out" if user else "logout",
        user=user,
        ip=request.remote_addr,
    )
    return jsonify({"message": "logged out"})

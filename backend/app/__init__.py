"""
app/__init__.py — The Application Factory.

create_app() builds and returns a fully wired Flask application: config, database,
JWT, CORS, all feature blueprints, JWT error handlers, and first-run seeding.
"""

from flask import Flask, jsonify
from flask_cors import CORS

from app.config import config_by_name
from app.extensions import db, jwt


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_by_name[config_name])

    # Make sure the instance folder (for the SQLite file) exists.
    import os

    os.makedirs(app.instance_path, exist_ok=True)

    # --- Init extensions ---
    CORS(app)
    db.init_app(app)
    jwt.init_app(app)

    _register_jwt_handlers()
    _register_blueprints(app)

    # --- First-run setup: create tables, seed data, load runtime settings ---
    with app.app_context():
        from app import models  # noqa: F401 — ensures models are registered
        from app.seed import seed_database
        from app.services import security_state

        db.create_all()
        seed_database()
        security_state.init_settings_from_config(app.config)

    return app


def _register_blueprints(app: Flask):
    from app.routes.admin import admin_bp
    from app.routes.auth import auth_bp
    from app.routes.crypto import crypto_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.gateway import gateway_bp
    from app.routes.health import health_bp
    from app.routes.logs import logs_bp
    from app.routes.settings import settings_bp

    for bp in (
        health_bp, auth_bp, gateway_bp, crypto_bp,
        dashboard_bp, logs_bp, admin_bp, settings_bp,
    ):
        app.register_blueprint(bp)


def _register_jwt_handlers():
    """Return clean JSON (not HTML) when a token is missing/invalid/expired."""

    @jwt.expired_token_loader
    def expired(_header, _payload):
        return jsonify({"error": "token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid(reason):
        return jsonify({"error": "invalid token", "detail": reason}), 401

    @jwt.unauthorized_loader
    def missing(reason):
        return jsonify({"error": "authorization required", "detail": reason}), 401

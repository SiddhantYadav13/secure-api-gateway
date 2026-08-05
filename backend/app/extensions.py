"""
extensions.py — Shared Flask extension instances.

These are created here (unbound to any app) and later attached inside the
application factory via `db.init_app(app)`. Keeping them in their own module
avoids circular imports (models import `db` from here; the factory also imports
`db` from here).
"""

from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy

# The database object. Models subclass `db.Model`.
db = SQLAlchemy()

# Handles JWT creation, verification, and the @jwt_required decorator.
jwt = JWTManager()

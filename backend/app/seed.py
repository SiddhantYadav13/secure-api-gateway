"""
seed.py — Create baseline data so the app is usable immediately.

Ensures the two roles exist and creates a default admin account (only if there
are no users yet). Credentials are printed once so you can log in during dev.
"""

from app.extensions import db
from app.models import Role, User

DEFAULT_ADMIN = {"username": "admin", "email": "admin@gateway.local", "password": "admin123"}
DEFAULT_CLIENT = {"username": "client", "email": "client@gateway.local", "password": "client123"}


def seed_database():
    # 1. Roles
    roles = {
        "admin": "Full access: user management, key rotation, all logs.",
        "client": "Standard user: can send requests and view own logs.",
    }
    for name, desc in roles.items():
        if not Role.query.filter_by(name=name).first():
            db.session.add(Role(name=name, description=desc))
    db.session.commit()

    # 2. Demo users (only if the users table is empty)
    if User.query.count() == 0:
        admin_role = Role.query.filter_by(name="admin").first()
        client_role = Role.query.filter_by(name="client").first()

        admin = User(
            username=DEFAULT_ADMIN["username"],
            email=DEFAULT_ADMIN["email"],
            role=admin_role,
        )
        admin.set_password(DEFAULT_ADMIN["password"])

        client = User(
            username=DEFAULT_CLIENT["username"],
            email=DEFAULT_CLIENT["email"],
            role=client_role,
        )
        client.set_password(DEFAULT_CLIENT["password"])

        db.session.add_all([admin, client])
        db.session.commit()
        print("Seeded demo accounts:")
        print(f"  admin  -> {DEFAULT_ADMIN['username']} / {DEFAULT_ADMIN['password']}")
        print(f"  client -> {DEFAULT_CLIENT['username']} / {DEFAULT_CLIENT['password']}")

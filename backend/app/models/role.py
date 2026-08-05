"""Role model — defines what a user is allowed to do (admin vs client)."""

from app.extensions import db


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)  # "admin" | "client"
    description = db.Column(db.String(255))

    # One role has many users. `back_populates` links both sides.
    users = db.relationship("User", back_populates="role")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "description": self.description}

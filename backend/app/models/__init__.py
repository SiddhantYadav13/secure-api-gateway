"""
models package — every database table lives here as a Python class.

Importing them here means a single `from app.models import *` (or importing the
package) registers all tables with SQLAlchemy, so `db.create_all()` sees them.
"""

from app.models.role import Role
from app.models.user import User
from app.models.api_log import ApiLog
from app.models.security_event import SecurityEvent
from app.models.risk_score import RiskScore
from app.models.blocked_request import BlockedRequest
from app.models.refresh_token import RefreshToken

__all__ = [
    "Role",
    "User",
    "ApiLog",
    "SecurityEvent",
    "RiskScore",
    "BlockedRequest",
    "RefreshToken",
]

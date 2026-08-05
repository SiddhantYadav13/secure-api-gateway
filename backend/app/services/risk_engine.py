"""
risk_engine.py — Turns the outcome of each security gate into a numeric risk
score (0-100) and a label (safe / suspicious / blocked).

This is the "security officer's judgment" of the gateway. Each problem adds
points. Higher score => more dangerous. The label drives the gateway decision.
"""

# How many risk points each detected problem contributes.
FACTOR_WEIGHTS = {
    "invalid_jwt": 40,
    "expired_jwt": 40,
    "missing_jwt": 40,
    "wrong_role": 30,
    "tampered_hash": 50,
    "replay": 50,
    "rate_limit_exceeded": 30,
    "user_blocked": 100,
}

FACTOR_LABELS = {
    "invalid_jwt": "Invalid JWT token",
    "expired_jwt": "Expired JWT token",
    "missing_jwt": "Missing JWT token",
    "wrong_role": "Insufficient role/permission",
    "tampered_hash": "Payload hash mismatch (tampering)",
    "replay": "Replay attack detected",
    "rate_limit_exceeded": "Rate limit exceeded",
    "user_blocked": "User is blocked",
}


def evaluate(triggered_factors: list[str]) -> dict:
    """
    Given a list of factor keys that were triggered, compute the total score,
    a human-readable breakdown, and the final label.
    """
    factors = []
    total = 0
    for key in triggered_factors:
        points = FACTOR_WEIGHTS.get(key, 0)
        total += points
        factors.append(
            {"factor": key, "label": FACTOR_LABELS.get(key, key), "points": points}
        )

    score = min(total, 100)

    if score >= 70 or "user_blocked" in triggered_factors:
        label = "blocked"
    elif score >= 30:
        label = "suspicious"
    else:
        label = "safe"

    return {"score": score, "label": label, "factors": factors}


def decision_from_label(label: str) -> str:
    """Map a risk label to the gateway action."""
    return {"safe": "allow", "suspicious": "flag", "blocked": "reject"}.get(
        label, "flag"
    )

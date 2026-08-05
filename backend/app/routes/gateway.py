"""
gateway.py — The Secure Request Analyzer: the core gateway pipeline.

POST /api/gateway/analyze  -> runs a user-supplied request through every gate.
POST /api/gateway/simulate -> crafts a specific attack server-side (so we can,
                              e.g., mint a genuinely expired token) and runs the
                              same pipeline. Powers the Attack Simulator page.

Pipeline (matches the blueprint's API flow):
  JWT check -> Role check -> Replay check -> Rate limit -> SHA-256 integrity
  -> Risk score -> Allow/Flag/Reject -> Log everything -> Return signed response
"""

import time
from datetime import timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, decode_token

from app.extensions import db
from app.models import User
from app.services import crypto_service, risk_engine, security_state
from app.services.logging_service import record_event, record_request

gateway_bp = Blueprint("gateway", __name__, url_prefix="/api/gateway")


def _sign_response(payload: dict) -> dict:
    """Attach a digital signature over a canonical string of the decision."""
    canonical = f"{payload['action']}|{payload['risk']['score']}|{payload['endpoint']}"
    signature = crypto_service.sign_data(canonical, security_state.get_private_key())
    return {"signature": signature, "signed_data": canonical}


def run_pipeline(params: dict, ip: str) -> dict:
    """
    Core gateway logic shared by /analyze and /simulate.
    `params` may contain: endpoint, method, payload, token, nonce, timestamp,
    expected_hash. Returns the full response dict (already logged).
    """
    endpoint = params.get("endpoint", "/api/resource")
    method = params.get("method", "POST")
    payload = params.get("payload", "")
    token = params.get("token")
    nonce = params.get("nonce")
    timestamp = params.get("timestamp")
    provided_hash = params.get("expected_hash")

    triggered = []
    gate_results = {}
    user = None

    # --- Gate 1: JWT verification ---
    if not token:
        gate_results["jwt_status"] = "missing"
        triggered.append("missing_jwt")
    else:
        try:
            decoded = decode_token(token)
            user_id = decoded.get("sub")
            user = db.session.get(User, int(user_id)) if user_id else None
            if user is None:
                gate_results["jwt_status"] = "invalid"
                triggered.append("invalid_jwt")
            elif user.is_blocked:
                gate_results["jwt_status"] = "valid"
                triggered.append("user_blocked")
            else:
                gate_results["jwt_status"] = "valid"
        except Exception as exc:  # expired or malformed
            msg = str(exc).lower()
            if "expired" in msg:
                gate_results["jwt_status"] = "expired"
                triggered.append("expired_jwt")
            else:
                gate_results["jwt_status"] = "invalid"
                triggered.append("invalid_jwt")

    # --- Gate 2: Role check (admin-only endpoints) ---
    role = user.role.name if user else None
    if endpoint.startswith("/api/admin") and role != "admin":
        gate_results["role_status"] = "denied"
        triggered.append("wrong_role")
    else:
        gate_results["role_status"] = "allowed" if user else "n/a"

    # --- Gate 3: Replay detection ---
    replay = security_state.check_replay(nonce, timestamp)
    if replay["ok"]:
        gate_results["replay_status"] = "ok"
    else:
        gate_results["replay_status"] = "replay"
        triggered.append("replay")

    # --- Gate 4: Rate limiting ---
    # `_identity` lets the Attack Simulator target a dedicated bucket.
    identity = params.get("_identity") or (user.username if user else ip) or "anonymous"
    if security_state.check_rate_limit(identity):
        gate_results["rate_limit_status"] = "ok"
    else:
        gate_results["rate_limit_status"] = "exceeded"
        triggered.append("rate_limit_exceeded")

    # --- Gate 5: SHA-256 integrity ---
    if provided_hash:
        actual = crypto_service.sha256_hash(payload)
        if actual == provided_hash:
            gate_results["hash_status"] = "match"
        else:
            gate_results["hash_status"] = "mismatch"
            triggered.append("tampered_hash")
        gate_results["computed_hash"] = actual
    else:
        gate_results["hash_status"] = "n/a"
        gate_results["computed_hash"] = crypto_service.sha256_hash(payload)

    # --- Gate 6: Risk scoring ---
    if not security_state.settings["risk_scoring_enabled"]:
        risk = {"score": 0, "label": "safe", "factors": []}
    else:
        risk = risk_engine.evaluate(triggered)

    decision = risk_engine.decision_from_label(risk["label"])

    if triggered:
        gate_results["reason"] = ", ".join(
            risk_engine.FACTOR_LABELS.get(f, f) for f in triggered
        )
    else:
        gate_results["reason"] = "all checks passed"

    # --- Gate 7: Log everything ---
    log = record_request(
        user=user,
        endpoint=endpoint,
        method=method,
        ip=ip,
        gate_results=gate_results,
        risk=risk,
        decision=decision,
    )

    if decision == "reject":
        record_event(
            event_type="request_blocked",
            severity="danger",
            description=f"Blocked {method} {endpoint}: {gate_results['reason']}",
            user=user,
            ip=ip,
        )

    # --- Gate 8: Signed response ---
    response = {
        "endpoint": endpoint,
        "method": method,
        "gates": {
            "jwt": gate_results.get("jwt_status"),
            "role": gate_results.get("role_status"),
            "replay": gate_results.get("replay_status"),
            "rate_limit": gate_results.get("rate_limit_status"),
            "hash": gate_results.get("hash_status"),
        },
        "computed_hash": gate_results.get("computed_hash"),
        "risk": risk,
        "action": decision,
        "status": log.status,
        "reason": gate_results["reason"],
        "log_id": log.id,
        "timestamp": time.time(),
    }
    response["security"] = _sign_response(response)
    return response


@gateway_bp.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}
    return jsonify(run_pipeline(data, request.remote_addr))


# --------------------------------------------------------------------------- #
# Attack Simulator — craft each attack server-side and run the pipeline.
# --------------------------------------------------------------------------- #
def _valid_token_for(username: str):
    user = User.query.filter_by(username=username).first()
    if not user:
        return None
    claims = {"role": user.role.name, "username": user.username}
    return create_access_token(identity=str(user.id), additional_claims=claims)


ATTACKS = {
    "invalid_jwt": "Send a structurally broken/forged JWT token.",
    "expired_jwt": "Send a JWT whose expiry is in the past.",
    "replay": "Resend a request with a nonce that was already used.",
    "tampered_payload": "Send a payload whose SHA-256 hash doesn't match.",
    "wrong_role": "Use a client token to hit an admin-only endpoint.",
    "rate_limit": "Fire many requests quickly to exceed the rate limit.",
}


@gateway_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json(silent=True) or {}
    attack = data.get("attack")
    ip = request.remote_addr

    if attack not in ATTACKS:
        return jsonify({"error": "unknown attack", "available": list(ATTACKS)}), 400

    if attack == "invalid_jwt":
        params = {"endpoint": "/api/resource", "token": "forged.invalid.token",
                  "nonce": "atk-" + str(time.time()), "timestamp": time.time()}

    elif attack == "expired_jwt":
        user = User.query.filter_by(username="admin").first()
        expired = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role.name, "username": user.username},
            expires_delta=timedelta(seconds=-10),
        )
        params = {"endpoint": "/api/resource", "token": expired,
                  "nonce": "atk-" + str(time.time()), "timestamp": time.time()}

    elif attack == "replay":
        token = _valid_token_for("admin")
        fixed_nonce = "replay-fixed-nonce"
        # First request seeds the nonce (this one is legitimate)...
        run_pipeline({"endpoint": "/api/resource", "token": token,
                      "nonce": fixed_nonce, "timestamp": time.time()}, ip)
        # ...the returned result is the REPLAY (same nonce again).
        params = {"endpoint": "/api/resource", "token": token,
                  "nonce": fixed_nonce, "timestamp": time.time()}

    elif attack == "tampered_payload":
        token = _valid_token_for("admin")
        params = {"endpoint": "/api/resource", "token": token,
                  "payload": '{"amount": 100}', "expected_hash": "0" * 64,
                  "nonce": "atk-" + str(time.time()), "timestamp": time.time()}

    elif attack == "wrong_role":
        token = _valid_token_for("client")
        params = {"endpoint": "/api/admin/secret", "token": token,
                  "nonce": "atk-" + str(time.time()), "timestamp": time.time()}

    elif attack == "rate_limit":
        token = _valid_token_for("admin")
        # Hammer a dedicated bucket so the pipeline's own check trips as exceeded.
        limit = security_state.settings["rate_limit_max_requests"]
        for _ in range(limit + 1):
            security_state.check_rate_limit("rate-attack-sim")
        params = {"endpoint": "/api/resource", "token": token,
                  "payload": "burst", "nonce": "atk-" + str(time.time()),
                  "timestamp": time.time(), "_identity": "rate-attack-sim"}

    result = run_pipeline(params, ip)
    result["expected"] = ATTACKS[attack]
    result["attack"] = attack
    return jsonify(result)

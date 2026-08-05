"""
crypto.py — Endpoints for the Encryption / Decryption Visualizer page.

Exposes the gateway's public key and runs the full hybrid-encryption demo
(AES-256 + RSA-2048 key wrap + SHA-256 + digital signature + round-trip decrypt)
so the frontend can visualize every step.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.services import crypto_service, security_state

crypto_bp = Blueprint("crypto", __name__, url_prefix="/api/crypto")


@crypto_bp.route("/public-key", methods=["GET"])
def public_key():
    return jsonify({"public_key": security_state.get_public_key_pem()})


@crypto_bp.route("/demo", methods=["POST"])
@jwt_required()
def demo():
    data = request.get_json(silent=True) or {}
    plaintext = data.get("plaintext", "")
    if not plaintext:
        return jsonify({"error": "plaintext is required"}), 400
    result = crypto_service.full_crypto_demo(
        plaintext,
        security_state.get_private_key(),
        security_state.get_public_key(),
    )
    return jsonify(result)

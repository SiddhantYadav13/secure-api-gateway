"""
security_state.py — In-memory runtime state for the gateway.

Holds things that live for the life of the process and can be tuned at runtime
from the Settings page:
  * the active RSA key pair (regenerated on "rotate keys"),
  * mutable security settings (rate limit, replay window, toggles),
  * the rate-limiter counters and replay nonce cache.

NOTE: an in-memory store is intentional and appropriate for this demo/portfolio
project. In real production you'd back these with Redis so they survive restarts
and scale across servers. The logic is identical; only the storage swaps out.
"""

import threading
import time
from collections import defaultdict, deque

from app.services import crypto_service

_lock = threading.Lock()

# --- Active RSA key pair (generated on startup) ---
_private_key, _public_key = crypto_service.generate_rsa_keypair()

# --- Runtime-tunable settings (defaults get overwritten from config at init) ---
settings = {
    "jwt_expiry_minutes": 30,
    "rate_limit_max_requests": 10,
    "rate_limit_window_seconds": 60,
    "replay_window_seconds": 120,
    "replay_protection_enabled": True,
    "risk_scoring_enabled": True,
    "max_failed_logins": 5,
}

# --- Rate limiter: username/ip -> deque of recent request timestamps ---
_rate_buckets = defaultdict(deque)

# --- Replay cache: nonce -> timestamp it was first seen ---
_seen_nonces = {}

# --- Key rotation bookkeeping for the admin/settings pages ---
key_rotated_at = time.time()


# --------------------------------------------------------------------------- #
# Keys
# --------------------------------------------------------------------------- #
def get_private_key():
    return _private_key


def get_public_key():
    return _public_key


def get_public_key_pem() -> str:
    return crypto_service.export_public_pem(_public_key)


def rotate_keys():
    """Generate a brand-new RSA key pair (used by Settings / Admin 'rotate keys')."""
    global _private_key, _public_key, key_rotated_at
    with _lock:
        _private_key, _public_key = crypto_service.generate_rsa_keypair()
        key_rotated_at = time.time()
    return get_public_key_pem()


# --------------------------------------------------------------------------- #
# Settings
# --------------------------------------------------------------------------- #
def init_settings_from_config(config: dict):
    settings["jwt_expiry_minutes"] = config.get(
        "JWT_EXPIRY_MINUTES", settings["jwt_expiry_minutes"]
    )
    settings["rate_limit_max_requests"] = config.get(
        "RATE_LIMIT_MAX_REQUESTS", settings["rate_limit_max_requests"]
    )
    settings["rate_limit_window_seconds"] = config.get(
        "RATE_LIMIT_WINDOW_SECONDS", settings["rate_limit_window_seconds"]
    )
    settings["replay_window_seconds"] = config.get(
        "REPLAY_WINDOW_SECONDS", settings["replay_window_seconds"]
    )
    settings["max_failed_logins"] = config.get(
        "MAX_FAILED_LOGINS", settings["max_failed_logins"]
    )


def update_settings(new_values: dict):
    with _lock:
        for key, value in new_values.items():
            if key in settings:
                settings[key] = value
    return dict(settings)


# --------------------------------------------------------------------------- #
# Rate limiting (sliding window)
# --------------------------------------------------------------------------- #
def check_rate_limit(identity: str) -> bool:
    """
    Return True if the caller is WITHIN the limit, False if they exceeded it.
    Uses a sliding window: we keep timestamps of recent requests and drop old ones.
    """
    now = time.time()
    window = settings["rate_limit_window_seconds"]
    max_req = settings["rate_limit_max_requests"]

    with _lock:
        bucket = _rate_buckets[identity]
        # drop timestamps older than the window
        while bucket and bucket[0] <= now - window:
            bucket.popleft()
        bucket.append(now)
        return len(bucket) <= max_req


# --------------------------------------------------------------------------- #
# Replay detection (nonce + timestamp freshness)
# --------------------------------------------------------------------------- #
def check_replay(nonce: str, timestamp: float) -> dict:
    """
    Return {"ok": bool, "reason": str}.
    A request is a replay if:
      * its nonce was seen before, OR
      * its timestamp is outside the freshness window (too old / future).
    """
    if not settings["replay_protection_enabled"]:
        return {"ok": True, "reason": "replay protection disabled"}

    now = time.time()
    window = settings["replay_window_seconds"]

    with _lock:
        # prune expired nonces so the cache doesn't grow forever
        expired = [n for n, t in _seen_nonces.items() if t <= now - window]
        for n in expired:
            _seen_nonces.pop(n, None)

        if timestamp is not None and abs(now - float(timestamp)) > window:
            return {"ok": False, "reason": "stale timestamp (outside replay window)"}

        if nonce in _seen_nonces:
            return {"ok": False, "reason": "nonce already used (replay detected)"}

        if nonce:
            _seen_nonces[nonce] = now
        return {"ok": True, "reason": "fresh request"}

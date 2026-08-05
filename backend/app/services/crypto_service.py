"""
crypto_service.py — The cryptography engine.

Implements the four crypto primitives the gateway advertises:
  * AES-256      — fast symmetric encryption of the actual payload.
  * RSA-2048     — asymmetric encryption used to protect (wrap) the AES key,
                   plus digital signatures.
  * SHA-256      — integrity hashing (detects tampering).
  * Digital sig  — RSA-PSS signature proving a response came from the gateway.

Design note (hybrid encryption): AES is fast but both sides need the same key;
RSA is slow but solves key exchange. So we encrypt DATA with AES, then encrypt
the AES KEY with RSA. This is exactly how TLS/HTTPS works under the hood.
"""

import base64

from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Signature import pss


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _b64(raw: bytes) -> str:
    return base64.b64encode(raw).decode("utf-8")


def _unb64(text: str) -> bytes:
    return base64.b64decode(text.encode("utf-8"))


# --------------------------------------------------------------------------- #
# RSA key management
# --------------------------------------------------------------------------- #
def generate_rsa_keypair():
    """Generate a fresh RSA-2048 key pair. Returns (private_key, public_key)."""
    key = RSA.generate(2048)
    return key, key.publickey()


def export_public_pem(public_key) -> str:
    return public_key.export_key().decode("utf-8")


# --------------------------------------------------------------------------- #
# SHA-256 integrity
# --------------------------------------------------------------------------- #
def sha256_hash(data: str) -> str:
    """Return the hex SHA-256 digest of a string. Any change flips the hash."""
    return SHA256.new(data.encode("utf-8")).hexdigest()


# --------------------------------------------------------------------------- #
# AES-256 (GCM mode: gives us both encryption AND an integrity tag)
# --------------------------------------------------------------------------- #
def aes_encrypt(plaintext: str, key: bytes) -> dict:
    """Encrypt plaintext with AES-256-GCM. Returns base64 parts."""
    nonce = get_random_bytes(12)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode("utf-8"))
    return {
        "nonce": _b64(nonce),
        "ciphertext": _b64(ciphertext),
        "tag": _b64(tag),
    }


def aes_decrypt(nonce: str, ciphertext: str, tag: str, key: bytes) -> str:
    """Decrypt AES-256-GCM. Raises ValueError if the tag doesn't verify."""
    cipher = AES.new(key, AES.MODE_GCM, nonce=_unb64(nonce))
    plaintext = cipher.decrypt_and_verify(_unb64(ciphertext), _unb64(tag))
    return plaintext.decode("utf-8")


# --------------------------------------------------------------------------- #
# RSA key wrapping (encrypt the AES key with the RSA public key)
# --------------------------------------------------------------------------- #
def rsa_wrap_key(aes_key: bytes, public_key) -> str:
    cipher = PKCS1_OAEP.new(public_key)
    return _b64(cipher.encrypt(aes_key))


def rsa_unwrap_key(wrapped_key_b64: str, private_key) -> bytes:
    cipher = PKCS1_OAEP.new(private_key)
    return cipher.decrypt(_unb64(wrapped_key_b64))


# --------------------------------------------------------------------------- #
# Digital signatures (RSA-PSS over a SHA-256 digest)
# --------------------------------------------------------------------------- #
def sign_data(data: str, private_key) -> str:
    h = SHA256.new(data.encode("utf-8"))
    signature = pss.new(private_key).sign(h)
    return _b64(signature)


def verify_signature(data: str, signature_b64: str, public_key) -> bool:
    h = SHA256.new(data.encode("utf-8"))
    try:
        pss.new(public_key).verify(h, _unb64(signature_b64))
        return True
    except (ValueError, TypeError):
        return False


# --------------------------------------------------------------------------- #
# Full demo pipeline for the Encryption Visualizer page
# --------------------------------------------------------------------------- #
def full_crypto_demo(plaintext: str, private_key, public_key) -> dict:
    """
    Run the entire hybrid-encryption pipeline on some plaintext and return every
    intermediate value so the frontend can visualize each step end-to-end.
    """
    # 1. Generate a random one-time AES-256 key (32 bytes).
    aes_key = get_random_bytes(32)

    # 2. Encrypt the plaintext with AES.
    enc = aes_encrypt(plaintext, aes_key)

    # 3. Wrap (encrypt) the AES key using RSA — this is the "key exchange".
    wrapped_key = rsa_wrap_key(aes_key, public_key)

    # 4. Hash the plaintext for integrity.
    digest = sha256_hash(plaintext)

    # 5. Digitally sign the ciphertext so the receiver can verify origin.
    signature = sign_data(enc["ciphertext"], private_key)

    # 6. Prove the round-trip works: unwrap the key and decrypt.
    recovered_key = rsa_unwrap_key(wrapped_key, private_key)
    decrypted = aes_decrypt(enc["nonce"], enc["ciphertext"], enc["tag"], recovered_key)

    # 7. Verify the signature and hash on the "receiving" side.
    signature_valid = verify_signature(enc["ciphertext"], signature, public_key)
    hash_valid = sha256_hash(decrypted) == digest

    return {
        "plaintext": plaintext,
        "aes_key": _b64(aes_key),
        "nonce": enc["nonce"],
        "ciphertext": enc["ciphertext"],
        "auth_tag": enc["tag"],
        "wrapped_key": wrapped_key,
        "sha256": digest,
        "signature": signature,
        "decrypted": decrypted,
        "signature_valid": signature_valid,
        "hash_valid": hash_valid,
    }

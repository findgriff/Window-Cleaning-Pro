"""Magic-link auth: email a one-time login link, exchange for a bearer session.

No passwords anywhere. Sessions are opaque random tokens with a 30-day
expiry, sent by the SPA as `Authorization: Bearer <token>`.
"""
from __future__ import annotations
import json
import logging
import re
import secrets
import time
import urllib.request

from server import db as db_module

log = logging.getLogger(__name__)

MAGIC_TTL = 15 * 60            # login links live 15 minutes
SESSION_TTL = 30 * 24 * 3600   # sessions live 30 days

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Cloudflare in front of api.resend.com rejects Python-urllib's default
# UA (error 1010) — same fix as the chesterwc backend.
USER_AGENT = "rinserun-backend/1.0"


def valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email or ""))


def send_magic_link(*, resend_key: str, from_addr: str, to_addr: str,
                    link: str, business: str) -> None:
    payload = json.dumps({
        "from": from_addr, "to": [to_addr],
        "subject": f"Your {business} sign-in link",
        "text": (f"Tap to sign in to {business}:\n\n{link}\n\n"
                 "The link works once and expires in 15 minutes. "
                 "If you didn't request it, ignore this email."),
    }).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails", data=payload, method="POST",
        headers={"Authorization": f"Bearer {resend_key}",
                 "Content-Type": "application/json",
                 "User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=10):
        pass


def issue_magic_token(conn, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    db_module.insert(conn, "magic_tokens", {
        "token": token, "user_id": user_id,
        "expires_at": int(time.time()) + MAGIC_TTL,
    })
    return token


def redeem_magic_token(conn, token: str) -> str | None:
    """Exchange a one-time token for a session token, or None."""
    row = db_module.one(conn,
        "SELECT * FROM magic_tokens WHERE token = ? AND used = 0 "
        "AND expires_at > strftime('%s','now')", (token,))
    if not row:
        return None
    conn.execute("UPDATE magic_tokens SET used = 1 WHERE token = ?", (token,))
    session = secrets.token_urlsafe(32)
    db_module.insert(conn, "sessions", {
        "token": session, "user_id": row["user_id"],
        "expires_at": int(time.time()) + SESSION_TTL,
    })
    return session


def user_for_session(conn, bearer: str) -> dict | None:
    """Returns {user fields..., tenant_id} or None."""
    if not bearer:
        return None
    return db_module.one(conn,
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token = ? AND s.expires_at > strftime('%s','now')", (bearer,))

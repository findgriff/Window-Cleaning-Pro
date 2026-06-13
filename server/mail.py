"""Outbound email via Resend (no SDK; urllib only).

Cloudflare in front of api.resend.com rejects Python-urllib's default
UA with error 1010, so a real User-Agent is required.
"""
from __future__ import annotations
import json
import urllib.request

USER_AGENT = "rinserun-backend/1.0"


def send(*, resend_key: str, from_addr: str, to: str, subject: str,
         text: str, reply_to: str | None = None) -> None:
    body = {"from": from_addr, "to": [to], "subject": subject, "text": text}
    if reply_to:
        body["reply_to"] = reply_to
    req = urllib.request.Request(
        "https://api.resend.com/emails", data=json.dumps(body).encode(),
        method="POST",
        headers={"Authorization": f"Bearer {resend_key}",
                 "Content-Type": "application/json", "User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=10):
        pass

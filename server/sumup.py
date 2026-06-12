"""SumUp integration — per-tenant API keys.

Two flows:
  1. Online payment: create a hosted checkout for an invoice; customer
     pays on SumUp's page; sync marks the invoice paid.
  2. Reader reconciliation: pull recent transactions and match them to
     invoices by checkout reference (online) — reader payments are
     recorded manually as method=sumup_reader in v1.

Docs: https://developer.sumup.com/api  (Bearer auth with sk_live_*/sk_test_*)
"""
from __future__ import annotations
import json
import logging
import urllib.error
import urllib.request

log = logging.getLogger(__name__)

API = "https://api.sumup.com"
USER_AGENT = "rinserun-backend/1.0"


class SumUpError(RuntimeError):
    pass


def _request(method: str, path: str, *, api_key: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        API + path, data=data, method=method,
        headers={"Authorization": f"Bearer {api_key}",
                 "Content-Type": "application/json",
                 "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:300]
        raise SumUpError(f"sumup HTTP {e.code}: {detail}") from e


def merchant_profile(api_key: str) -> dict:
    """Validates a key and returns the merchant profile (incl. merchant_code)."""
    return _request("GET", "/v0.1/me", api_key=api_key)


def create_hosted_checkout(*, api_key: str, merchant_code: str,
                           amount_pence: int, currency: str,
                           reference: str, description: str,
                           redirect_url: str | None = None) -> dict:
    """Returns the checkout object; hosted_checkout_url is the pay link."""
    body = {
        "checkout_reference": reference,
        "amount": round(amount_pence / 100, 2),
        "currency": currency,
        "merchant_code": merchant_code,
        "description": description,
        "hosted_checkout": {"enabled": True},
    }
    if redirect_url:
        body["redirect_url"] = redirect_url
    return _request("POST", "/v0.1/checkouts", api_key=api_key, body=body)


def checkout_status(*, api_key: str, checkout_id: str) -> dict:
    return _request("GET", f"/v0.1/checkouts/{checkout_id}", api_key=api_key)


def sync_paid_checkouts(conn, *, tenant: dict) -> list[str]:
    """Mark invoices paid whose SumUp checkout has status PAID.

    Returns the invoice numbers that flipped to paid.
    """
    api_key = tenant.get("sumup_api_key")
    if not api_key:
        return []
    flipped = []
    rows = conn.execute(
        "SELECT id, number, sumup_checkout_id FROM invoices "
        "WHERE tenant_id = ? AND status = 'unpaid' "
        "AND sumup_checkout_id IS NOT NULL", (tenant["id"],)).fetchall()
    for row in rows:
        try:
            ck = checkout_status(api_key=api_key,
                                 checkout_id=row["sumup_checkout_id"])
        except SumUpError as e:
            log.warning("sumup status failed for %s: %s", row["number"], e)
            continue
        if ck.get("status") == "PAID":
            conn.execute(
                "UPDATE invoices SET status='paid', method='sumup_online', "
                "paid_at=strftime('%s','now') WHERE id = ?", (row["id"],))
            flipped.append(row["number"])
    conn.commit()
    return flipped

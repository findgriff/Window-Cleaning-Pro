"""RinseRun API — single-file stdlib HTTP server on 127.0.0.1:8099.

JSON API for the Window Cleaning Pro SPA. Multi-tenant: every handler
resolves the user from the bearer token and scopes queries by
tenant_id. Static files are served by Caddy, not here.

Run: python3 -m server.app   (from the repo root)
"""
from __future__ import annotations
import datetime as dt
import json
import logging
import os
import re
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from server import auth, db as db_module, sumup

DB_PATH = os.environ.get("RINSERUN_DB", "/var/lib/rinserun/app.db")
LISTEN_HOST = os.environ.get("RINSERUN_HOST", "127.0.0.1")
LISTEN_PORT = int(os.environ.get("RINSERUN_PORT", "8099"))
RESEND_KEY_PATH = os.environ.get("RINSERUN_RESEND_KEY_PATH", "/etc/rinserun/resend-api-key")
FROM_ADDR = os.environ.get("RINSERUN_FROM", "RinseRun <hello@mail.opspocket.com>")
BASE_URL = os.environ.get("RINSERUN_BASE_URL", "https://rinserun.dev.opspocket.com")

log = logging.getLogger("rinserun")

_conn: sqlite3.Connection | None = None


def get_db() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = db_module.connect(DB_PATH)
    return _conn


def _read_secret(path: str) -> str:
    try:
        return Path(path).read_text().strip()
    except FileNotFoundError:
        return ""


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "business"


# ---------------------------------------------------------------- request --

class Request:
    def __init__(self, handler: BaseHTTPRequestHandler, method: str):
        self.method = method
        split = urlsplit(handler.path)
        self.path = split.path
        self.query = {k: v[0] for k, v in parse_qs(split.query).items()}
        self.headers = handler.headers
        self.ip = handler.client_address[0]
        length = int(handler.headers.get("Content-Length") or 0)
        raw = handler.rfile.read(length) if length else b""
        try:
            self.body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            self.body = {}
        bearer = (handler.headers.get("Authorization") or "")
        self.token = bearer.removeprefix("Bearer ").strip()

    def user(self):
        return auth.user_for_session(get_db(), self.token)


def _require(req: Request):
    user = req.user()
    if not user:
        raise PermissionError("auth required")
    return user


def _tenant(user) -> dict:
    return db_module.one(get_db(), "SELECT * FROM tenants WHERE id = ?",
                         (user["tenant_id"],))


# ------------------------------------------------------------------- auth --

def h_signup(req: Request):
    business = (req.body.get("business") or "").strip()
    name = (req.body.get("name") or "").strip()
    email = (req.body.get("email") or "").strip().lower()
    if not business or not name or not auth.valid_email(email):
        return 400, {"error": "business, name and a valid email are required"}
    conn = get_db()
    if db_module.one(conn, "SELECT id FROM users WHERE email = ?", (email,)):
        return 409, {"error": "email already registered — use sign in"}
    slug = _slugify(business)
    if db_module.one(conn, "SELECT id FROM tenants WHERE slug = ?", (slug,)):
        slug = f"{slug}-{int(dt.datetime.now().timestamp()) % 10000}"
    tenant_id = db_module.insert(conn, "tenants",
                                 {"name": business, "slug": slug, "email": email})
    user_id = db_module.insert(conn, "users",
                               {"tenant_id": tenant_id, "email": email, "name": name})
    return _email_link(conn, user_id, email, business)


def h_login(req: Request):
    email = (req.body.get("email") or "").strip().lower()
    conn = get_db()
    user = db_module.one(conn, "SELECT * FROM users WHERE email = ?", (email,))
    if not user:
        # Same response either way — don't leak which emails exist.
        return 200, {"ok": True, "message": "If that account exists, a sign-in link is on its way."}
    tenant = db_module.one(conn, "SELECT name FROM tenants WHERE id = ?",
                           (user["tenant_id"],))
    return _email_link(conn, user["id"], email, tenant["name"])


def _email_link(conn, user_id: int, email: str, business: str):
    token = auth.issue_magic_token(conn, user_id)
    link = f"{BASE_URL}/#/auth/{token}"
    resend_key = _read_secret(RESEND_KEY_PATH)
    if resend_key:
        try:
            auth.send_magic_link(resend_key=resend_key, from_addr=FROM_ADDR,
                                 to_addr=email, link=link, business=business)
        except Exception:
            log.exception("magic link email failed")
            return 502, {"error": "couldn't send the sign-in email — try again"}
    else:
        log.warning("RESEND key missing; magic link for %s: %s", email, link)
    return 200, {"ok": True, "message": "If that account exists, a sign-in link is on its way."}


def h_verify(req: Request):
    session = auth.redeem_magic_token(get_db(), req.body.get("token") or "")
    if not session:
        return 401, {"error": "link expired or already used — request a new one"}
    user = auth.user_for_session(get_db(), session)
    tenant = _tenant(user)
    return 200, {"session": session,
                 "user": {"name": user["name"], "email": user["email"]},
                 "tenant": {"name": tenant["name"], "currency": tenant["currency"],
                            "sumup_connected": bool(tenant["sumup_api_key"])}}


def h_me(req: Request):
    user = _require(req)
    tenant = _tenant(user)
    return 200, {"user": {"name": user["name"], "email": user["email"]},
                 "tenant": {"name": tenant["name"], "currency": tenant["currency"],
                            "sumup_connected": bool(tenant["sumup_api_key"])}}


# -------------------------------------------------------------------- crm --

def h_customers(req: Request):
    user = _require(req)
    if req.method == "GET":
        return 200, {"customers": db_module.rows(get_db(),
            "SELECT * FROM customers WHERE tenant_id = ? AND archived = 0 "
            "ORDER BY name", (user["tenant_id"],))}
    name = (req.body.get("name") or "").strip()
    if not name:
        return 400, {"error": "name required"}
    cid = db_module.insert(get_db(), "customers", {
        "tenant_id": user["tenant_id"], "name": name,
        "email": req.body.get("email"), "phone": req.body.get("phone"),
        "notes": req.body.get("notes"),
        "tags": json.dumps(req.body.get("tags") or []),
    })
    return 201, {"id": cid}


def h_customer_update(req: Request, cid: int):
    user = _require(req)
    allowed = {k: v for k, v in req.body.items()
               if k in {"name", "email", "phone", "notes", "archived"}}
    if "tags" in req.body:
        allowed["tags"] = json.dumps(req.body["tags"])
    if not allowed:
        return 400, {"error": "nothing to update"}
    db_module.update(get_db(), "customers", cid, user["tenant_id"], allowed)
    return 200, {"ok": True}


def h_rounds(req: Request):
    user = _require(req)
    if req.method == "GET":
        return 200, {"rounds": db_module.rows(get_db(),
            "SELECT * FROM rounds WHERE tenant_id = ? ORDER BY position, name",
            (user["tenant_id"],))}
    name = (req.body.get("name") or "").strip()
    if not name:
        return 400, {"error": "name required"}
    rid = db_module.insert(get_db(), "rounds", {
        "tenant_id": user["tenant_id"], "name": name,
        "position": int(req.body.get("position") or 0),
        "notes": req.body.get("notes"),
    })
    return 201, {"id": rid}


def h_properties(req: Request):
    user = _require(req)
    if req.method == "GET":
        return 200, {"properties": db_module.rows(get_db(),
            "SELECT p.*, c.name AS customer_name FROM properties p "
            "JOIN customers c ON c.id = p.customer_id "
            "WHERE p.tenant_id = ? AND p.active = 1 "
            "ORDER BY p.round_id, p.position", (user["tenant_id"],))}
    required = {"customer_id", "address", "price_pence"}
    if not required.issubset(req.body):
        return 400, {"error": "customer_id, address and price_pence are required"}
    owner = db_module.one(get_db(),
        "SELECT id FROM customers WHERE id = ? AND tenant_id = ?",
        (req.body["customer_id"], user["tenant_id"]))
    if not owner:
        return 404, {"error": "customer not found"}
    pid = db_module.insert(get_db(), "properties", {
        "tenant_id": user["tenant_id"],
        "customer_id": req.body["customer_id"],
        "round_id": req.body.get("round_id"),
        "address": req.body["address"],
        "postcode": req.body.get("postcode"),
        "price_pence": int(req.body["price_pence"]),
        "frequency_weeks": int(req.body.get("frequency_weeks") or 6),
        "position": int(req.body.get("position") or 0),
        "access_notes": req.body.get("access_notes"),
    })
    return 201, {"id": pid}


def h_property_update(req: Request, pid: int):
    user = _require(req)
    allowed = {k: v for k, v in req.body.items()
               if k in {"round_id", "address", "postcode", "price_pence",
                        "frequency_weeks", "position", "access_notes", "active"}}
    if not allowed:
        return 400, {"error": "nothing to update"}
    db_module.update(get_db(), "properties", pid, user["tenant_id"], allowed)
    return 200, {"ok": True}


# ------------------------------------------------------------------- jobs --

def h_jobs(req: Request):
    user = _require(req)
    date = req.query.get("date") or dt.date.today().isoformat()
    return 200, {"jobs": db_module.rows(get_db(),
        "SELECT j.*, p.address, p.postcode, p.access_notes, p.round_id, "
        "c.name AS customer_name, c.phone AS customer_phone "
        "FROM jobs j JOIN properties p ON p.id = j.property_id "
        "JOIN customers c ON c.id = p.customer_id "
        "WHERE j.tenant_id = ? AND j.scheduled_date = ? "
        "ORDER BY p.round_id, p.position", (user["tenant_id"], date))}


def h_jobs_generate(req: Request):
    """Materialize due jobs for a date: a property is due when its last
    completed job is at least frequency_weeks old (or it has none) and
    it has no open scheduled job."""
    user = _require(req)
    date_s = req.body.get("date") or dt.date.today().isoformat()
    date = dt.date.fromisoformat(date_s)
    conn = get_db()
    created = 0
    for p in db_module.rows(conn,
            "SELECT * FROM properties WHERE tenant_id = ? AND active = 1 "
            "AND frequency_weeks > 0", (user["tenant_id"],)):
        open_job = db_module.one(conn,
            "SELECT id FROM jobs WHERE property_id = ? AND status = 'scheduled'",
            (p["id"],))
        if open_job:
            continue
        last = db_module.one(conn,
            "SELECT MAX(scheduled_date) AS d FROM jobs "
            "WHERE property_id = ? AND status = 'done'", (p["id"],))
        if last and last["d"]:
            due = dt.date.fromisoformat(last["d"]) + dt.timedelta(weeks=p["frequency_weeks"])
            if due > date:
                continue
        db_module.insert(conn, "jobs", {
            "tenant_id": user["tenant_id"], "property_id": p["id"],
            "scheduled_date": date_s, "price_pence": p["price_pence"],
        })
        created += 1
    return 200, {"created": created, "date": date_s}


def h_job_complete(req: Request, jid: int):
    user = _require(req)
    conn = get_db()
    job = db_module.one(conn,
        "SELECT j.*, p.customer_id FROM jobs j "
        "JOIN properties p ON p.id = j.property_id "
        "WHERE j.id = ? AND j.tenant_id = ?", (jid, user["tenant_id"]))
    if not job:
        return 404, {"error": "job not found"}
    if job["status"] == "done":
        return 409, {"error": "already completed"}
    price = int(req.body.get("price_pence") or job["price_pence"])
    conn.execute("UPDATE jobs SET status='done', price_pence=?, notes=?, "
                 "completed_at=strftime('%s','now') WHERE id = ?",
                 (price, req.body.get("notes"), jid))
    seq = db_module.one(conn,
        "SELECT COUNT(*) AS n FROM invoices WHERE tenant_id = ?",
        (user["tenant_id"],))["n"] + 1
    number = f"INV-{dt.date.today().year}-{seq:04d}"
    inv_id = db_module.insert(conn, "invoices", {
        "tenant_id": user["tenant_id"], "customer_id": job["customer_id"],
        "job_id": jid, "number": number, "amount_pence": price,
    })
    return 200, {"ok": True, "invoice_id": inv_id, "invoice_number": number}


def h_job_skip(req: Request, jid: int):
    user = _require(req)
    get_db().execute(
        "UPDATE jobs SET status='skipped', notes=? "
        "WHERE id = ? AND tenant_id = ? AND status = 'scheduled'",
        (req.body.get("notes"), jid, user["tenant_id"]))
    get_db().commit()
    return 200, {"ok": True}


def h_tonight_texts(req: Request):
    """Customers with phone numbers scheduled for the given date —
    the operator's 'text the night before' list."""
    user = _require(req)
    date = req.query.get("date") or (dt.date.today() + dt.timedelta(days=1)).isoformat()
    return 200, {"date": date, "texts": db_module.rows(get_db(),
        "SELECT c.name, c.phone, p.address FROM jobs j "
        "JOIN properties p ON p.id = j.property_id "
        "JOIN customers c ON c.id = p.customer_id "
        "WHERE j.tenant_id = ? AND j.scheduled_date = ? AND j.status='scheduled' "
        "AND c.phone IS NOT NULL AND c.phone != '' "
        "ORDER BY p.round_id, p.position", (user["tenant_id"], date))}


# --------------------------------------------------------------- invoices --

def h_invoices(req: Request):
    user = _require(req)
    status = req.query.get("status")
    sql = ("SELECT i.*, c.name AS customer_name FROM invoices i "
           "JOIN customers c ON c.id = i.customer_id WHERE i.tenant_id = ?")
    args: list = [user["tenant_id"]]
    if status:
        sql += " AND i.status = ?"
        args.append(status)
    return 200, {"invoices": db_module.rows(get_db(),
                 sql + " ORDER BY i.issued_at DESC LIMIT 500", tuple(args))}


def h_invoice_mark_paid(req: Request, iid: int):
    user = _require(req)
    method = req.body.get("method") or "transfer"
    if method not in {"cash", "transfer", "sumup_reader", "sumup_online"}:
        return 400, {"error": "unknown method"}
    get_db().execute(
        "UPDATE invoices SET status='paid', method=?, paid_at=strftime('%s','now') "
        "WHERE id = ? AND tenant_id = ? AND status = 'unpaid'",
        (method, iid, user["tenant_id"]))
    get_db().commit()
    return 200, {"ok": True}


def h_invoice_checkout(req: Request, iid: int):
    """Create a SumUp hosted checkout for an unpaid invoice."""
    user = _require(req)
    tenant = _tenant(user)
    if not tenant["sumup_api_key"]:
        return 409, {"error": "connect SumUp in Settings first"}
    inv = db_module.one(get_db(),
        "SELECT * FROM invoices WHERE id = ? AND tenant_id = ?",
        (iid, user["tenant_id"]))
    if not inv:
        return 404, {"error": "invoice not found"}
    if inv["status"] != "unpaid":
        return 409, {"error": f"invoice is {inv['status']}"}
    if inv["sumup_checkout_url"]:
        return 200, {"url": inv["sumup_checkout_url"]}
    try:
        ck = sumup.create_hosted_checkout(
            api_key=tenant["sumup_api_key"],
            merchant_code=tenant["sumup_merchant_code"],
            amount_pence=inv["amount_pence"], currency=tenant["currency"],
            reference=f"{tenant['slug']}-{inv['number']}",
            description=f"{tenant['name']} — {inv['number']}")
    except sumup.SumUpError as e:
        log.warning("checkout failed: %s", e)
        return 502, {"error": "SumUp rejected the checkout — check your key in Settings"}
    url = ck.get("hosted_checkout_url") or ""
    db_module.update(get_db(), "invoices", iid, user["tenant_id"],
                     {"sumup_checkout_id": ck.get("id"), "sumup_checkout_url": url})
    return 200, {"url": url}


def h_sumup_sync(req: Request):
    user = _require(req)
    flipped = sumup.sync_paid_checkouts(get_db(), tenant=_tenant(user))
    return 200, {"paid": flipped}


def h_sumup_connect(req: Request):
    """Validate and store the tenant's SumUp API key."""
    user = _require(req)
    key = (req.body.get("api_key") or "").strip()
    if not key.startswith(("sk_live_", "sk_test_", "sup_sk_")):
        return 400, {"error": "that doesn't look like a SumUp secret key"}
    try:
        profile = sumup.merchant_profile(key)
    except sumup.SumUpError:
        return 401, {"error": "SumUp rejected that key"}
    code = (profile.get("merchant_profile") or {}).get("merchant_code") or ""
    conn = get_db()
    conn.execute("UPDATE tenants SET sumup_api_key=?, sumup_merchant_code=? WHERE id=?",
                 (key, code, user["tenant_id"]))
    conn.commit()
    return 200, {"ok": True, "merchant_code": code}


# -------------------------------------------------------------- dashboard --

def h_dashboard(req: Request):
    user = _require(req)
    conn, t = get_db(), user["tenant_id"]
    today = dt.date.today().isoformat()
    return 200, {
        "today": db_module.one(conn,
            "SELECT COUNT(*) AS total, "
            "SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done "
            "FROM jobs WHERE tenant_id = ? AND scheduled_date = ?", (t, today)),
        "unpaid": db_module.one(conn,
            "SELECT COUNT(*) AS count, COALESCE(SUM(amount_pence),0) AS total_pence "
            "FROM invoices WHERE tenant_id = ? AND status = 'unpaid'", (t,)),
        "customers": db_module.one(conn,
            "SELECT COUNT(*) AS count FROM customers "
            "WHERE tenant_id = ? AND archived = 0", (t,)),
        "revenue_30d": db_module.one(conn,
            "SELECT COALESCE(SUM(amount_pence),0) AS total_pence FROM invoices "
            "WHERE tenant_id = ? AND status='paid' "
            "AND paid_at > strftime('%s','now','-30 days')", (t,)),
    }


# ---------------------------------------------------------------- routing --

ROUTES = [
    ("POST", re.compile(r"^/api/auth/signup$"), h_signup),
    ("POST", re.compile(r"^/api/auth/login$"), h_login),
    ("POST", re.compile(r"^/api/auth/verify$"), h_verify),
    ("GET",  re.compile(r"^/api/me$"), h_me),
    ("GET",  re.compile(r"^/api/customers$"), h_customers),
    ("POST", re.compile(r"^/api/customers$"), h_customers),
    ("PATCH", re.compile(r"^/api/customers/(\d+)$"), h_customer_update),
    ("GET",  re.compile(r"^/api/rounds$"), h_rounds),
    ("POST", re.compile(r"^/api/rounds$"), h_rounds),
    ("GET",  re.compile(r"^/api/properties$"), h_properties),
    ("POST", re.compile(r"^/api/properties$"), h_properties),
    ("PATCH", re.compile(r"^/api/properties/(\d+)$"), h_property_update),
    ("GET",  re.compile(r"^/api/jobs$"), h_jobs),
    ("POST", re.compile(r"^/api/jobs/generate$"), h_jobs_generate),
    ("POST", re.compile(r"^/api/jobs/(\d+)/complete$"), h_job_complete),
    ("POST", re.compile(r"^/api/jobs/(\d+)/skip$"), h_job_skip),
    ("GET",  re.compile(r"^/api/jobs/tonight-texts$"), h_tonight_texts),
    ("GET",  re.compile(r"^/api/invoices$"), h_invoices),
    ("POST", re.compile(r"^/api/invoices/(\d+)/mark-paid$"), h_invoice_mark_paid),
    ("POST", re.compile(r"^/api/invoices/(\d+)/checkout$"), h_invoice_checkout),
    ("POST", re.compile(r"^/api/sumup/sync$"), h_sumup_sync),
    ("POST", re.compile(r"^/api/sumup/connect$"), h_sumup_connect),
    ("GET",  re.compile(r"^/api/dashboard$"), h_dashboard),
]


class Handler(BaseHTTPRequestHandler):
    server_version = "rinserun"

    def _dispatch(self, method: str):
        req = Request(self, method)
        if req.path == "/healthz":
            return self._json(200, {"ok": True})
        for m, pattern, fn in ROUTES:
            if m != method:
                continue
            match = pattern.match(req.path)
            if match:
                try:
                    status, body = fn(req, *(int(g) for g in match.groups()))
                except PermissionError:
                    return self._json(401, {"error": "sign in required"})
                except Exception:
                    log.exception("handler error %s %s", method, req.path)
                    return self._json(500, {"error": "internal error"})
                return self._json(status, body)
        return self._json(404, {"error": "not found"})

    def _json(self, status: int, body: dict):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):  self._dispatch("GET")
    def do_POST(self): self._dispatch("POST")
    def do_PATCH(self): self._dispatch("PATCH")

    def log_message(self, fmt, *args):
        log.info("%s - %s", self.client_address[0], fmt % args)


def main():
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s %(levelname)s %(message)s")
    get_db()
    log.info("rinserun api on %s:%s db=%s", LISTEN_HOST, LISTEN_PORT, DB_PATH)
    ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()

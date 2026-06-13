"""UK address + geocoding lookup, proxied server-side.

Two data sources, both fronted by one endpoint so the SPA never sees a
key:

  - getAddress.io  (platform key) — returns the full house-by-house
    address list for a postcode. Powers the "pick your address" dropdown.
    Needs a key; if absent, the dropdown is simply empty.
  - postcodes.io   (free, no key) — returns lat/lng for a postcode.
    Always available, so the map pin works with zero configuration.

The platform holds ONE getAddress.io key for every tenant — address
lookup is a shared utility, not per-business billing.
"""
from __future__ import annotations
import json
import logging
import re
import urllib.error
import urllib.parse
import urllib.request

log = logging.getLogger(__name__)

USER_AGENT = "rinserun-backend/1.0"
POSTCODE_RE = re.compile(r"^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$", re.IGNORECASE)


def valid_postcode(pc: str) -> bool:
    return bool(POSTCODE_RE.match((pc or "").strip()))


def _get_json(url: str) -> dict | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        log.warning("address upstream HTTP %s for %s", e.code, url.split("?")[0])
        return None
    except Exception as e:
        log.warning("address upstream error: %s", e)
        return None


def postcode_coords(postcode: str) -> tuple[float, float] | None:
    """Free postcode -> (lat, lng) via postcodes.io. None if unknown."""
    pc = urllib.parse.quote((postcode or "").strip())
    data = _get_json(f"https://api.postcodes.io/postcodes/{pc}")
    res = (data or {}).get("result") or {}
    if res.get("latitude") is not None and res.get("longitude") is not None:
        return float(res["latitude"]), float(res["longitude"])
    return None


def getaddress_list(postcode: str, *, api_key: str) -> tuple[list[dict], tuple | None]:
    """Return (addresses, coords) for a postcode via getAddress.io.

    Each address is {formatted, line_1, line_2, town, county}. coords is
    (lat, lng) or None. Returns ([], None) on any failure so the caller
    can fall back to postcodes.io.
    """
    pc = urllib.parse.quote((postcode or "").strip())
    url = (f"https://api.getaddress.io/find/{pc}"
           f"?api-key={urllib.parse.quote(api_key)}&expand=true&sort=true")
    data = _get_json(url)
    if not data:
        return [], None
    coords = None
    if data.get("latitude") is not None and data.get("longitude") is not None:
        coords = (float(data["latitude"]), float(data["longitude"]))
    out = []
    for a in data.get("addresses", []) or []:
        if isinstance(a, str):
            # non-expanded fallback: a comma-joined string
            parts = [p.strip() for p in a.split(",") if p.strip()]
            out.append({"formatted": ", ".join(parts),
                        "line_1": parts[0] if parts else "",
                        "line_2": "", "town": "", "county": ""})
            continue
        line_1 = a.get("line_1") or ""
        line_2 = a.get("line_2") or ""
        town = a.get("town_or_city") or ""
        county = a.get("county") or ""
        formatted = ", ".join(p for p in (line_1, line_2, town) if p)
        out.append({"formatted": formatted, "line_1": line_1,
                    "line_2": line_2, "town": town, "county": county})
    return out, coords


def lookup(postcode: str, *, getaddress_key: str = "") -> dict:
    """Unified lookup. Always returns coords when known (postcodes.io);
    returns the address list when a getAddress.io key is configured."""
    if not valid_postcode(postcode):
        return {"valid": False, "addresses": [], "lat": None, "lng": None,
                "source": None}

    addresses: list[dict] = []
    coords = None
    if getaddress_key:
        addresses, coords = getaddress_list(postcode, api_key=getaddress_key)
    if coords is None:
        coords = postcode_coords(postcode)

    return {
        "valid": True,
        "addresses": addresses,
        "lat": coords[0] if coords else None,
        "lng": coords[1] if coords else None,
        "source": "getaddress" if addresses else ("postcodes" if coords else None),
    }

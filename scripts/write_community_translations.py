#!/usr/bin/env python3
"""
Write the en/ar/ru/fr translations of the 7 communities to the DB.

Communities became language-scoped (one row per language, translations linked by
`groupId`) - see docs/API 1.md. The 7 existing rows are Hebrew-only and have a
NULL groupId. This script, for each Hebrew community:

  1. Ensures the Hebrew row has a groupId (PUT to backfill one if NULL).
  2. Reads the group's existing members (GET .../group/:groupId).
  3. Creates any missing en/ar/ru/fr sibling rows (POST), sharing that groupId,
     copying the language-independent fields (location, meetingType, contactUrl,
     audienceIds, isActive) from the Hebrew row and using the translated
     name/description/organization from community_translations.json.

Idempotent: re-running only creates rows that don't already exist for the group.

Auth: needs an ADMIN or MODERATOR JWT. Google-only login means you must copy the
token from the deployed site's sessionStorage (key `natal_jwt` / whatever
lib/auth.js stores) after signing in as an admin.

Usage:
    export COMMUNITIES_ADMIN_TOKEN='eyJ...'          # required
    export API_BASE='https://ptsd-il-api.onrender.com/api'   # optional, this is the default
    python scripts/write_community_translations.py            # dry run (prints plan)
    python scripts/write_community_translations.py --apply    # actually write
"""

import json
import os
import sys
import uuid
import urllib.request
import urllib.error
from pathlib import Path

API_BASE = os.environ.get("API_BASE", "https://ptsd-il-api.onrender.com/api").rstrip("/")
TOKEN = os.environ.get("COMMUNITIES_ADMIN_TOKEN", "")
ORIGIN = os.environ.get("SITE_ORIGIN", "https://ptsd-il-44y7.onrender.com")
LANGS = ["en", "ar", "ru", "fr"]
APPLY = "--apply" in sys.argv

TRANSLATIONS = json.loads((Path(__file__).parent / "community_translations.json").read_text(encoding="utf-8"))


def req(method, path, body=None, auth=False):
    url = f"{API_BASE}{path}"
    headers = {"content-type": "application/json", "origin": ORIGIN}
    if auth:
        headers["authorization"] = f"Bearer {TOKEN}"
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def main():
    if APPLY and not TOKEN:
        sys.exit("COMMUNITIES_ADMIN_TOKEN is required with --apply")

    status, he_rows = req("GET", "/communities?langId=he")
    if status != 200:
        sys.exit(f"failed to list he communities: {status} {he_rows}")

    created, skipped, errors = 0, 0, 0
    for row in he_rows:
        he_id = row["id"]
        tr = TRANSLATIONS.get(he_id)
        if not tr:
            print(f"! no translations for {he_id} ({row['name']}) - skipping")
            continue

        # language-independent fields copied to every translation
        shared = {
            "location": row.get("location"),
            "meetingType": row.get("meetingType"),
            "contactUrl": row.get("contactUrl"),
            "isActive": row.get("isActive", True),
            "audienceIds": [a["id"] for a in row.get("targetAudiences", [])],
        }

        group_id = row.get("groupId")
        if not group_id:
            group_id = str(uuid.uuid4())
            print(f"\n[{row['name']}]")
            print(f"  he row has NULL groupId -> backfill {group_id}")
            if APPLY:
                st, resp = req("PUT", f"/admin/communities/{he_id}", {"groupId": group_id}, auth=True)
                if st not in (200, 201):
                    print(f"  ERROR backfilling groupId: {st} {resp}")
                    errors += 1
                    continue
        else:
            print(f"\n[{row['name']}]  groupId={group_id}")

        existing_langs = {"he"}
        if row.get("groupId") or APPLY:
            st, members = req("GET", f"/admin/communities/group/{group_id}", auth=True)
            if st == 200 and isinstance(members, list):
                existing_langs = {m["langId"] for m in members}

        for lang in LANGS:
            if lang in existing_langs:
                print(f"  {lang}: already exists - skip")
                skipped += 1
                continue
            t = tr[lang]
            payload = {
                "name": t["name"],
                "langId": lang,
                "description": t.get("description"),
                "organization": t.get("organization"),
                "groupId": group_id,
                **shared,
            }
            print(f"  {lang}: CREATE '{t['name']}'")
            if APPLY:
                st, resp = req("POST", "/admin/communities", payload, auth=True)
                if st in (200, 201):
                    created += 1
                else:
                    print(f"    ERROR: {st} {resp}")
                    errors += 1

    print(f"\n{'APPLIED' if APPLY else 'DRY RUN'} - created={created} skipped={skipped} errors={errors}")
    if not APPLY:
        print("Re-run with --apply (and COMMUNITIES_ADMIN_TOKEN set) to write.")


if __name__ == "__main__":
    main()

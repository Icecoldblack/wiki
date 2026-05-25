"""
rmp_lookup.py
-------------
Looks up every unique professor in gsu_cs_final.json on RateMyProfessors
and fills in rmp_rating, rmp_num_ratings, and rmp_link.

- Skips professors already filled in  -->  safe to re-run / resume after a crash
- Sleeps 45-90 seconds (random) between each request to stay under the radar
- Saves the JSON after every single lookup so no progress is ever lost
- Professors not found on RMP keep null in all three fields

Run:   python rmp_lookup.py
Time:  ~2 hours for ~106 professors  (1 lookup per ~67 s on average)

Requires:  pip install requests
"""

import json
import time
import random
import logging
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
# Set to True to re-attempt professors that were previously not found on RMP
RECHECK_NOT_FOUND = True
FINAL_JSON  = Path(__file__).parent / "gsu_cs_final.json"
LOG_FILE    = Path(__file__).parent / "rmp_lookup.log"
# Tracks every name that has been attempted (found OR not found).
# Lets the script resume exactly where it stopped without re-hitting RMP.
CACHE_FILE  = Path(__file__).parent / "rmp_cache.json"

# GSU's RateMyProfessors school ID is 360.
# The GraphQL API uses a base64-encoded node ID: base64("School-360")
GSU_SCHOOL_NODE_ID = "U2Nob29sLTM2MA=="

RMP_GRAPHQL = "https://www.ratemyprofessors.com/graphql"
RMP_HEADERS = {
    # Public "test" token embedded in RMP's own frontend JS
    "Authorization": "Basic dGVzdDp0ZXN0",
    "Content-Type": "application/json",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.ratemyprofessors.com/",
    "Origin": "https://www.ratemyprofessors.com",
    "Accept": "application/json",
}

# How many seconds to wait between requests (uniform random in this range)
SLEEP_MIN = 45
SLEEP_MAX = 90

# Only return the top N results from RMP search (we filter by school ourselves)
SEARCH_LIMIT = 8

# GraphQL query — asks for enough fields to identify the right person
_SEARCH_GQL = """
query TeacherSearch($query: TeacherSearchQuery!) {
  newSearch {
    teachers(query: $query, first: %(limit)d) {
      edges {
        node {
          id
          legacyId
          firstName
          lastName
          avgRating
          numRatings
          school {
            id
            name
          }
        }
      }
    }
  }
}
""" % {"limit": SEARCH_LIMIT}

# ---------------------------------------------------------------------------
# RMP GraphQL helpers
# ---------------------------------------------------------------------------

def _graphql(session: requests.Session, payload: dict) -> dict:
    """Fire a GraphQL request and return the parsed response, or {}."""
    try:
        r = session.post(RMP_GRAPHQL, json=payload, timeout=20)
        r.raise_for_status()
        return r.json()
    except (requests.RequestException, ValueError) as exc:
        logging.warning("GraphQL request failed: %s", exc)
        return {}


def _match_node(gsu_nodes: list, name: str) -> dict | None:
    """
    Try to match *name* (in 'First Last' order) against a list of GSU RMP nodes.

    Strategies (most to least specific):
      1. Exact full-name match           "Alfred Basta"  == node "Alfred Basta"
      2. Last name + first initial       last="Basta" + first[0]="A"
      3. Unambiguous last-name-only      only 1 GSU result with that last name
    """
    parts = name.strip().split()
    if not parts:
        return None
    last_name  = parts[-1]
    first_name = parts[0] if len(parts) > 1 else ""

    # Strategy 1: exact full name
    for node in gsu_nodes:
        rmp_full = f"{node.get('firstName','')} {node.get('lastName','')}".strip().lower()
        if rmp_full == name.lower():
            return node

    # Strategy 2: last name + first initial
    if first_name:
        for node in gsu_nodes:
            rmp_last  = node.get("lastName", "").lower()
            rmp_first = node.get("firstName", "")
            if (rmp_last == last_name.lower()
                    and rmp_first
                    and rmp_first[0].lower() == first_name[0].lower()):
                return node

    # Strategy 3: last name only, unambiguous
    last_matches = [n for n in gsu_nodes if n.get("lastName", "").lower() == last_name.lower()]
    if len(last_matches) == 1:
        return last_matches[0]

    return None


def search_professor(session: requests.Session, name: str) -> dict | None:
    """
    Search RMP for *name* restricted to GSU (school 360).
    Returns the best-matching professor node, or None if not found at GSU.

    Pass 1: search with name as-is ("Alfred Basta") and try to match.
    Pass 2: if pass 1 finds no match, try the name reversed ("Basta Alfred")
            — some professors are stored backwards in RMP's database.
    If neither pass matches, return None (skip, keep null).
    """
    parts = name.strip().split()
    if not parts:
        return None

    def fetch_gsu_nodes(search_text: str) -> list:
        payload = {
            "query": _SEARCH_GQL,
            "variables": {
                "query": {
                    "text": search_text,
                    "schoolID": GSU_SCHOOL_NODE_ID,
                }
            },
        }
        data = _graphql(session, payload)
        edges = (
            data
            .get("data", {})
            .get("newSearch", {})
            .get("teachers", {})
            .get("edges", [])
        )
        return [
            e["node"]
            for e in edges
            if e.get("node", {}).get("school", {}).get("id") == GSU_SCHOOL_NODE_ID
        ]

    # --- Pass 1: search "First Last", match against "First Last" ---
    gsu_nodes = fetch_gsu_nodes(name)
    if gsu_nodes:
        result = _match_node(gsu_nodes, name)
        if result:
            return result

    # --- Pass 2: reversed name "Last First" — handles professors stored
    #     backwards in RMP (e.g. firstName="Basta", lastName="Alfred") ---
    if len(parts) >= 2:
        reversed_name = " ".join(reversed(parts))   # "Alfred Basta" -> "Basta Alfred"
        # Re-use the same search results if we already have them, otherwise
        # the reversed search text may surface different results.
        result = _match_node(gsu_nodes, reversed_name)
        if result:
            logging.info("  (matched via reversed-name fallback: %s)", reversed_name)
            return result

    return None


# ---------------------------------------------------------------------------
# JSON + cache helpers
# ---------------------------------------------------------------------------

def load_json() -> dict:
    with open(FINAL_JSON, encoding="utf-8-sig") as f:
        return json.load(f)


def save_json(data: dict) -> None:
    with open(FINAL_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_cache() -> set[str]:
    """Return the set of professor names already attempted (found or not)."""
    if not CACHE_FILE.exists():
        return set()
    with open(CACHE_FILE, encoding="utf-8") as f:
        return set(json.load(f).get("checked", []))


def save_cache(checked: set[str]) -> None:
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump({"checked": sorted(checked)}, f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler(LOG_FILE, encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )
    logging.info("=== rmp_lookup starting ===")

    final   = load_json()
    checked = load_cache()   # names already attempted in a previous run

    if checked:
        logging.info("Resuming — %d professor(s) already attempted, skipping them.", len(checked))

    # ------------------------------------------------------------------
    # Collect professor names that still need a lookup.
    # Skip if EITHER:
    #   a) rmp_link is already filled  (found in a previous run)
    #   b) name is in the cache        (attempted but not found previously)
    # Map: name -> list of (course_index, prof_index) for in-place patching
    # ------------------------------------------------------------------
    name_to_locs: dict[str, list[tuple[int, int]]] = {}

    for ci, course in enumerate(final["courses"]):
        for pi, prof in enumerate(course["professors"]):
            name = prof["name"]
            if prof["rmp_link"] is not None:
                continue   # already found, skip
            if not RECHECK_NOT_FOUND and name in checked:
                continue   # skip previously attempted (normal resume mode) # already handled
            name_to_locs.setdefault(name, []).append((ci, pi))

    total = len(name_to_locs)
    if total == 0:
        logging.info("Nothing left to look up — all professors already processed.")
        return
    logging.info("Professors to look up: %d  (est. ~%d min)", total, round(total * 67 / 60))

    # Reuse one HTTP session for all requests (keeps cookies, connection pools)
    session = requests.Session()
    session.headers.update(RMP_HEADERS)

    found_count = 0
    not_found_count = 0

    for i, (name, locations) in enumerate(name_to_locs.items(), 1):
        logging.info("[%d/%d] Looking up: %s", i, total, name)

        node = search_professor(session, name)

        if node is None:
            logging.info("  -> Not found on RMP")
            not_found_count += 1
        else:
            legacy_id = node.get("legacyId")
            rating    = node.get("avgRating")
            num_r     = node.get("numRatings")
            rmp_first = node.get("firstName", "")
            rmp_last  = node.get("lastName", "")
            link      = (
                f"https://www.ratemyprofessors.com/professor/{legacy_id}"
                if legacy_id else None
            )

            logging.info(
                "  -> Found: %s %s | rating=%.1f | n=%d | %s",
                rmp_first, rmp_last, rating or 0.0, num_r or 0, link,
            )
            found_count += 1

            # Patch every occurrence of this professor across all courses
            for ci, pi in locations:
                final["courses"][ci]["professors"][pi]["rmp_rating"]      = rating
                final["courses"][ci]["professors"][pi]["rmp_num_ratings"]  = num_r
                final["courses"][ci]["professors"][pi]["rmp_link"]         = link

        # Mark as attempted and save both files — never lose progress on crash
        checked.add(name)
        save_json(final)
        save_cache(checked)

        # Human-paced delay — skip on the very last request
        if i < total:
            delay = random.uniform(SLEEP_MIN, SLEEP_MAX)
            logging.info("  Sleeping %.0f s ...", delay)
            time.sleep(delay)

    logging.info(
        "=== done: %d found, %d not found on RMP ===",
        found_count, not_found_count,
    )


if __name__ == "__main__":
    main()

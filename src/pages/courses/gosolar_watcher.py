"""
gosolar_watcher.py
------------------
Polls the GoSOLAR Banner API for all active CSC courses across upcoming terms,
diffs the result against gsu_cs_final.json, and patches the JSON in place.

Run manually:   python gosolar_watcher.py
Schedule daily: see README at bottom of this file.

Requires:  pip install requests
"""

import json
import re
import time
import logging
from datetime import datetime, date
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_URL = "https://registration.gosolar.gsu.edu/StudentRegistrationSsb/ssb"
SUBJECT = "CSC"
FINAL_JSON = Path(__file__).parent / "gsu_cs_final.json"
LOG_FILE   = Path(__file__).parent / "gosolar_watcher.log"

# Terms to check: generate the next 6 terms from today
def upcoming_terms(n: int = 6) -> list[str]:
    """Return the next n Banner term codes (YYYYMM) from today."""
    today = date.today()
    codes = []
    year = today.year
    # Banner months: 01=Spring, 05=Summer, 08=Fall
    seasons = [("01", 1), ("05", 5), ("08", 8)]
    for y in range(year - 1, year + 3):
        for code, month in seasons:
            if date(y, month, 1) >= date(today.year - 1, 1, 1):
                codes.append(f"{y}{code}")
    # Keep only future-ish terms (last year onwards) and cap at n
    return codes[:n]

# ---------------------------------------------------------------------------
# Name cleaning (mirrors merge_final.py)
# ---------------------------------------------------------------------------

def clean_professor_name(raw: str) -> str:
    raw = raw.strip().rstrip(" .")
    if "," not in raw:
        return raw.rstrip(".")
    last, rest = raw.split(",", 1)
    last, rest = last.strip(), rest.strip()
    nick = re.search(r"\(([^)]+)\)", rest)
    if nick:
        return f"{nick.group(1).strip()} {last}"
    rest = re.sub(r"\s+[A-Z]\.$", "", rest).strip()
    rest = re.sub(r"\s+[A-Z]\s*$", "", rest).strip()
    return f"{rest.rstrip('. ')} {last}"

# ---------------------------------------------------------------------------
# GoSOLAR API calls
# ---------------------------------------------------------------------------

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": f"{BASE_URL}/classSearch/classSearch",
}


def make_session() -> requests.Session | None:
    """Establish a Banner session cookie by loading the search page."""
    s = requests.Session()
    s.headers.update(HEADERS)
    try:
        r = s.get(f"{BASE_URL}/classSearch/classSearch", timeout=15)
        r.raise_for_status()
        return s
    except requests.RequestException as e:
        logging.error("Failed to establish Banner session: %s", e)
        return None


def select_term(session: requests.Session, term: str) -> bool:
    """Switch the Banner session to the given term code."""
    try:
        r = session.post(
            f"{BASE_URL}/term/search?mode=search",
            data={"term": term},
            timeout=15,
        )
        return r.status_code == 200
    except requests.RequestException as e:
        logging.warning("term/search failed for %s: %s", term, e)
        return False


def fetch_courses(session: requests.Session, term: str) -> list[dict]:
    """Return all CSC sections for a term as raw Banner records."""
    results = []
    offset = 0
    page_size = 500
    while True:
        try:
            r = session.get(
                f"{BASE_URL}/searchResults/searchResults",
                params={
                    "txt_subject": SUBJECT,
                    "txt_term": term,
                    "startDatepicker": "",
                    "endDatepicker": "",
                    "uniqueSessionId": f"watcher{int(time.time())}",
                    "pageOffset": offset,
                    "pageMaxSize": page_size,
                    "sortColumn": "subjectDescription",
                    "sortDirection": "asc",
                },
                timeout=20,
            )
            r.raise_for_status()
            data = r.json()
        except (requests.RequestException, ValueError) as e:
            logging.warning("searchResults failed for %s offset %d: %s", term, offset, e)
            break

        rows = data.get("data") or []
        results.extend(rows)
        total = data.get("totalCount", 0)
        offset += page_size
        if offset >= total or not rows:
            break
        time.sleep(0.5)
    return results


def scrape_all_terms() -> dict[str, set[str]]:
    """
    Returns a dict of  course_code -> set of cleaned professor names
    aggregated across all upcoming terms.
    """
    session = make_session()
    if session is None:
        return {}

    course_profs: dict[str, set[str]] = {}
    terms = upcoming_terms(6)
    logging.info("Checking terms: %s", terms)

    for term in terms:
        if not select_term(session, term):
            continue
        time.sleep(1)
        rows = fetch_courses(session, term)
        if not rows:
            logging.info("  %s → no data (term may not be open yet)", term)
            continue
        logging.info("  %s → %d sections", term, len(rows))

        for row in rows:
            subj = row.get("subject", "")
            num  = row.get("courseNumber", "")
            if not subj or not num:
                continue
            code = f"{subj} {num}"
            instructors = row.get("faculty") or []
            for inst in instructors:
                raw = inst.get("displayName", "").strip()
                if raw:
                    name = clean_professor_name(raw)
                    course_profs.setdefault(code, set()).add(name)
        time.sleep(1.5)

    return course_profs

# ---------------------------------------------------------------------------
# Diff + patch
# ---------------------------------------------------------------------------

def load_final_json() -> dict:
    with open(FINAL_JSON, encoding="utf-8") as f:
        return json.load(f)


def save_final_json(data: dict) -> None:
    with open(FINAL_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def apply_updates(final: dict, scraped: dict[str, set[str]]) -> list[str]:
    """
    Merge scraped professor names into final JSON.
    Returns a list of human-readable change lines.
    """
    changes = []
    course_map = {c["code"]: c for c in final["courses"]}

    for code, new_names in scraped.items():
        course = course_map.get(code)
        if course is None:
            # Course not in catalog JSON — skip
            continue

        existing_names = {p["name"] for p in course["professors"]}
        added = new_names - existing_names
        for name in sorted(added):
            course["professors"].append({
                "name": name,
                "rmp_rating": None,
                "rmp_num_ratings": None,
                "rmp_link": None,
            })
            changes.append(f"  + {code}: added professor '{name}'")

    if changes:
        final["scraped_date"] = str(date.today())

    return changes

# ---------------------------------------------------------------------------
# Entry point
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
    logging.info("=== gosolar_watcher starting ===")

    scraped = scrape_all_terms()
    if not scraped:
        logging.error("No data scraped — GoSOLAR may be blocking server-side requests.")
        logging.error("If so, you must run phase1_gosolar_allterms.js from the browser instead.")
        return

    final = load_final_json()
    changes = apply_updates(final, scraped)

    if changes:
        save_final_json(final)
        logging.info("JSON updated with %d change(s):", len(changes))
        for line in changes:
            logging.info(line)
    else:
        logging.info("No changes detected.")

    logging.info("=== done ===")


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# HOW TO SCHEDULE THIS (Windows Task Scheduler)
# ---------------------------------------------------------------------------
# 1. Open Task Scheduler (search "Task Scheduler" in Start)
# 2. Click "Create Basic Task" in the right panel
# 3. Name: "GSU Course Watcher"   Trigger: Daily   Time: pick any (e.g. 8am)
# 4. Action: "Start a program"
#    Program:  C:\Users\unehi\AppData\Local\Programs\Python\Python313\python.exe
#    Arguments: "C:\Users\unehi\ProGSU-Course_page\gosolar_watcher.py"
# 5. Finish.
#
# To check if it ran: open gosolar_watcher.log in the project folder.
# If it prints "GoSOLAR may be blocking server-side requests", the Banner API
# isn't accessible without a real browser and you'll need to keep using the
# browser console approach (phase1_gosolar_allterms.js) manually.
# ---------------------------------------------------------------------------

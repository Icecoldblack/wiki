# Data Pipeline: gosolar_watcher + rmp_lookup

These two scripts keep `gsu_cs_final.json` up to date with the latest GSU CS
course offerings and RateMyProfessors data.  Run them in order — watcher first,
then RMP lookup.

---

## Prerequisites

Python 3.10 or later (uses `X | Y` union type hints).

```
pip install requests
```

Both scripts live in the project root and expect `gsu_cs_final.json` to be
present there as well.

---

## Script 1 — `gosolar_watcher.py`

**What it does**

Polls the GoSOLAR Banner REST API for every active CSC section across the next
six terms (Spring / Summer / Fall, current year ± 1).  For each section it
extracts the instructor name, cleans it to "First Last" form, and appends any
new names to the matching course's `professors` array in `gsu_cs_final.json`.
Professors already in the file are never duplicated.  New entries get
`rmp_rating`, `rmp_num_ratings`, and `rmp_link` set to `null` — ready for
`rmp_lookup.py` to fill in.

**Run it**

```
python gosolar_watcher.py
```

Progress is logged to both the console and `gosolar_watcher.log`.

**If GoSOLAR blocks server-side requests**

Banner's API sometimes rejects non-browser traffic.  If the log ends with:

```
GoSOLAR may be blocking server-side requests.
If so, you must run phase1_gosolar_allterms.js from the browser instead.
```

open a browser console on the GoSOLAR class-search page and run
`phase1_gosolar_allterms.js` manually — that script exports the same raw data
that this watcher would have fetched.

**Schedule it (Windows Task Scheduler)**

1. Open Task Scheduler → "Create Basic Task"
2. Name: `GSU Course Watcher`  |  Trigger: Daily  |  Time: e.g. 8 am
3. Action: Start a program
   - Program: `C:\Users\unehi\AppData\Local\Programs\Python\Python313\python.exe`
   - Arguments: `C:\Users\unehi\ProGSU-Course_page\gosolar_watcher.py`
4. Finish.

---

## Script 2 — `rmp_lookup.py`

**What it does**

Iterates every professor in `gsu_cs_final.json` whose `rmp_link` is still
`null` and queries the RateMyProfessors GraphQL API (GSU school ID 360).  On a
match it fills in `rmp_rating`, `rmp_num_ratings`, and `rmp_link` directly in
the JSON.  Professors not found on RMP stay `null`.

Key behaviours:

| Feature | Detail |
|---|---|
| **Resume-safe** | Progress is saved to `rmp_cache.json` after every lookup; re-running picks up where it stopped. |
| **Rate limiting** | Sleeps 45–90 s (random) between requests to avoid triggering RMP's throttle. |
| **Name matching** | Tries exact full name, then last-name + first initial, then unambiguous last name only; also retries with the name reversed in case RMP stored it backwards. |
| **Re-check toggle** | Set `RECHECK_NOT_FOUND = True` (default) to retry professors that were previously not found. Set to `False` to skip them and save time on subsequent runs. |

**Run it**

```
python rmp_lookup.py
```

Expected duration: roughly 2 minutes per professor (45–90 s sleep + overhead).
~106 professors ≈ 2 hours total.  Progress is logged to both the console and
`rmp_lookup.log`.

**Resuming after a crash**

Just re-run `python rmp_lookup.py`.  The script reads `rmp_cache.json` and
skips every name already attempted.

**Clearing the cache to start fresh**

Delete `rmp_cache.json`, or set `rmp_link` fields back to `null` in
`gsu_cs_final.json` for the professors you want re-checked.

---

## Typical workflow

```
# 1. Pull in any new professors from GoSOLAR
python gosolar_watcher.py

# 2. Fill in their RMP data (takes ~2 h, safe to interrupt and resume)
python rmp_lookup.py
```

After both scripts finish, `gsu_cs_final.json` is ready for the front end.

---

## Output files

| File | Created by | Purpose |
|---|---|---|
| `gsu_cs_final.json` | (pre-existing) | Master course + professor catalog; patched in place by both scripts |
| `gosolar_watcher.log` | `gosolar_watcher.py` | Run log; append-only |
| `rmp_lookup.log` | `rmp_lookup.py` | Run log; append-only |
| `rmp_cache.json` | `rmp_lookup.py` | Tracks every name attempted so runs can resume |

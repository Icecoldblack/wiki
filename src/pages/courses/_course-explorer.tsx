import { useState, useRef, useEffect, useCallback } from "react";
import { COURSES, CATS, BY_CODE, REQ, UNLOCKS, type Course } from "./_data";
// static import so Vite/Astro injects the stylesheet before first render — prevents FOUC
import "./_course-explorer.css";

// ---------- Helpers ----------

// Returns a CSS class name based on a professor's rating score
function ratingClass(r: number | null): string {
  if (r == null) return "r-nr";
  if (r >= 4.0) return "r-hi";
  if (r >= 3.0) return "r-mid";
  return "r-lo";
}

// Strips the "Prerequisite:" label so we show just the requirement text
function cleanPrereqText(t: string): string | null {
  if (!t || t.toLowerCase() === "none") return null;
  return t
    .replace(/\s*Prerequisites?\s*:\s*/gi, "")
    .replace(/\s*Co-?requisites?\s*:\s*/gi, "Co-req: ")
    .trim();
}

// ---------- SVG Icons ----------

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const GridIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const TypeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const LinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);


// ---------- Pill button (one course in the category grid) ----------

interface PillProps {
  course: Course;
  label: string;
  sub: string | null;
  active: boolean;
  dim: boolean;
  badge: number;
  hl: "prereq" | "unlocks" | null;
  onClick: () => void;
}

function Pill({ course, label, sub, active, dim, badge, hl, onClick }: PillProps) {
  const cls = [
    "pill",
    active   ? "is-active"           : "",
    dim      ? "is-dim"              : "",
    hl === "prereq"  ? "is-prereq-of-active"   : "",
    hl === "unlocks" ? "is-unlocked-by-active"  : "",
  ].filter(Boolean).join(" ");

  return (
    <button className={cls} onClick={onClick} title={`${course.code} — ${course.title}`}>
      <span>{label}</span>
      {sub && <span className="pill-num">{sub}</span>}
      {/* Gold badge in prereq-lens mode shows how many courses this one unlocks */}
      {badge > 0 && <span className="unlock-badge">{badge}</span>}
    </button>
  );
}

// ---------- Right-side detail card ----------

interface DetailCardProps {
  course: Course | undefined;
  onPick: (code: string) => void;
  flat?: boolean; // strip card border/bg when rendered inside the mobile sheet
}

function DetailCard({ course, onPick, flat }: DetailCardProps) {
  // Empty state — no course selected yet
  if (!course) {
    return (
      <div className="detail-empty">
        <div className="ic">{"{ }"}</div>
        <div>Select a course on the left to view professors,<br />prereqs, and what it unlocks.</div>
      </div>
    );
  }

  const req = REQ[course.code] || { csc: [], math: [] };
  const unlocks = UNLOCKS[course.code] || [];
  const cleanPr = cleanPrereqText(course.pr);

  return (
    <div className={flat ? "detail detail--flat" : "detail"}>
      {/* Course code + credit hours */}
      <div className="d-code-row">
        <span className="d-code">{course.code}</span>
        <span className="d-ch">{course.ch === "N/A" ? "Var. Credit" : `${course.ch} cr`}</span>
      </div>
      <h2 className="d-title">{course.title}</h2>
      {course.d && (
        <p className="d-desc">{course.d.replace(/\s*[—–]\s*/g, ", ")}</p>
      )}

      {/* Professor list with RMP ratings */}
      {course.profs && course.profs.length > 0 && (
        <div className="d-section">
          <div className="d-section-h">Current Professors ({course.profs.length})</div>
          <div className="prof-list">
            {[...course.profs]
              .sort((a, b) => {
                if (a.r === null && b.r === null) return 0;
                if (a.r === null) return 1;
                if (b.r === null) return -1;
                return b.r - a.r;
              })
              .map((p, i) =>
              p.l ? (
                <a key={p.n + i} className="prof" href={p.l} target="_blank" rel="noreferrer noopener">
                  <span className="prof-name">{p.n}</span>
                  <span className="prof-count">{p.c != null ? `(${p.c})` : ""}</span>
                  <span className={`prof-rating ${ratingClass(p.r)}`}>{p.r != null ? p.r.toFixed(1) : "N/R"}</span>
                </a>
              ) : (
                <div key={p.n + i} className="prof">
                  <span className="prof-name">{p.n}</span>
                  <span className="prof-count">{p.c != null ? `(${p.c})` : ""}</span>
                  <span className={`prof-rating ${ratingClass(p.r)}`}>{p.r != null ? p.r.toFixed(1) : "N/R"}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Clickable prerequisite chips — clicking one jumps to that course */}
      <div className="d-section">
        <div className="d-section-h">Requires</div>
        {req.csc.length === 0 && req.math.length === 0 ? (
          <div className="req-empty">No course prerequisites</div>
        ) : (
          <div className="req-row">
            {req.csc.map((c) => (
              <button key={c} className="req-chip" onClick={() => onPick(c)}>{c}</button>
            ))}
            {req.math.map((c) => (
              <span key={c} className="req-chip is-math">{c}</span>
            ))}
          </div>
        )}
        {cleanPr && cleanPr.length > 0 && cleanPr !== "None" && (
          <div className="pr-note">{cleanPr.replace(/\s*[—–]\s*/g, ", ")}</div>
        )}
      </div>

      {/* Courses that list this one as a prerequisite */}
      <div className="d-section">
        <div className="d-section-h">Unlocks ({unlocks.length})</div>
        {unlocks.length === 0 ? (
          <div className="req-empty">No courses list this as a prereq</div>
        ) : (
          <div className="req-row">
            {unlocks.map((c) => (
              <button key={c} className="req-chip is-unlock" onClick={() => onPick(c)}>{c}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Main App ----------

export default function CourseExplorer() {
  // Pill label mode: show course codes or full course names
  const [labelMode, setLabelMode]   = useState<"code" | "name">("code");
  const [query, setQuery]           = useState("");
  const [active, setActive]         = useState("CSC 1302"); // currently selected course
  const [prereqMode, setPrereqMode] = useState(false);      // highlight prereqs / unlocks
  const [sheetOpen, setSheetOpen]   = useState(false);      // mobile slide-up detail sheet

  const searchRef = useRef<HTMLInputElement>(null);

  // Press "/" anywhere to focus the search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Filter predicate — matches against code or title
  const q = query.trim().toLowerCase();
  const isMatch = useCallback((c: Course) => {
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.code.replace(/\s+/g, "").toLowerCase().includes(q.replace(/\s+/g, ""))
    );
  }, [q]);

  const activeCourse   = BY_CODE[active];
  const activePrereqs  = active ? new Set(REQ[active]?.csc   || []) : new Set<string>();
  const activeUnlocks  = active ? new Set(UNLOCKS[active]     || []) : new Set<string>();

  // Apply search filter across all categories
  const filteredCats = CATS.map((cat) => {
    const courses = cat.codes.map((code) => BY_CODE[code]).filter(Boolean) as Course[];
    const matched = courses.filter(isMatch);
    return { ...cat, courses, matched };
  });
  const totalMatched = filteredCats.reduce((n, c) => n + c.matched.length, 0);

  // Lock background scroll while the mobile sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  // Select a course; on mobile open the slide-up sheet instead of scrolling
  const onPick = (code: string) => {
    setActive(code);
    if (window.innerWidth < 1080) {
      setSheetOpen(true);
    }
  };

  return (
    <div className="shell">

      {/* ── Top navigation bar ── */}
      <header className="top">
        <div className="brand">
          <span className="brand-name">ProGSU</span>
          <span className="brand-slash">/</span>
          <span className="brand-page">Courses</span>
        </div>
        <div className="top-meta">
          <a href="/">← back to home</a>
        </div>
      </header>

      {/* ── Page title ── */}
      <section className="page-head">
        <p className="page-eyebrow">GSU · CS · 2025–2026</p>
        <h1 className="h1">every course,<br />every path forward.</h1>
        <p className="lede">
          GSU Computer Science courses with professors, RateMyProfessor scores, prerequisites,
          and what each class unlocks. Built by students, for students.
        </p>
      </section>

      {/* ── Search + toolbar controls ── */}
      <div className="toolbar">
        <div className="search">
          <SearchIcon />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or name (e.g. 'Algorithms', '4520', 'Machine Learning')"
          />
          {query ? (
            <button className="clear" onClick={() => setQuery("")}>clear</button>
          ) : (
            <span className="kbd">/</span>
          )}
        </div>

        {/* Toggle pill labels between course codes and full names */}
        <div className="tb-group" title="Show course codes or full names on the pills">
          <button className={`tb-btn${labelMode === "code" ? " is-on" : ""}`} onClick={() => setLabelMode("code")}>
            <GridIcon /> Codes
          </button>
          <button className={`tb-btn${labelMode === "name" ? " is-on" : ""}`} onClick={() => setLabelMode("name")}>
            <TypeIcon /> Names
          </button>
        </div>

        {/* Prereq Lens: highlights what the active course requires and what it unlocks */}
        <button
          className={`tb-action${prereqMode ? " is-on" : ""}`}
          onClick={() => setPrereqMode((v) => !v)}
          title="Highlight prereqs and unlocks for the selected course"
        >
          <LinkIcon /> Prereq Lens
        </button>

<span className="tb-counter">
          {q ? `${totalMatched} / ${COURSES.length}` : `${COURSES.length} courses`}
        </span>
      </div>

      {/* ── Main two-column layout ── */}
      <div className="grid">

        {/* Left: category groups with pill buttons for each course */}
        <div className="cats">
          {filteredCats.map((cat) => {
            if (q && cat.matched.length === 0) return null; // hide empty categories when filtering
            return (
              <div className="cat" key={cat.id}>
                <div className="cat-head">
                  <span className="cat-title">{cat.label}</span>
                  <span className="cat-count">
                    {cat.matched.length}{q ? ` / ${cat.courses.length}` : ""}
                  </span>
                </div>
                <div className="pills">
                  {cat.courses.map((c) => {
                    const matched  = isMatch(c);
                    const isActive = c.code === active;
                    const label    = labelMode === "code" ? c.code : c.title;
                    const sub      = labelMode === "name" ? c.code.replace("CSC ", "") : null;

                    // In prereq-lens mode, color courses that are prereqs or unlocked by the active one
                    let hl: "prereq" | "unlocks" | null = null;
                    if (prereqMode && active && c.code !== active) {
                      if (activePrereqs.has(c.code))  hl = "prereq";
                      else if (activeUnlocks.has(c.code)) hl = "unlocks";
                    }

                    // In prereq-lens mode, show a badge with how many courses depend on this one
                    const badge = prereqMode ? UNLOCKS[c.code]?.length || 0 : 0;

                    return (
                      <Pill
                        key={c.code}
                        course={c}
                        label={label}
                        sub={sub}
                        active={isActive}
                        dim={q ? !matched : false}
                        badge={badge}
                        hl={hl}
                        onClick={() => onPick(c.code)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: sticky detail card for the selected course */}
        <aside className="detail-wrap">
          <DetailCard course={activeCourse} onPick={onPick} />
        </aside>
      </div>

      <footer className="footer">
        <div>© 2026 ProGSU · Ratings: RateMyProfessor</div>
        <div></div>
      </footer>

      {/* ── Mobile slide-up sheet (hidden on desktop) ── */}
      {sheetOpen && activeCourse && (
        <>
          <div className="mobile-sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="mobile-sheet">
            <div className="mobile-sheet-handle">
              <span className="mobile-sheet-label">{activeCourse.code}</span>
              <button className="mobile-sheet-close" onClick={() => setSheetOpen(false)}>✕</button>
            </div>
            <div className="mobile-sheet-body">
              <DetailCard course={activeCourse} onPick={(code) => { setActive(code); }} flat />
            </div>
          </div>
        </>
      )}

    </div>
  );
}

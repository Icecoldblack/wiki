// path is relative to this file — both live in src/pages/courses/
import raw from "./_gsu_cs_final.json";

export interface Prof {
  n: string;
  r: number | null;
  c: number | null;
  l: string | null;
}

export interface Course {
  code: string;
  title: string;
  ch: string;
  pr: string;
  d: string | null;
  profs: Prof[];
}

export interface Category {
  id: string;
  label: string;
  codes: string[];
}

export interface ReqMap { csc: string[]; math: string[] }

// Transform JSON shape → internal shape
export const COURSES: Course[] = (raw.courses as {
  code: string;
  title: string;
  credit_hours: string;
  prerequisites: string;
  description: string | null;
  professors: {
    name: string;
    rmp_rating: number | null;
    rmp_num_ratings: number | null;
    rmp_link: string | null;
  }[];
}[]).map((c) => ({
  code: c.code,
  title: c.title,
  ch: c.credit_hours,
  pr: c.prerequisites,
  d: c.description,
  profs: c.professors.map((p) => ({
    n: p.name,
    r: p.rmp_rating,
    c: p.rmp_num_ratings,
    l: p.rmp_link,
  })),
}));

export const CATS: Category[] = [
  { id: "gen",    label: "Intro / Gen Ed",          codes: ["CSC 1010"] },
  { id: "core",   label: "Core",                    codes: ["CSC 1301","CSC 1301K","CSC 1301L","CSC 1302","CSC 1302K","CSC 1302L"] },
  { id: "found",  label: "Foundations",             codes: ["CSC 2222","CSC 2510","CSC 2720","CSC 2920"] },
  { id: "upper",  label: "Required Upper Core",     codes: ["CSC 3210","CSC 3320","CSC 3350","CSC 3900"] },
  { id: "sys",    label: "Systems & Architecture",  codes: ["CSC 4110","CSC 4120","CSC 4210","CSC 4220","CSC 4310","CSC 4311","CSC 4320","CSC 4330","CSC 4340"] },
  { id: "sec",    label: "Security",                codes: ["CSC 4221","CSC 4222","CSC 4223","CSC 4224","CSC 4226","CSC 4227","CSC 4228","CSC 4250","CSC 4251"] },
  { id: "swe",    label: "Software Eng. & Capstone",codes: ["CSC 4350","CSC 4351","CSC 4352","CSC 4360","CSC 4370"] },
  { id: "theory", label: "Theory & Numerical",      codes: ["CSC 4510","CSC 4520","CSC 4610","CSC 4620","CSC 4630","CSC 4650"] },
  { id: "data",   label: "Data Systems & Science",  codes: ["CSC 4710","CSC 4720","CSC 4730","CSC 4740","CSC 4750","CSC 4760","CSC 4780"] },
  { id: "ai",     label: "AI, ML, Graphics & Games",codes: ["CSC 4260","CSC 4810","CSC 4820","CSC 4821","CSC 4822","CSC 4830","CSC 4840","CSC 4841","CSC 4850","CSC 4851"] },
  { id: "misc",   label: "Research & Special Topics",codes: ["CSC 4870","CSC 4880","CSC 4900","CSC 4940","CSC 4980","CSC 4982","CSC 4990","CSC 4995","CSC 4997","CSC 4998","CSC 4999"] },
];

// ---------- Derived lookups ----------
export const BY_CODE: Record<string, Course> = Object.fromEntries(COURSES.map((c) => [c.code, c]));

const PREREQ_RE = /CSC\s+\d{4}[KL]?/gi;
const MATH_RE   = /MATH\s+\d{4}/gi;

export const REQ: Record<string, ReqMap> = {};
export const UNLOCKS: Record<string, string[]> = {};

for (const c of COURSES) {
  const txt  = c.pr || "";
  const csc  = [...new Set((txt.match(PREREQ_RE) || []).map((s) => s.replace(/\s+/, " ").toUpperCase()))];
  const math = [...new Set((txt.match(MATH_RE)   || []).map((s) => s.replace(/\s+/, " ").toUpperCase()))];
  REQ[c.code] = { csc, math };
}
for (const c of COURSES) {
  for (const pre of REQ[c.code].csc) {
    if (!UNLOCKS[pre]) UNLOCKS[pre] = [];
    UNLOCKS[pre].push(c.code);
  }
}

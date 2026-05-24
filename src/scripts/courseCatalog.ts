export interface Section {
  id: string;
  professor: string;
  days: string[];
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  room: string;
  seats: number;
  cap: number;
}

export interface Course {
  code: string;
  title: string;
  credits: number;
  subject: string;
  sections: Section[];
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
export const START_HOUR = 7;
export const END_HOUR = 21;
export const SLOTS = (END_HOUR - START_HOUR) * 2;

export const subjectColors: Record<string, { bg: string; border: string; text: string }> = {
  CSC:  { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.30)', text: '#d8b4fe' },
  MATH: { bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.25)', text: '#67e8f9' },
  PHYS: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', text: '#6ee7b7' },
  ENGR: { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.22)', text: '#fde68a' },
};

const COURSE_PALETTE = [
  { bg: 'rgba(168,85,247,0.18)',  border: 'rgba(168,85,247,0.35)', text: '#d8b4fe' },  // purple
  { bg: 'rgba(34,211,238,0.15)',  border: 'rgba(34,211,238,0.30)', text: '#67e8f9' },  // cyan
  { bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.30)', text: '#6ee7b7' },  // green
  { bg: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.30)', text: '#fecdd3' }, // rose
  { bg: 'rgba(251,191,36,0.14)',  border: 'rgba(251,191,36,0.28)', text: '#fde68a' },  // amber
  { bg: 'rgba(251,146,60,0.14)',  border: 'rgba(251,146,60,0.28)', text: '#fed7aa' },  // orange
  { bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.30)', text: '#c7d2fe' }, // indigo
  { bg: 'rgba(244,114,182,0.14)', border: 'rgba(244,114,182,0.28)', text: '#fbcfe8' }, // pink
];

const courseColorCache = new Map<string, typeof COURSE_PALETTE[0]>();
let nextColorIdx = 0;

export function courseColor(code: string) {
  let c = courseColorCache.get(code);
  if (!c) {
    c = COURSE_PALETTE[nextColorIdx % COURSE_PALETTE.length];
    nextColorIdx++;
    courseColorCache.set(code, c);
  }
  return c;
}

export const catalog: Course[] = [
  { code: 'CSC 1301', title: 'Principles of Computer Science I', credits: 4, subject: 'CSC', sections: [
    { id: '001', professor: 'Dr. Raj', days: ['Tue','Thu'], startH: 14, startM: 0, endH: 15, endM: 15, room: 'Aderhold 221', seats: 12, cap: 40 },
    { id: '003', professor: 'Dr. Gunay', days: ['Mon','Wed'], startH: 11, startM: 0, endH: 12, endM: 15, room: 'Petit 230', seats: 8, cap: 35 },
  ]},
  { code: 'CSC 1302', title: 'Principles of Computer Science II', credits: 4, subject: 'CSC', sections: [
    { id: '001', professor: 'Dr. Gunay', days: ['Mon','Wed'], startH: 11, startM: 0, endH: 12, endM: 15, room: 'Petit 230', seats: 3, cap: 35 },
  ]},
  { code: 'CSC 2010', title: 'Principles of Computer Science III', credits: 4, subject: 'CSC', sections: [
    { id: '001', professor: 'Dr. Phan', days: ['Tue','Thu'], startH: 9, startM: 30, endH: 10, endM: 45, room: 'Aderhold 112', seats: 0, cap: 30 },
  ]},
  { code: 'CSC 2720', title: 'Data Structures', credits: 4, subject: 'CSC', sections: [
    { id: '001', professor: 'Dr. Phan', days: ['Mon','Wed'], startH: 14, startM: 0, endH: 15, endM: 15, room: 'Aderhold 221', seats: 18, cap: 40 },
    { id: '002', professor: 'Dr. Saquer', days: ['Tue','Thu'], startH: 11, startM: 0, endH: 12, endM: 15, room: 'Petit 130', seats: 5, cap: 35 },
  ]},
  { code: 'CSC 3210', title: 'Computer Organization', credits: 4, subject: 'CSC', sections: [
    { id: '001', professor: 'Dr. Manoussakis', days: ['Tue','Thu'], startH: 15, startM: 30, endH: 16, endM: 45, room: 'Petit 130', seats: 22, cap: 35 },
  ]},
  { code: 'CSC 3320', title: 'System Level Programming', credits: 4, subject: 'CSC', sections: [
    { id: '001', professor: 'Dr. Saquer', days: ['Mon','Wed'], startH: 9, startM: 30, endH: 10, endM: 45, room: 'Aderhold 112', seats: 8, cap: 30 },
  ]},
  { code: 'CSC 4210', title: 'Computer Architecture', credits: 3, subject: 'CSC', sections: [
    { id: '001', professor: 'Dr. Manoussakis', days: ['Tue','Thu'], startH: 11, startM: 0, endH: 12, endM: 15, room: 'Petit 230', seats: 15, cap: 25 },
  ]},
  { code: 'CSC 4310', title: 'Operating Systems', credits: 3, subject: 'CSC', sections: [
    { id: '001', professor: 'Dr. Phan', days: ['Mon','Wed'], startH: 15, startM: 30, endH: 16, endM: 45, room: 'Aderhold 221', seats: 2, cap: 30 },
  ]},
  { code: 'CSC 4320', title: 'Computer Networks', credits: 3, subject: 'CSC', sections: [
    { id: '001', professor: 'Dr. Saquer', days: ['Tue','Thu'], startH: 14, startM: 0, endH: 15, endM: 15, room: 'Petit 130', seats: 20, cap: 35 },
  ]},
  { code: 'MATH 2211', title: 'Calculus I', credits: 4, subject: 'MATH', sections: [
    { id: '001', professor: 'Dr. Kim', days: ['Mon','Wed','Fri'], startH: 10, startM: 0, endH: 10, endM: 50, room: 'Classroom S 134', seats: 30, cap: 45 },
  ]},
  { code: 'MATH 2212', title: 'Calculus II', credits: 4, subject: 'MATH', sections: [
    { id: '001', professor: 'Dr. Gupta', days: ['Mon','Wed','Fri'], startH: 13, startM: 0, endH: 13, endM: 50, room: 'Classroom S 210', seats: 5, cap: 40 },
  ]},
  { code: 'MATH 2420', title: 'Discrete Mathematics', credits: 3, subject: 'MATH', sections: [
    { id: '001', professor: 'Dr. Kim', days: ['Tue','Thu'], startH: 12, startM: 30, endH: 13, endM: 45, room: 'Classroom S 134', seats: 14, cap: 30 },
  ]},
];

export function toSlot(h: number, m: number) {
  return (h * 60 + m - START_HOUR * 60) / 30;
}

export function fmtTime(h: number, m: number) {
  const s = h >= 12 ? 'pm' : 'am';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${h12}${s}` : `${h12}:${String(m).padStart(2, '0')}${s}`;
}

export function fmtMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return fmtTime(h, m);
}

export function findCourse(code: string) {
  return catalog.find(c => c.code === code);
}

export function findSection(code: string, sectionId: string) {
  return findCourse(code)?.sections.find(s => s.id === sectionId);
}

import { catalog, DAYS, type Course, type Section } from './courseCatalog';
import * as persist from './persist';

export interface ScheduleEntry {
  code: string;
  sectionId: string;
}

export interface ScheduleData {
  id: string;
  name: string;
  semester: string;
  courses: ScheduleEntry[];
}

export interface ResolvedEntry {
  code: string;
  sectionId: string;
  course: Course;
  section: Section;
}

export interface ScheduleStats {
  credits: number;
  contactHours: number;
  earliestMin: number;
  latestMin: number;
  daysOff: string[];
}

const STORAGE_KEY = 'schedules';
const ACTIVE_KEY = 'activeScheduleId';

const defaultSeeds: ScheduleEntry[] = [
  { code: 'CSC 2720', sectionId: '001' },
  { code: 'CSC 4310', sectionId: '001' },
  { code: 'MATH 2212', sectionId: '001' },
  { code: 'MATH 2420', sectionId: '001' },
];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadAll(): ScheduleData[] {
  const stored = persist.get<ScheduleData[] | null>(STORAGE_KEY, null);
  if (stored && stored.length > 0) return stored;
  const initial: ScheduleData = {
    id: genId(),
    name: 'Ideal',
    semester: 'Fall 2026',
    courses: [...defaultSeeds],
  };
  saveAll([initial]);
  setActiveId(initial.id);
  return [initial];
}

function saveAll(schedules: ScheduleData[]) {
  persist.set(STORAGE_KEY, schedules);
}

function getActiveId(): string | null {
  return persist.get<string | null>(ACTIVE_KEY, null);
}

function setActiveId(id: string) {
  persist.set(ACTIVE_KEY, id);
}

export function getAllSchedules(): ScheduleData[] {
  return loadAll();
}

export function getActive(): ScheduleData {
  const all = loadAll();
  const id = getActiveId();
  return all.find(s => s.id === id) ?? all[0];
}

export function setActive(id: string) {
  setActiveId(id);
}

export function getScheduleById(id: string): ScheduleData | undefined {
  return loadAll().find(s => s.id === id);
}

export function updateSchedule(updated: ScheduleData) {
  const all = loadAll();
  const idx = all.findIndex(s => s.id === updated.id);
  if (idx >= 0) all[idx] = updated;
  else all.push(updated);
  saveAll(all);
}

export function duplicateSchedule(sourceId: string, newName: string): ScheduleData {
  const all = loadAll();
  const source = all.find(s => s.id === sourceId);
  const dup: ScheduleData = {
    id: genId(),
    name: newName,
    semester: source?.semester ?? 'Fall 2026',
    courses: source ? [...source.courses] : [],
  };
  all.push(dup);
  saveAll(all);
  return dup;
}

export function deleteSchedule(id: string) {
  let all = loadAll();
  all = all.filter(s => s.id !== id);
  if (all.length === 0) {
    all.push({ id: genId(), name: 'Ideal', semester: 'Fall 2026', courses: [] });
  }
  saveAll(all);
  if (getActiveId() === id) setActiveId(all[0].id);
}

export function resolve(entries: ScheduleEntry[]): ResolvedEntry[] {
  const result: ResolvedEntry[] = [];
  for (const e of entries) {
    const course = catalog.find(c => c.code === e.code);
    const section = course?.sections.find(s => s.id === e.sectionId);
    if (course && section) result.push({ code: e.code, sectionId: e.sectionId, course, section });
  }
  return result;
}

export function computeStats(entries: ResolvedEntry[]): ScheduleStats {
  if (entries.length === 0) {
    return { credits: 0, contactHours: 0, earliestMin: 0, latestMin: 0, daysOff: [...DAYS] };
  }
  let credits = 0, contactMin = 0, earlyMin = 24 * 60, lateMin = 0;
  const allDays = new Set<string>();
  for (const e of entries) {
    credits += e.course.credits;
    const st = e.section.startH * 60 + e.section.startM;
    const en = e.section.endH * 60 + e.section.endM;
    if (st < earlyMin) earlyMin = st;
    if (en > lateMin) lateMin = en;
    contactMin += (en - st) * e.section.days.length;
    e.section.days.forEach(d => allDays.add(d));
  }
  return {
    credits,
    contactHours: Math.round(contactMin / 60 * 10) / 10,
    earliestMin: earlyMin,
    latestMin: lateMin,
    daysOff: DAYS.filter(d => !allDays.has(d)),
  };
}

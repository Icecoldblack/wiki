import * as persist from './persist';

const KEY = 'starred';
const starred = new Set<string>(persist.get<string[]>(KEY, []));
const listeners = new Set<() => void>();

function save() {
  persist.set(KEY, [...starred]);
}

export function toggle(code: string): boolean {
  if (starred.has(code)) {
    starred.delete(code);
    save();
    notify();
    return false;
  }
  starred.add(code);
  save();
  notify();
  return true;
}

export function has(code: string): boolean {
  return starred.has(code);
}

export function all(): string[] {
  return [...starred];
}

export function count(): number {
  return starred.size;
}

export function onChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach(fn => fn());
}

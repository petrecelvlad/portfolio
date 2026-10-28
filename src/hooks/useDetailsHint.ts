import { useSyncExternalStore } from 'react';

// One flag for every clipboard on the page: the first tab click anywhere retires the hint for good.
const STORAGE_KEY = 'details-hint-dismissed';
const listeners = new Set<() => void>();
let isDismissed = readStoredDismissal();

function readStoredDismissal(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissDetailsHint() {
  if (isDismissed) return;
  isDismissed = true;
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Blocked storage: the hint just shows again on the next visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function useDetailsHintDismissed(): boolean {
  return useSyncExternalStore(subscribe, () => isDismissed);
}

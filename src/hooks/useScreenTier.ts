import { useSyncExternalStore } from 'react';

export type ScreenTier = 'mobile' | 'tablet' | 'laptop' | 'desktop';

// The tier boundaries live only in index.css; this reads the tier they resolve to.
function readScreenTier(): ScreenTier {
  return getComputedStyle(document.documentElement).getPropertyValue('--screen-tier').trim() as ScreenTier;
}

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

export function useScreenTier(): ScreenTier {
  return useSyncExternalStore(subscribe, readScreenTier);
}

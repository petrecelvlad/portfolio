import { useEffect, useState } from 'react';

/**
 * True while this site's scroll container (`<main>`, the only scrollable
 * element — see App.tsx) is actively scrolling, false again `settleMs`
 * after the last scroll event. Lets expensive per-frame work (the Hero
 * WebGL background) pause for the whole scroll gesture instead of only
 * once a destination section's visibility ratio crosses some threshold —
 * so it's not still competing with the browser's own scroll handling for
 * any part of the transition.
 */
export function useIsScrolling(settleMs = 200): boolean {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsScrolling(false), settleMs);
    };

    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      main.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [settleMs]);

  return isScrolling;
}

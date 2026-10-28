import { useEffect, useState } from 'react';

/**
 * Delays flipping to true by one idle tick, so callers can mount
 * non-critical/expensive children (WebGL canvases, shader init) a beat
 * after the critical text/layout has already painted. Falls back to
 * setTimeout where requestIdleCallback isn't available (Safari).
 */
export function useDeferredMount(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(() => setReady(true));
      return () => win.cancelIdleCallback?.(id);
    }

    const id = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(id);
  }, []);

  return ready;
}

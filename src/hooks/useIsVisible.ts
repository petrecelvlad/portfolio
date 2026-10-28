import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether an element is at least `threshold` fraction visible in the viewport.
 * Used to gate always-on RAF/WebGL work (canvases, video) so it only costs GPU/CPU
 * while actually visible on screen.
 *
 * Compares `intersectionRatio` directly rather than using `entry.isIntersecting` —
 * per spec, `isIntersecting` is true as soon as even 1px overlaps the viewport,
 * independent of `threshold` (threshold only controls how often the callback fires,
 * not what counts as "visible"). For expensive scenes like the Hero Three.js
 * background, that meant heavy work kept running until the very last pixel scrolled
 * away, competing with the browser's own scroll handling for the whole gesture.
 * A `threshold` like 0.5 now genuinely stops the work once the element is mostly
 * (not just not-quite-entirely) scrolled out of view.
 */
export function useIsVisible<T extends Element>(threshold = 0) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.intersectionRatio > threshold),
      { threshold: [0, threshold, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

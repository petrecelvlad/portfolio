import { useEffect, useState } from 'react';
import { useIsVisible } from './useIsVisible';

// Plays the CSS animations of the container's [data-reveal] elements and everything inside them
// once `isReady`, again each time the container comes back into view, and rewinds them to their
// first frame when it leaves. Nothing inside a [data-reveal] may loop forever: `isDone` would
// never come.
// The animations start paused in their CSS, so they hold that first frame until played. Under
// reduced motion the CSS drops them, and there's nothing to play. `isDone` turns true once a
// play has finished, so another reveal can wait for this one.
export function useRevealOnView<T extends HTMLElement>(isReady: boolean) {
  const { ref, isVisible } = useIsVisible<T>();
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const reveals = [...ref.current!.querySelectorAll('[data-reveal]')].flatMap(element => element.getAnimations({ subtree: true }));
    if (!isVisible) {
      for (const reveal of reveals) {
        reveal.pause();
        reveal.currentTime = 0;
      }
      setIsDone(false);
      return;
    }
    if (!isReady) return;
    reveals.forEach(reveal => reveal.play());
    let isCurrent = true;
    Promise.all(reveals.map(reveal => reveal.finished)).then(() => {
      if (isCurrent) setIsDone(true);
    });
    return () => { isCurrent = false; };
  }, [ref, isVisible, isReady]);

  return { ref, isDone };
}

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface ScaleToFitProps {
  children: ReactNode;
  className?: string;
  /** Called with the box whenever its size changes, before the content is re-measured. */
  onFrameResize?: (frame: HTMLElement) => void;
}

// Shrinks its content uniformly until it fits the box this element fills, never enlarging it, and
// eases between scales when the content's size changes. The content keeps its natural layout size
// and is only rendered smaller, so fixed pixel geometry inside it (the skill tree's precomputed
// node positions) stays valid. Anchored left and centered vertically, so content that grows to the
// right zooms out without its left edge moving. The box must get its size from its parent — it
// never sizes itself from the content. Centering and scale ride on one transform, so the ease runs
// on the GPU; easing a centered wrapper's width and height re-laid the tree out every frame.
export function ScaleToFit({ children, className = '', onFrameResize }: ScaleToFitProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, offsetY: 0 });
  const onFrameResizeRef = useRef(onFrameResize);
  useLayoutEffect(() => {
    onFrameResizeRef.current = onFrameResize;
  });

  useLayoutEffect(() => {
    const frame = frameRef.current!;
    const content = contentRef.current!;
    const measure = () => {
      const width = content.offsetWidth;
      const height = content.offsetHeight;
      const scale = Math.min(1, frame.clientWidth / width, frame.clientHeight / height);
      setFit({ scale, offsetY: (frame.clientHeight - height * scale) / 2 });
    };

    onFrameResizeRef.current?.(frame);
    measure();
    const observer = new ResizeObserver(entries => {
      if (entries.some(entry => entry.target === frame)) onFrameResizeRef.current?.(frame);
      measure();
    });
    observer.observe(frame);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className={`relative overflow-hidden ${className}`}>
      <div
        ref={contentRef}
        className="absolute left-0 top-0 w-max origin-top-left transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${fit.offsetY}px) scale(${fit.scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

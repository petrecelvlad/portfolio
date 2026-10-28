import { useLayoutEffect, useRef, useState, type ImgHTMLAttributes } from 'react';

export interface ResponsiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

// `sizes` is set to the width the image is actually drawn at, so the browser picks the smallest
// srcset entry that still covers it. Measured rather than written per layout, since the frames
// size themselves with container queries. Until that first measure there is no src at all, or the
// browser would already be fetching the largest candidate.
export function ResponsiveImage({ src, srcSet, ...props }: ResponsiveImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const image = ref.current;
    if (!srcSet || !image) return;
    // A hidden image measures 0; keeping the last width stops it from dropping its picture.
    const measure = (drawn: number) => { if (drawn > 0) setWidth(Math.ceil(drawn)); };
    measure(image.offsetWidth);
    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
    observer.observe(image);
    return () => observer.disconnect();
  }, [srcSet]);

  if (!srcSet) return <img ref={ref} src={src} {...props} />;
  const isMeasured = width > 0;
  return (
    <img
      ref={ref}
      {...props}
      sizes={isMeasured ? `${width}px` : undefined}
      srcSet={isMeasured ? srcSet : undefined}
      src={isMeasured ? src : undefined}
    />
  );
}

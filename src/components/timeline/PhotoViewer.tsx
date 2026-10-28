import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { InstantPhoto } from '../atoms/InstantPhoto';
import type { IScreenshot } from '@/src/core/domain/models';

/**
 * @propolis
 * {
 *   "role": "COMPONENT",
 *   "constraints": [
 *     "A native modal <dialog> in the top layer: the page behind is inert, so the timeline can't scroll or take the arrow keys (T-073)",
 *     "A photo never shows larger than MAX_UPSCALE times its own size",
 *     "No visible scroll bars: the thumbnail strip scrolls by drag only",
 *     "Opening motion is transform/opacity through the browser (C-008), skipped under reduced motion (C-010)"
 *   ]
 * }
 */

export interface PhotoViewerProps {
  title: string;
  screenshots: IScreenshot[];
  startIndex: number;
  /** Where the clicked photo sat on the page; the first photo grows out of it. */
  openedFrom: DOMRect;
  onClose: () => void;
}

const MAX_UPSCALE = 2;
const SWIPE_PX = 50;
const OPEN_MS = 260;
const OPEN_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

function StagePhoto({ src, alt, growFrom }: { src: string; alt: string; growFrom: DOMRect | null }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    if (!natural || !growFrom) return;
    const image = imageRef.current!;
    const to = image.getBoundingClientRect();
    const scale = growFrom.width / to.width;
    const dx = growFrom.left + growFrom.width / 2 - (to.left + to.width / 2);
    const dy = growFrom.top + growFrom.height / 2 - (to.top + to.height / 2);
    image.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: 'none' }],
      { duration: OPEN_MS, easing: OPEN_EASING },
    );
  }, [natural, growFrom]);

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      draggable={false}
      onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
      className="block select-none"
      style={natural
        ? {
            width: `min(100cqw, ${natural.width * MAX_UPSCALE}px, calc(100cqh * ${natural.width / natural.height}))`,
            aspectRatio: `${natural.width} / ${natural.height}`,
          }
        : { position: 'absolute', visibility: 'hidden' }}
    />
  );
}

export function PhotoViewer({ title, screenshots, startIndex, openedFrom, onClose }: PhotoViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stripRef = useRef<HTMLElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const isReducedMotion = useReducedMotion();
  const [shown, setShown] = useState(startIndex);
  const [growFrom] = useState(isReducedMotion ? null : openedFrom);
  const count = screenshots.length;
  const hasSeveral = count > 1;
  const shot = screenshots[shown];
  const show = (index: number) => setShown((index + count) % count);
  const close = () => dialogRef.current!.close();

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    // showModal focuses the close button, which then shows its focus ring to mouse users too.
    dialog.focus();
    if (!isReducedMotion) dialog.animate({ opacity: [0, 1] }, { duration: OPEN_MS, easing: 'ease-out' });
  }, []);

  useEffect(() => {
    stripRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [shown]);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={`${title} screenshots`}
      tabIndex={-1}
      onClose={onClose}
      onKeyDown={(event) => {
        if (!hasSeveral) return;
        if (event.key === 'ArrowLeft') show(shown - 1);
        if (event.key === 'ArrowRight') show(shown + 1);
      }}
      onClick={(event) => {
        if (didSwipe.current) {
          didSwipe.current = false;
          return;
        }
        if ((event.target as HTMLElement).hasAttribute('data-closes')) close();
      }}
      className="fixed inset-0 m-0 p-0 w-full h-full max-w-none max-h-none border-0 bg-transparent backdrop:bg-transparent overflow-hidden text-surface-base"
    >
      <div className="absolute inset-0 bg-surface-inverse opacity-95" aria-hidden />
      <div data-closes className="relative h-full grid grid-rows-[auto_minmax(0,1fr)_auto]">
        <header data-closes className="flex items-center justify-between gap-4 px-4 tablet:px-8 h-16 tablet:h-[72px]">
          <div className="flex flex-col tablet:flex-row tablet:items-baseline gap-0.5 tablet:gap-4 min-w-0">
            <h2 className="m-0 truncate text-base tablet:text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </h2>
            {hasSeveral && (
              <span className="font-arcade text-[13px] tablet:text-base text-butter" aria-live="polite">
                {shown + 1} / {count}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex-none grid place-items-center w-11 h-11 tablet:w-12 tablet:h-12 rounded-[var(--radius-md)] bg-surface-base text-ink-base shadow-[var(--shadow-raised)] cursor-pointer transition-transform hover:-translate-y-0.5"
          >
            <X className="w-5 h-5" strokeWidth={2.5} aria-hidden />
          </button>
        </header>

        <div data-closes className="grid grid-cols-[minmax(0,1fr)] tablet:grid-cols-[112px_minmax(0,1fr)_112px] min-h-0">
          {hasSeveral && (
            <div data-closes className="hidden tablet:grid place-items-center">
              <button
                type="button"
                onClick={() => show(shown - 1)}
                aria-label="Previous photo"
                className="grid place-items-center w-14 h-14 rounded-[var(--radius-pill)] bg-surface-base text-ink-base shadow-[var(--shadow-raised)] cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                <ChevronLeft className="w-6 h-6" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          )}
          <div data-closes className="tablet:col-start-2 flex flex-col min-h-0 py-2">
            <div
              data-closes
              className="flex-1 min-h-0 flex items-center justify-center [container-type:size] touch-pan-y touch-pinch-zoom"
              onPointerDown={(event) => {
                swipeStartX.current = event.clientX;
                didSwipe.current = false;
              }}
              onPointerUp={(event) => {
                if (swipeStartX.current === null || !hasSeveral) return;
                const dx = event.clientX - swipeStartX.current;
                swipeStartX.current = null;
                if (Math.abs(dx) < SWIPE_PX) return;
                didSwipe.current = true;
                show(dx < 0 ? shown + 1 : shown - 1);
              }}
            >
              <StagePhoto
                key={shot.src}
                src={shot.src}
                alt={shot.caption ?? `${title} screenshot ${shown + 1}`}
                growFrom={shown === startIndex ? growFrom : null}
              />
            </div>
            {shot.caption && (
              <p className="m-0 pt-3 px-4 text-center text-xl" style={{ fontFamily: 'var(--font-hand)' }}>
                {shot.caption}
              </p>
            )}
          </div>
          {hasSeveral && (
            <div data-closes className="hidden tablet:grid place-items-center">
              <button
                type="button"
                onClick={() => show(shown + 1)}
                aria-label="Next photo"
                className="grid place-items-center w-14 h-14 rounded-[var(--radius-pill)] bg-surface-base text-ink-base shadow-[var(--shadow-raised)] cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                <ChevronRight className="w-6 h-6" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          )}
        </div>

        {hasSeveral ? (
          <nav
            ref={stripRef}
            data-closes
            aria-label="Project photos"
            className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-4 pb-4 tablet:pb-6"
          >
            <div data-closes className="flex w-max mx-auto gap-3.5 tablet:gap-5 px-5">
              {screenshots.map((screenshot, i) => {
                const isCurrent = i === shown;
                return (
                  <button
                    key={screenshot.src}
                    type="button"
                    onClick={() => show(i)}
                    aria-label={screenshot.caption ?? `Photo ${i + 1}`}
                    aria-current={isCurrent}
                    className="flex-none w-[72px] tablet:w-[104px] cursor-pointer transition-[transform,opacity] duration-150 ease-out"
                    style={{
                      transform: isCurrent ? 'translateY(-10px)' : `rotate(${i % 2 === 0 ? -3 : 3}deg)`,
                      opacity: isCurrent ? 1 : 0.6,
                    }}
                  >
                    <InstantPhoto src={screenshot.src} srcSet={screenshot.srcSet} alt="" photoAspect={4 / 3} hasTape={false} className="w-full" />
                  </button>
                );
              })}
            </div>
          </nav>
        ) : (
          <div data-closes className="h-6" />
        )}
      </div>
    </dialog>,
    document.body,
  );
}

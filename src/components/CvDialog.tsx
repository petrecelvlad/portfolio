import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, Eye, FileText, X } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { Button, BUTTON_COLORS } from '@/src/components/atoms/Button';
import { profile } from '@/src/adapters/secondary/profile';
import { cvFileName } from '@/src/core/domain/cv';
import { CATEGORIES } from '@/src/core/domain/skillTreeTypes';
import { getArcadeButtonColor } from '@/src/adapters/primary/components/skilltree/arcadeStyle';

/**
 * @propolis
 * {
 *   "role": "COMPONENT",
 *   "constraints": [
 *     "Nothing downloads until the visitor presses Download: the CV buttons only open this dialog (T-080)",
 *     "A native modal <dialog>, the same as PhotoViewer: Escape and a click outside close it",
 *     "Opening motion is transform/opacity through the browser (C-008), skipped under reduced motion (C-010)"
 *   ]
 * }
 */

const OPEN_MS = 200;
const CV_FILE = cvFileName(profile);
const CV_URL = `${import.meta.env.BASE_URL}${CV_FILE}`;
// The skill pills' yellow, so Preview stands out from the white card.
const PREVIEW_COLOR = getArcadeButtonColor(CATEGORIES.design);

export function CvDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isReducedMotion = useReducedMotion();
  const close = () => dialogRef.current!.close();

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    if (!isReducedMotion) {
      dialog.animate(
        { opacity: [0, 1], transform: ['translateY(12px) scale(0.97)', 'none'] },
        { duration: OPEN_MS, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      );
    }
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="cv-dialog-title"
      onClose={onClose}
      // The dialog box is the whole backdrop area's only child, so a click that lands on the
      // dialog element itself is a click outside the card.
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      className="w-[min(440px,calc(100vw-32px))] m-auto p-0 border-[3px] border-ink-base rounded-2xl bg-[#FFFDF7] text-ink-base shadow-[0_6px_0_var(--color-ink-base)] backdrop:bg-[rgba(28,22,16,0.6)]"
    >
      <div className="relative p-6 tablet:p-7 flex flex-col gap-4">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-[var(--radius-md)] text-ink-base cursor-pointer hover:bg-ink-base/10"
        >
          <X className="w-5 h-5" strokeWidth={2.5} aria-hidden />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <FileText className="w-7 h-7 flex-none" strokeWidth={2.25} aria-hidden />
          <h2 id="cv-dialog-title" className="m-0 text-xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Prefer a PDF?
          </h2>
        </div>

        <p className="m-0 text-sm leading-relaxed">
          I've also prepared a classic PDF version of my CV.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            href={CV_URL}
            target="_blank"
            rel="noopener"
            color={PREVIEW_COLOR}
            shape="chip"
            size="sm"
            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-ink-base"
          >
            <Eye className="w-4 h-4" strokeWidth={2.5} aria-hidden />
            Preview
          </Button>
          <Button
            href={CV_URL}
            download={CV_FILE}
            onClick={close}
            color={BUTTON_COLORS.periwinkle}
            shape="chip"
            size="sm"
            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-ink-base"
          >
            <Download className="w-4 h-4" strokeWidth={2.5} aria-hidden />
            Download
          </Button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

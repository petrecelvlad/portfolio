import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react';
import { IProject } from '@/src/core/domain/models';
import { useScreenTier } from '@/src/hooks/useScreenTier';

interface TimelineRailProps {
  projects: IProject[];
  activeIndex: number;
  isInFullView: boolean;
  onNavigate: (index: number) => void;
}

// Own-width percentage: the rail's center sits at most one width from the
// viewport's left edge, so -200% always clears it at every breakpoint.
const OFFSCREEN_X = '-200%';
// Motion runs `transform` strings on the GPU (x/y/scale run in JS), but its reduced-motion switch
// only covers x/y/scale, so every motion in this file checks the setting itself.
const RAIL_SLIDE: Transition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] };

function getProgress(activeIndex: number, projectCount: number): number {
  return projectCount > 1 ? activeIndex / (projectCount - 1) : 0;
}

// Persistent, viewport-fixed progress tracker: one dot per project, evenly
// spaced top-to-bottom, independent of the per-section snap-scroll (each
// project section is its own 100vh snap point, so only one used to ever be
// visible at a time). A dot is "passed" once its project has been reached —
// index <= activeIndex, same rule as the orchestrator's consumedNodes — and
// clicking any dot jumps straight to that section.
//
// Slides in from offscreen-left only once the project region fills the
// viewport. AnimatePresence freezes the exiting rail's last props, so its
// dots don't reset when activeIndex drops to -1 partway through the exit.
// A dedicated purple emboss, not the shared `--shadow-raised` token — that token's
// dark line is a warm near-black ink (rgba(36,26,16,0.3)), which is exactly what read
// as "grey/black" here. Same inset-highlight/inset-shadow shape, purple family both
// states: idle uses lilac/periwinkle-deep for a quiet ramp, passed uses lilac/
// periwinkle-darkest for a visibly richer one. The rgba values are those tokens
// (#D8B4FE, #7E22CE, #9333EA) at fixed alphas, not color-mix(): Chrome before 111
// drops the whole box-shadow over it, leaving the dots flat (see BentoSkills.tsx).
function RailDot({ isPassed, className }: { isPassed: boolean; className: string }) {
  const isReducedMotion = useReducedMotion();
  const emboss = isPassed
    ? 'inset 0 2px 0 0 rgba(216, 180, 254, 0.7), inset 0 -2px 0 0 rgba(126, 34, 206, 0.55)'
    : 'inset 0 2px 0 0 rgba(255, 255, 255, 0.6), inset 0 -2px 0 0 rgba(147, 51, 234, 0.35)';
  return (
    <motion.span
      className={`rounded-full border-[length:var(--border-width-sm)] transition-colors duration-300 ${
        isPassed ? 'bg-periwinkle border-periwinkle-deep' : 'bg-lilac border-periwinkle'
      } ${className}`}
      style={{ boxShadow: emboss }}
      animate={{ transform: `scale(${isPassed ? 1 : 0.92})` }}
      transition={isReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 14 }}
      whileHover={{ transform: 'scale(1.1)' }}
    />
  );
}

// Mobile: the same rail turned horizontal, pinned under the navbar over the page as it scrolls,
// sliding down from behind the navbar instead of in from the left. Dots are drawn at 16px; each
// one's tap area is its whole slice of the width, so all of them fit a phone.
function HorizontalRail({ projects, activeIndex, onNavigate }: Omit<TimelineRailProps, 'isInFullView'>) {
  const isReducedMotion = useReducedMotion();
  const halfSlice = `calc(100% / ${projects.length * 2})`;
  return (
    <motion.div
      key="timeline-rail-horizontal"
      className="fixed left-2 right-2 top-[var(--chrome-navbar-height)] h-11 z-40 pointer-events-none"
      initial={{ transform: 'translateY(-100%)' }}
      animate={{ transform: 'translateY(0%)' }}
      exit={{ transform: 'translateY(-100%)' }}
      transition={isReducedMotion ? { duration: 0 } : RAIL_SLIDE}
    >
      <div className="relative h-full flex">
        <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-lilac rounded-full" style={{ left: halfSlice, right: halfSlice }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 bg-periwinkle-deep rounded-full origin-left transition-transform duration-500 ease-out"
          style={{ left: halfSlice, right: halfSlice, transform: `scaleX(${getProgress(activeIndex, projects.length)})` }}
        />
        {projects.map((project, index) => (
          <button
            key={`${project.title}-${index}`}
            type="button"
            onClick={() => onNavigate(index)}
            aria-label={`Jump to ${project.title}`}
            aria-current={index === activeIndex}
            className="relative z-10 flex-1 flex items-center justify-center pointer-events-auto cursor-pointer"
          >
            <RailDot isPassed={index <= activeIndex} className="w-4 h-4" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function TimelineRail({ projects, activeIndex, isInFullView, onNavigate }: TimelineRailProps) {
  const isMobile = useScreenTier() === 'mobile';
  const isReducedMotion = useReducedMotion();
  const isShown = isInFullView && activeIndex !== -1;
  if (isMobile) {
    return (
      <AnimatePresence>
        {isShown && <HorizontalRail projects={projects} activeIndex={activeIndex} onNavigate={onNavigate} />}
      </AnimatePresence>
    );
  }
  return (
    <AnimatePresence>
      {isShown && (
        <motion.div
          key="timeline-rail"
          className="fixed left-[44px] top-0 h-screen -translate-x-1/2 z-40 pointer-events-none"
          initial={{ transform: `translateX(${OFFSCREEN_X})` }}
          animate={{ transform: 'translateX(0%)' }}
          exit={{ transform: `translateX(${OFFSCREEN_X})` }}
          transition={isReducedMotion ? { duration: 0 } : RAIL_SLIDE}
        >
          {/*
            --rail-inset is the exact distance from this container's top/bottom
            edge to the first/last dot's CENTER: the flex container's own
            vertical padding (py-24) plus half the dot button's own
            height (h-10) — the button is flush against the
            padding edge under justify-between, so its center sits exactly one
            half-height past the padding. The base/fill lines below used to hardcode
            top-4/bottom-4 (1rem) here, which only accounted for the button
            radius and ignored the padding entirely, leaving the line's endpoints
            ~4-6rem short of the actual first/last dot on every breakpoint.
            justify-between spaces every dot evenly between those two centers, so
            matching just the endpoints is enough to line up every dot in between.
          */}
          <div className="relative h-full flex flex-col items-center justify-between py-24 [--rail-inset:7.25rem]">
            {/* Base line spanning all dot centers. The line and button widths are px, not rem: the root
                font isn't 16px, so rem put the line's edges between pixels, and the GPU layer Chrome
                uses while scrolling rounds those differently from a normal paint (1px narrower). */}
            <div
              className="absolute w-[6px] -translate-x-1/2 left-1/2 bg-lilac rounded-full"
              style={{ top: 'var(--rail-inset)', bottom: 'var(--rail-inset)' }}
            />
            {/* Filled portion up to the active project */}
            <div
              className="absolute w-[6px] -translate-x-1/2 left-1/2 bg-periwinkle-deep rounded-full origin-top transition-transform duration-500 ease-out"
              style={{
                top: 'var(--rail-inset)',
                bottom: 'var(--rail-inset)',
                transform: `scaleY(${getProgress(activeIndex, projects.length)})`,
              }}
            />

            {projects.map((project, index) => (
              <button
                key={`${project.title}-${index}`}
                type="button"
                onClick={() => onNavigate(index)}
                aria-label={`Jump to ${project.title}`}
                aria-current={index === activeIndex}
                className="relative z-10 flex items-center justify-center w-[40px] h-10 pointer-events-auto cursor-pointer"
              >
                <RailDot isPassed={index <= activeIndex} className="w-[25px] h-[25px]" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

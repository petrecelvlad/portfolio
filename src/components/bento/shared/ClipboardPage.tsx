import { useMemo, useState, type ReactNode, type Ref } from 'react';
import { motion, useIsPresent, usePresenceData, useReducedMotion, type TargetAndTransition } from 'motion/react';
import { PAPER_COLOR, darken } from './palette';

// What brought a page in or is taking it away: a tab click flips pages over the clip, a project
// change tears the sheet off (later project) or drops a new one on (earlier project).
export interface PageTurn {
  kind: 'tab' | 'project';
  direction: 1 | -1;
}

interface PageLayers {
  page?: TargetAndTransition;
  faces?: TargetAndTransition;
  lift?: TargetAndTransition;
  shade?: TargetAndTransition;
}

interface PageArrival {
  initial: PageLayers;
  animate: PageLayers;
}

const PAPER_UNDERSHADOW = '2px 2px 0px rgba(43, 32, 22, 0.15)';
const PAPER_BACK_COLOR = darken(PAPER_COLOR, 6);
const FLIP_SECONDS = 0.64;
const FLIP_EASE = [0.5, 0.05, 0.3, 1] as const;

// Every page state is the same transform template, so Motion can always interpolate between any two.
function pageTransform({ x = 0, y = 0, rotate = 0, flip = 0, scale = 1 }: {
  x?: number; y?: number; rotate?: number; flip?: number; scale?: number;
}): string {
  return `translate(${x}%, ${y}%) rotate(${rotate}deg) rotateX(${flip}deg) scale(${scale})`;
}

const AT_REST = pageTransform({});
const HIDDEN = { opacity: 0 };
const SHOWN = { opacity: 1 };

function arrival(turn: PageTurn, isReducedMotion: boolean): PageArrival {
  if (isReducedMotion) {
    return { initial: { faces: HIDDEN }, animate: { faces: { opacity: 1, transition: { duration: 0.2 } } } };
  }
  if (turn.kind === 'tab' && turn.direction === 1) {
    return { initial: { shade: SHOWN }, animate: { shade: { opacity: 0, transition: { duration: 0.62, ease: 'easeOut' } } } };
  }
  if (turn.kind === 'tab') {
    const flipped = pageTransform({ flip: 178 });
    return {
      initial: { page: { transform: flipped }, faces: HIDDEN, lift: SHOWN },
      animate: {
        page: { transform: AT_REST, transition: { duration: FLIP_SECONDS, ease: FLIP_EASE } },
        faces: { opacity: [0, 1, 1], transition: { duration: FLIP_SECONDS, times: [0, 0.2, 1] } },
        lift: { opacity: 0, transition: { duration: FLIP_SECONDS, ease: 'easeIn' } },
      },
    };
  }
  if (turn.direction === 1) {
    return {
      initial: { page: { transform: pageTransform({ x: -1.2, y: 0.5, rotate: -2 }) } },
      animate: { page: { transform: AT_REST, transition: { duration: 0.38, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] } } },
    };
  }
  const raised = pageTransform({ y: -15, rotate: -4, scale: 1.03 });
  return {
    initial: { page: { transform: raised }, faces: HIDDEN },
    animate: {
      page: {
        transform: [raised, pageTransform({ y: 0.5, rotate: 0.4 }), AT_REST],
        transition: { duration: 0.48, times: [0, 0.75, 1], ease: [0.25, 0.7, 0.35, 1] },
      },
      faces: { opacity: [0, 1, 1], transition: { duration: 0.48, times: [0, 0.75, 1] } },
    },
  };
}

function departure(turn: PageTurn, isReducedMotion: boolean): PageLayers {
  if (isReducedMotion) return { faces: { opacity: 0, transition: { duration: 0.2 } } };
  if (turn.kind === 'tab' && turn.direction === 1) {
    return {
      page: { transform: [AT_REST, pageTransform({ flip: 178 })], transition: { duration: FLIP_SECONDS, ease: FLIP_EASE } },
      faces: { opacity: [1, 1, 0], transition: { duration: FLIP_SECONDS, times: [0, 0.8, 1] } },
      lift: { opacity: 1, transition: { duration: 0.32 } },
    };
  }
  if (turn.kind === 'tab') return { shade: { opacity: 1, transition: { duration: FLIP_SECONDS, ease: 'easeIn' } } };
  if (turn.direction === 1) {
    return {
      page: {
        transform: [AT_REST, pageTransform({ x: -2, y: -14, rotate: -4 }), pageTransform({ x: -8, y: -125, rotate: -11 })],
        transition: { duration: 0.56, times: [0, 0.35, 1], ease: [0.55, 0, 0.75, 0.45] },
      },
      faces: { opacity: [1, 1, 0], transition: { duration: 0.56, times: [0, 0.35, 1] } },
      lift: { opacity: 1, transition: { duration: 0.3 } },
    };
  }
  return { shade: { opacity: 0.8, transition: { duration: 0.46 } } };
}

// Every layer always has an exit, even one that leaves it where it is: Motion only watches an
// element's exit if it had one when it mounted, and the page waits on all of them before it's removed.
const STAYS: Required<PageLayers> = {
  page: { transform: AT_REST, transition: { duration: 0 } },
  faces: { opacity: 1, transition: { duration: 0 } },
  lift: { opacity: 0, transition: { duration: 0 } },
  shade: { opacity: 0, transition: { duration: 0 } },
};

// A later tab or project lifts the old page off the top of the pile; an earlier one lands on top of it.
function isLeavingOnTop(turn: PageTurn, isReducedMotion: boolean): boolean {
  return !isReducedMotion && turn.direction === 1;
}

const RULED_LINES = (ruleHeight: number) => `repeating-linear-gradient(
  to bottom,
  transparent, transparent ${ruleHeight - 1}px,
  var(--color-rule-soft) ${ruleHeight - 1}px, var(--color-rule-soft) ${ruleHeight}px
)`;

interface ClipboardPageProps {
  ref?: Ref<HTMLDivElement>;
  ruleHeight: number;
  children: ReactNode;
}

// One sheet of the clipboard: a ruled front and a plain back, so it can turn over the clip.
// The page's turn comes from its AnimatePresence `custom`: the one that brought it in is kept for
// its arrival, the one that takes it away is captured once it starts leaving, so a quick run of
// turns never rewrites a page that is already on its way out.
export function ClipboardPage({ ref, ruleHeight, children }: ClipboardPageProps) {
  const latestTurn: PageTurn = usePresenceData();
  const isPresent = useIsPresent();
  const isReducedMotion = useReducedMotion() ?? false;
  const [arrivalTurn] = useState(latestTurn);
  const [departureTurn, setDepartureTurn] = useState<PageTurn | null>(null);
  if (isPresent && departureTurn) setDepartureTurn(null);
  if (!isPresent && !departureTurn) setDepartureTurn(latestTurn);

  const { initial, animate } = useMemo(() => arrival(arrivalTurn, isReducedMotion), [arrivalTurn, isReducedMotion]);
  const exit = useMemo(
    () => ({ ...STAYS, ...(departureTurn ? departure(departureTurn, isReducedMotion) : {}) }),
    [departureTurn, isReducedMotion],
  );
  const isOnTop = departureTurn
    ? isLeavingOnTop(departureTurn, isReducedMotion)
    : !isLeavingOnTop(arrivalTurn, isReducedMotion);

  return (
    <motion.div
      ref={ref}
      className="relative tablet:absolute tablet:inset-0"
      style={{ transformStyle: 'preserve-3d', transformOrigin: '50% 0', zIndex: isOnTop ? 2 : 1 }}
      initial={initial.page ?? { transform: AT_REST }}
      animate={animate.page ?? { transform: AT_REST }}
      exit={exit.page}
    >
      {/* Opacity on the turning page itself would flatten its 3D, so the faces fade instead. */}
      <motion.div
        data-ruled-page
        className="relative h-full p-6 md:p-8 overflow-hidden flex flex-col border-[1.5px] border-ink-base"
        style={{
          backfaceVisibility: 'hidden',
          backgroundColor: PAPER_COLOR,
          // The ruled lines start at the padding edge, the same place the text does, so every
          // text block that keeps to RULE_HEIGHT steps stays on the lines.
          backgroundImage: RULED_LINES(ruleHeight),
          boxShadow: PAPER_UNDERSHADOW,
        }}
        initial={initial.faces ?? SHOWN}
        animate={animate.faces ?? SHOWN}
        exit={exit.faces}
      >
        {children}
        <motion.div
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-[rgba(43,32,22,0.3)]"
          initial={initial.lift ?? HIDDEN}
          animate={animate.lift ?? HIDDEN}
          exit={exit.lift}
          aria-hidden
        />
        <motion.div
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[rgba(43,32,22,0.42)] to-[rgba(43,32,22,0.1)]"
          initial={initial.shade ?? HIDDEN}
          animate={animate.shade ?? HIDDEN}
          exit={exit.shade}
          aria-hidden
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 border-[1.5px] border-ink-base"
        style={{ backfaceVisibility: 'hidden', backgroundColor: PAPER_BACK_COLOR, transform: 'rotateX(180deg)' }}
        initial={initial.faces ?? SHOWN}
        animate={animate.faces ?? SHOWN}
        exit={exit.faces}
        aria-hidden
      />
    </motion.div>
  );
}

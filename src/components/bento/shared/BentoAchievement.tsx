
import { Trophy } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'motion/react';
import { Row } from '../../atoms/Row';
import { Text } from '../../atoms/Text';
import { AchievementSlotProps } from '../ports';
import { SWAP_DELAY, useProjectSwap } from '../projectSwap';

type SwapMotion = Record<'initial' | 'animate' | 'exit', TargetAndTransition>;

// A project swap brings the new achievement in like a game's "achievement unlocked" popup: it
// slides in from the right, overshoots a touch, and a shine sweeps across it.
const UNLOCK: SwapMotion = {
  initial: { transform: 'translateX(115%)' },
  animate: {
    transform: ['translateX(115%)', 'translateX(-1.5%)', 'translateX(0%)'],
    transition: { duration: 0.52, times: [0, 0.72, 1], ease: [0.2, 0.8, 0.3, 1] },
  },
  exit: {
    transform: 'translateX(-5%)',
    opacity: 0,
    transition: { duration: 0.15, delay: SWAP_DELAY.achievement, ease: 'easeIn' },
  },
};

function fade(restingOpacity: number): SwapMotion {
  return {
    initial: { opacity: 0 },
    animate: { opacity: restingOpacity, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };
}

export function BentoAchievement({ achievement }: AchievementSlotProps) {
  const swap = useProjectSwap();
  const isReducedMotion = useReducedMotion();
  const isEmpty = !achievement;
  const swapMotion = isReducedMotion ? fade(isEmpty ? 0.4 : 1) : UNLOCK;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={swap.key}
        className={`relative overflow-hidden border-[length:var(--border-width-sm)] border-ink-base px-4 py-3 rounded-xl shadow-[var(--shadow-raised)] ${isEmpty ? 'bg-surface-base border-dashed opacity-40' : 'bg-[var(--role-achievement-accent)]'}`}
        initial={swapMotion.initial}
        animate={swapMotion.animate}
        exit={swapMotion.exit}
      >
        <Row gap="sm" align="center">
          <div className="flex-shrink-0 flex items-center justify-center">
            <Trophy size={20} className="text-ink-base" />
          </div>
          <Row gap="sm" align="baseline" wrap>
            <Text variant="mono" size="sm" className="text-xs font-black uppercase tracking-tighter text-ink-base">Achievement:</Text>
            <Text variant="body" size="sm" className="font-bold text-ink-base">
              {isEmpty ? '' : achievement}
            </Text>
          </Row>
        </Row>
        {swap.direction !== 0 && !isReducedMotion && !isEmpty && (
          <motion.div
            className="absolute -inset-y-2 left-0 w-2/5 pointer-events-none bg-gradient-to-r from-transparent via-white/75 to-transparent"
            initial={{ transform: 'translateX(-130%) skewX(-20deg)' }}
            animate={{ transform: 'translateX(280%) skewX(-20deg)' }}
            transition={{ duration: 0.65, delay: 0.4, ease: 'easeInOut' }}
            aria-hidden
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

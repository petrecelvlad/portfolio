
import { Trophy } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'motion/react';
import { Row } from '../../atoms/Row';
import { Text } from '../../atoms/Text';
import { AchievementSlotProps } from '../ports';
import { SWAP_DELAY, useProjectSwap } from '../projectSwap';

type SwapMotion = Record<'initial' | 'animate' | 'exit', TargetAndTransition>;

// A project swap stamps the new achievement down: it lands oversized and tilted, squashes a touch
// past its size, then settles.
function stamp(restingOpacity: number): SwapMotion {
  return {
    initial: { transform: 'scale(1.35) rotate(-4deg)', opacity: 0 },
    animate: {
      transform: ['scale(1.35) rotate(-4deg)', 'scale(0.96) rotate(0deg)', 'scale(1) rotate(0deg)'],
      opacity: [0, restingOpacity, restingOpacity],
      transition: { duration: 0.38, times: [0, 0.6, 1], ease: [0.3, 0.7, 0.4, 1] },
    },
    exit: { opacity: 0, transition: { duration: 0, delay: SWAP_DELAY.achievement } },
  };
}

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
  const restingOpacity = isEmpty ? 0.4 : 1;
  const swapMotion = isReducedMotion ? fade(restingOpacity) : stamp(restingOpacity);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={swap.key}
        className={`relative border-[length:var(--border-width-sm)] border-ink-base px-4 py-3 rounded-xl shadow-[var(--shadow-raised)] ${isEmpty ? 'bg-surface-base border-dashed opacity-40' : 'bg-[var(--role-achievement-accent)]'}`}
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
      </motion.div>
    </AnimatePresence>
  );
}

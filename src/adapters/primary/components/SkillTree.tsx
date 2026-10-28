import { motion } from 'motion/react';
import { WoodBackground } from '@/src/components/bento/shared/WoodBackground';
import type { IExperience } from '@/src/core/domain/models';
import { SkillTreeBoard } from './skilltree/SkillTreeBoard';
import { SkillTreeMobile } from './skilltree/SkillTreeMobile';
import { useSkillTreeState } from '@/src/hooks/useSkillTreeState';
import { useScreenTier } from '@/src/hooks/useScreenTier';

export function SkillTree({ experiences }: { experiences: IExperience[] }) {
  const state = useSkillTreeState(experiences);
  const isMobile = useScreenTier() === 'mobile';

  return (
    <motion.section
      className="relative z-0 flex-1 w-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <WoodBackground />
      </div>
      {isMobile ? <SkillTreeMobile {...state} /> : <SkillTreeBoard {...state} />}
    </motion.section>
  );
}

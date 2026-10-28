import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { GamifiedParchmentPanel } from '@/src/components/bento/skins/gamified/GamifiedParchmentPanel';
import { Skill, SkillCategory, CATEGORIES } from '@/src/core/domain/skillTreeTypes';
import { SkillExperienceBar } from './SkillExperienceBar';

export interface SkillDetailsPanelProps {
  skill: Skill | null;
  /** The category badge selected directly, rather than a skill within it — mutually exclusive with `skill`. */
  category: SkillCategory | null;
  skillMonths: Map<string, number>;
  careerMonths: number;
  className?: string;
}

export function getSkillDetails(skill: Skill | null, category: SkillCategory | null) {
  return skill !== null
    ? { key: skill.id, title: skill.name, descriptionLabel: null, description: skill.description }
    : { key: `category-${category}`, title: CATEGORIES[category!].label, descriptionLabel: 'DISCIPLINE OVERVIEW:', description: CATEGORIES[category!].description };
}

export function SkillDetailsPanel({ skill, category, skillMonths, careerMonths, className = '' }: SkillDetailsPanelProps) {
  const { key, title, descriptionLabel, description } = getSkillDetails(skill, category);

  return (
    <div className="flex flex-col w-full mt-4">
      <GamifiedParchmentPanel className={`w-full ${className}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            <div className="font-display font-black text-xl md:text-2xl leading-tight text-[#1C1610] uppercase tracking-wide">
              {title}
            </div>

            <div className="h-px border-b border-dashed border-[#B89C6C] my-2" />

            {skill !== null && (
              <div className="my-1">
                <SkillExperienceBar skill={skill} months={skillMonths.get(skill.id)!} careerMonths={careerMonths} />
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#F0E2C3] border border-[#D4C096] text-[#2C1A0E] flex flex-col gap-1 shadow-inner my-2">
              {descriptionLabel !== null && (
                <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-[#451A03]">
                  {descriptionLabel}
                </span>
              )}
              <p className="font-body text-base leading-relaxed text-[#2C1A0E]">
                {description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </GamifiedParchmentPanel>
    </div>
  );
}


/**
 * @propolis
 * {
 *   "role": "UI_COMPONENT",
 *   "constraints": [
 *     "C-008: the on-path dot pulses with Tailwind's animate-pulse (CSS opacity)",
 *     "C-010: the pulse stops through index.css's reduced-motion rule"
 *   ],
 *   "agent_instructions": "A skill pill. The pulsing dot runs nonstop while its skill is on the selected path; any other motion added here follows C-008."
 * }
 */
import React from 'react';
import { Skill, CATEGORIES } from '@/src/core/domain/skillTreeTypes';
import { SKILL_ICONS } from '@/src/core/domain/skillIcons';
import { getArcadeButtonColor, getArcadeHighlight, getArcadeOutlineStyle } from './arcadeStyle';
import { Button } from '@/src/components/atoms/Button';
import { PILL_W, PILL_H } from '@/src/core/domain/skillTreeGeometry';

export function Dots({ level, large }: { level: number; large?: boolean }) {
  return (
    <span className="flex gap-[2px] items-center flex-shrink-0">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`leading-none ${large ? 'text-sm' : 'text-[7px]'} ${i <= level ? 'text-ink-base' : 'text-ink-base/20'}`}
        >●</span>
      ))}
    </span>
  );
}

export interface SkillPillProps {
  skill: Skill;
  active: boolean;
  isOnPath: boolean;
  onSelect: (s: Skill) => void;
  depth: number;
  /** Fills its container's width at a touch-sized height (mobile list) instead of the tree's fixed pill size. */
  fluid?: boolean;
}

export function SkillPill({
  skill,
  active,
  isOnPath,
  onSelect,
  fluid = false,
}: SkillPillProps) {
  const Icon = SKILL_ICONS[skill.name];
  const catConfig = CATEGORIES[skill.category];
  const state = active ? 'active' : isOnPath ? 'onPath' : 'default';

  return (
    <Button
      onClick={() => onSelect(skill)}
      color={getArcadeButtonColor(catConfig)}
      shape="chip"
      size="sm"
      highlight={getArcadeHighlight(state)}
      className={`
        flex-shrink-0 flex items-center gap-2 px-2.5
        text-left relative overflow-hidden select-none
        ${active ? 'z-10' : isOnPath ? 'z-1 scale-[1.02]' : ''}
      `}
      style={{ width: fluid ? '100%' : PILL_W, height: fluid ? 40 : PILL_H, ...getArcadeOutlineStyle(catConfig, state) }}
    >
      <Icon
        size={16}
        strokeWidth={2.5}
        className="flex-shrink-0 text-ink-base -mt-[1px]"
      />

      <span className="font-jersey text-[16px] uppercase leading-none flex-1 min-w-0 truncate text-ink-base -mt-[1px]">
        {skill.name}
      </span>

      {isOnPath && !active && (
        <span className="w-2 h-2 rounded-full flex-shrink-0 bg-white animate-pulse -mt-[1px]" />
      )}
    </Button>
  );
}

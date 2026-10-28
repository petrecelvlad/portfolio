import { CATEGORIES, type Skill } from '@/src/core/domain/skillTreeTypes';
import { formatMonthsShort } from '@/src/core/domain/career';

export interface SkillExperienceBarProps {
  skill: Skill;
  months: number;
  /** A full bar: the whole career so far. */
  careerMonths: number;
}

export function SkillExperienceBar({ skill, months, careerMonths }: SkillExperienceBarProps) {
  const label = formatMonthsShort(months);
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative flex-1 h-3.5 rounded-full border-2 border-[#1C1610] bg-[#F0E2C3] overflow-hidden"
        role="img"
        aria-label={`${label} of a ${formatMonthsShort(careerMonths)} career`}
      >
        <div
          className="absolute inset-y-0 left-0 border-r-2 border-[#1C1610]"
          style={{ width: `${(months / careerMonths) * 100}%`, background: CATEGORIES[skill.category].bgBase }}
        />
      </div>
      <span className="flex-none font-mono font-bold text-sm text-[#1C1610]" aria-hidden>{label}</span>
    </div>
  );
}

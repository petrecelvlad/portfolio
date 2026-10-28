import { ChevronLeft } from 'lucide-react';
import { GamifiedBoard } from '@/src/components/bento/skins/gamified/GamifiedBoard';
import { CATEGORIES, type Skill } from '@/src/core/domain/skillTreeTypes';
import {
  CATEGORY_ORDER, getActivePathNodeIds, getChildSkills, getParentSkill, getRootSkills,
} from '@/src/core/domain/skillTreeGeometry';
import type { SkillTreeState } from '@/src/hooks/useSkillTreeState';
import { Button, BUTTON_COLORS } from '@/src/components/atoms/Button';
import { SkillPill } from './SkillTreeNode';
import { getSkillDetails } from './SkillDetailsPanel';
import { SkillExperienceBar } from './SkillExperienceBar';
import { getArcadeButtonColor, getArcadeHighlight, getArcadeOutlineStyle } from './arcadeStyle';

// Phones: one column of the tree at a time. The listed column is the selected skill's children, or
// its siblings when it has none, so drilling in and stepping back are ordinary selections and the
// shared selection state (useSkillTreeState) stays the only state. The selection's details sit in
// a sheet docked at the bottom of the board, without the project photos: they are too small to read
// at this width. At least one screen tall; a long column or a short
// screen (a phone held sideways) makes the section taller instead of scrolling inside it.
export function SkillTreeMobile({ activeSkill, activeCategory, careerMonths, skillMonths, handleSelect, handleSelectCategory }: SkillTreeState) {
  const category = activeCategory ?? activeSkill!.category;
  const focus = activeSkill === null ? null : getChildSkills(activeSkill.id).length > 0 ? activeSkill : getParentSkill(activeSkill);
  const listed = focus === null ? getRootSkills(category) : getChildSkills(focus.id);
  const pathIds = getActivePathNodeIds(activeSkill);
  const focusParent = focus === null ? null : getParentSkill(focus);
  const breadcrumb: Skill[] = [];
  for (let s = focus; s !== null; s = getParentSkill(s)) breadcrumb.unshift(s);
  const details = getSkillDetails(activeSkill, activeCategory);

  const pillState = (id: string) => ({ active: activeSkill?.id === id, isOnPath: pathIds.has(id) });

  return (
    <div className="relative flex-1 w-full flex flex-col px-[var(--tier-gutter)] py-[var(--tier-gutter-y)]">
      <GamifiedBoard className="flex-1" contentClassName="p-2" fillHeight>
        <div className="self-stretch flex-1 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORY_ORDER.map(cat => {
              const state = activeCategory === cat ? 'active' : cat === category ? 'onPath' : 'default';
              return (
                <Button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  color={getArcadeButtonColor(CATEGORIES[cat])}
                  shape="chip"
                  size="sm"
                  highlight={getArcadeHighlight(state)}
                  className={`h-9 flex items-center justify-center font-jersey text-[16px] uppercase leading-none text-ink-base ${cat === category ? '' : 'opacity-60'}`}
                  style={getArcadeOutlineStyle(CATEGORIES[cat], state)}
                >
                  {CATEGORIES[cat].label}
                </Button>
              );
            })}
          </div>

          {focus !== null && (
            <>
              <div className="flex items-center gap-2.5">
                <Button
                  onClick={() => (focusParent === null ? handleSelectCategory(category) : handleSelect(focusParent))}
                  color={BUTTON_COLORS.white}
                  className="text-ink-base"
                  aria-label="Back"
                >
                  <ChevronLeft size={18} strokeWidth={3} />
                </Button>
                <span className="font-jersey text-[18px] uppercase leading-none text-ink-base">
                  {focusParent?.name ?? CATEGORIES[category].label}
                </span>
              </div>
              <div className="font-body font-bold text-[11px] uppercase tracking-wider text-ink-subtle truncate">
                {[CATEGORIES[category].label, ...breadcrumb.map(s => s.name)].join(' › ')}
              </div>
              <SkillPill skill={focus} {...pillState(focus.id)} onSelect={handleSelect} depth={0} fluid />
            </>
          )}

          <div className="flex-1 pt-1 pb-2">
            <ul className="relative flex flex-col gap-2 pl-6">
              <span className="absolute left-2 top-0 bottom-5 w-[5px] rounded-full bg-ink-base" aria-hidden />
              {listed.map(skill => (
                <li key={skill.id} className="relative">
                  <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-[5px] w-4 bg-ink-base" aria-hidden />
                  <SkillPill skill={skill} {...pillState(skill.id)} onSelect={handleSelect} depth={0} fluid />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-none flex flex-col gap-2 rounded-2xl border-[3px] border-[#1C1610] bg-[#F3E3C3] shadow-[var(--shadow-raised)] p-4">
            <div className="font-display font-black text-xl leading-tight text-[#1C1610] uppercase tracking-wide">
              {details.title}
            </div>
            {activeSkill !== null && (
              <SkillExperienceBar skill={activeSkill} months={skillMonths.get(activeSkill.id)!} careerMonths={careerMonths} />
            )}
            {details.descriptionLabel !== null && (
              <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-[#451A03]">
                {details.descriptionLabel}
              </span>
            )}
            <p className="font-body text-sm leading-snug text-[#2C1A0E]">{details.description}</p>
          </div>
        </div>
      </GamifiedBoard>
    </div>
  );
}

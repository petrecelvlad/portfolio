import { useState, useMemo } from 'react';
import { Skill, SkillCategory, SKILLS } from '@/src/core/domain/skillTreeTypes';
import type { IExperience, IProject } from '@/src/core/domain/models';
import { DomainEventBus } from '@/src/core/events/DomainEventBus';
import { getNextExpandedSkillIds } from '@/src/core/domain/skillTreeGeometry';
import { getCareerMonths, getMonthsCovered } from '@/src/core/domain/career';

const DEFAULT_SKILL = SKILLS.find(s => s.id === 'system-design')!;

export type SkillTreeState = ReturnType<typeof useSkillTreeState>;

export function useSkillTreeState(experiences: IExperience[]) {
  const [activeSkill, setActiveSkill] = useState<Skill | null>(DEFAULT_SKILL);
  // The category badge (DESIGN/PRODUCTION/LEADERSHIP) itself, when selected
  // directly rather than a skill within it — mutually exclusive with
  // activeSkill (selecting either clears the other). Not a node in the
  // SKILLS/depth graph at all (it sits outside TreeCanvas entirely, see
  // SkillTree.tsx), so it's tracked as its own separate piece of state
  // rather than shoehorned into `Skill`.
  const [activeCategory, setActiveCategory] = useState<SkillCategory | null>(null);
  // Which skills currently have their direct children revealed in the tree:
  // always one root-to-skill path (see getNextExpandedSkillIds). Starts with
  // DEFAULT_SKILL so the default selection is identical to having clicked it.
  const [expandedSkillIds, setExpandedSkillIds] = useState<Set<string>>(() => new Set([DEFAULT_SKILL.id]));

  const projectsById = useMemo(() => {
    const map = new Map<string, IProject>();
    for (const exp of experiences) {
      for (const project of exp.projects) map.set(project.id, project);
    }
    return map;
  }, [experiences]);

  const { careerMonths, skillMonths } = useMemo(() => {
    const now = new Date();
    const months = new Map<string, number>();
    for (const skill of SKILLS) {
      const projects = skill.projects.map(id => {
        const project = projectsById.get(id);
        if (project === undefined) throw new Error(`Skill "${skill.id}" lists unknown project "${id}"`);
        return project;
      });
      months.set(skill.id, getMonthsCovered(projects, now));
    }
    return { careerMonths: getCareerMonths(now), skillMonths: months };
  }, [projectsById]);

  const handleSelect = (skill: Skill) => {
    setActiveCategory(null);
    setActiveSkill(skill);
    DomainEventBus.publish({
      type: 'NODE_SELECTED',
      timestamp: Date.now(),
      payload: {
        nodeId: skill.id,
        nodeName: skill.name,
        category: skill.category,
      },
    });
    setExpandedSkillIds(prev => getNextExpandedSkillIds(prev, skill));
  };

  // Selecting the category badge itself always fully collapses the tree —
  // it sits outside the depth graph (nothing is its ancestor/descendant to
  // check "inside vs outside the current branch" against, unlike
  // getNextExpandedSkillIds' rule for skill-to-skill selections), so
  // "collapse everything" is the only sensible behavior here.
  const handleSelectCategory = (category: SkillCategory) => {
    setActiveSkill(null);
    setActiveCategory(category);
    setExpandedSkillIds(new Set());
  };

  return {
    activeSkill,
    activeCategory,
    expandedSkillIds,
    projectsById,
    careerMonths,
    skillMonths,
    handleSelect,
    handleSelectCategory,
  };
}

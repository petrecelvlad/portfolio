import type { CSSProperties } from 'react';
import type { CategoryConfig } from '@/src/core/domain/skillTreeTypes';
import type { ButtonColor } from '@/src/components/atoms/Button';

export type PillState = 'default' | 'onPath' | 'active';

// Skill pills and category badges are standard raised Buttons (components/atoms/Button.tsx) in their
// category's colors; only the selection state is skill-tree-specific: a brighter bevel highlight and
// an outline (white when active, the category's light tint when on the selected path).
export function getArcadeButtonColor(cat: CategoryConfig): ButtonColor {
  return { fill: cat.bgBase, deep: cat.bgBottom };
}

export function getArcadeHighlight(state: PillState): number {
  return state === 'active' ? 0.7 : state === 'onPath' ? 0.6 : 0.5;
}

export function getArcadeOutlineStyle(cat: CategoryConfig, state: PillState): CSSProperties {
  return {
    outline: state === 'active' ? '2px solid #FFFFFF' : state === 'onPath' ? `2px solid ${cat.bgTop}` : 'none',
    outlineOffset: '0px',
  };
}

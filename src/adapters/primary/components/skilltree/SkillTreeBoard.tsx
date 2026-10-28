import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { GamifiedBoard } from '@/src/components/bento/skins/gamified/GamifiedBoard';
import { CATEGORIES } from '@/src/core/domain/skillTreeTypes';
import {
  BADGE_W, CATEGORY_GAP, CATEGORY_ORDER, DEFAULT_SPACING, PILL_H,
  computeLayouts, fitTreeSpacing, treeWidth,
} from '@/src/core/domain/skillTreeGeometry';
import type { SkillTreeState } from '@/src/hooks/useSkillTreeState';
import { Button } from '@/src/components/atoms/Button';
import { ScaleToFit } from '@/src/components/layout/ScaleToFit';
import { TreeCanvas } from './SkillTreeConnections';
import { SkillDetailsPanel } from './SkillDetailsPanel';
import { SkillProjectPhotos } from './SkillProjectPhotos';
import { getArcadeButtonColor, getArcadeHighlight, getArcadeOutlineStyle } from './arcadeStyle';

const BADGE_H = 72;

function readPx(el: Element, name: string): number {
  return parseFloat(getComputedStyle(el).getPropertyValue(name));
}

// Tablet and up: the board beside the details column, or above it on an upright screen. The tree's
// gaps stretch to fill the board within the tier's bounds (index.css); the details column takes
// what the board leaves once the full tree has its minimum gaps, clamped to the tier's own bounds.
export function SkillTreeBoard({ activeSkill, activeCategory, expandedSkillIds, projectsById, careerMonths, skillMonths, handleSelect, handleSelectCategory }: SkillTreeState) {
  const boardColumnRef = useRef<HTMLDivElement>(null);
  const [spacing, setSpacing] = useState(DEFAULT_SPACING);
  const [boardMinWidth, setBoardMinWidth] = useState<number>();
  const layouts = useMemo(() => computeLayouts(spacing), [spacing]);

  const handleFrameResize = (frame: HTMLElement) => {
    const bounds = {
      padX: readPx(frame, '--skilltree-pad'),
      gapXMin: readPx(frame, '--skilltree-gap-min'),
      gapXMax: readPx(frame, '--skilltree-gap-max'),
      gapYMax: readPx(frame, '--skilltree-row-gap-max'),
    };
    const next = fitTreeSpacing(frame.clientWidth, frame.clientHeight, bounds);
    setSpacing(prev => (prev.gapX === next.gapX && prev.gapY === next.gapY ? prev : next));
    // The first call comes from ScaleToFit's mount, before this ancestor's ref is attached; its
    // ResizeObserver calls again right after.
    if (boardColumnRef.current === null) return;
    const boardChrome = boardColumnRef.current.offsetWidth - frame.clientWidth;
    setBoardMinWidth(treeWidth(bounds.gapXMin, bounds.padX) + boardChrome);
  };

  const treeRows = CATEGORY_ORDER.map(cat => {
    const isCategoryOnPath = activeSkill !== null && activeSkill.category === cat;
    const isCategorySelected = activeCategory === cat;
    const badgeState = isCategorySelected ? 'active' : isCategoryOnPath ? 'onPath' : 'default';
    const CategoryIcon = CATEGORIES[cat].icon;

    return (
      <div key={cat} className="flex items-start">
        <Button
          onClick={() => handleSelectCategory(cat)}
          color={getArcadeButtonColor(CATEGORIES[cat])}
          shape="chip"
          size="sm"
          highlight={getArcadeHighlight(badgeState)}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 text-ink-base select-none relative z-10 overflow-hidden"
          style={{
            width: BADGE_W,
            height: BADGE_H,
            // Centered on the anchor connector, which leaves the badge at the roots' mean row center.
            marginTop: layouts[cat].rootTop + PILL_H / 2 - BADGE_H / 2,
            ...getArcadeOutlineStyle(CATEGORIES[cat], badgeState),
          }}
        >
          <CategoryIcon size={26} strokeWidth={2.5} />
          <span className="font-jersey text-[16px] uppercase leading-none">{CATEGORIES[cat].label}</span>
        </Button>

        <TreeCanvas
          category={cat}
          layout={layouts[cat]}
          activeSkill={activeSkill}
          expandedSkillIds={expandedSkillIds}
          onSelect={handleSelect}
        />
      </div>
    );
  });

  return (
    <div
      className="relative flex-1 min-h-0 w-full flex flex-row tablet:portrait:flex-col gap-[var(--tier-column-gap)] px-[var(--tier-gutter)] py-[var(--tier-gutter-y)]"
      style={{ '--skilltree-board-min-width': boardMinWidth === undefined ? undefined : `${boardMinWidth}px` } as CSSProperties}
    >
      <div ref={boardColumnRef} className="flex-1 min-w-0 min-h-0 flex flex-col">
        <GamifiedBoard className="flex-1 min-h-0" contentClassName="p-1" fillHeight bannerTitle="Skilltree">
          <ScaleToFit className="flex-1 min-h-0 self-stretch" onFrameResize={handleFrameResize}>
            <div className="flex flex-col px-[var(--skilltree-pad)]" style={{ gap: CATEGORY_GAP }}>
              {treeRows}
            </div>
          </ScaleToFit>
        </GamifiedBoard>
      </div>

      <div className="flex flex-col flex-shrink-0 w-[clamp(var(--skilltree-details-min-width),calc(100%_-_var(--skilltree-board-min-width,0px)_-_var(--tier-column-gap)),var(--skilltree-details-max-width))] tablet:portrait:w-full tablet:portrait:h-[38%]">
        <SkillDetailsPanel className="min-h-[336px] tablet:portrait:min-h-0" skill={activeSkill} category={activeCategory} skillMonths={skillMonths} careerMonths={careerMonths} />
        <SkillProjectPhotos className="flex-1 min-h-0" skill={activeSkill} projectsById={projectsById} />
      </div>
    </div>
  );
}

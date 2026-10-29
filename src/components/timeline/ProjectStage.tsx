import { useMemo, useState } from 'react';
import { ITimelineProject } from '@/src/core/domain/models';
import { ProjectDetails } from '@/src/components/timeline/ProjectDetails';
import { WoodBackground } from '@/src/components/bento/shared/WoodBackground';
import { ProjectSwapProvider, type ProjectSwap, type SwapDirection } from '@/src/components/bento/projectSwap';

interface ProjectStageProps {
  project: ITimelineProject;
  index: number;
  showDetailsHint: boolean;
}

// The persistent Project Viewer shell (cone/project/architecture/systems/PROJECT_VIEWER.md).
// Mounted ONCE by Timeline.tsx as a `position: sticky` overlay spanning the whole project list's
// scroll range; it just renders whichever `project` it's handed.
//
// Phase 2: the content stays mounted across project changes too, so each piece can animate from
// the old project to the new one. The swap (which project, which way the visitor moved) goes down
// through ProjectSwapProvider; every piece that keeps per-project state resets it when the swap's
// key changes, and the pieces that animate run their own exit and entry from it.
export function ProjectStage({ project, index, showDetailsHint }: ProjectStageProps) {
  const [shown, setShown] = useState<{ index: number; direction: SwapDirection }>({ index, direction: 0 });
  if (shown.index !== index) {
    setShown({ index, direction: index > shown.index ? 1 : -1 });
  }
  const swap = useMemo<ProjectSwap>(() => ({ key: project.id, direction: shown.direction }), [project.id, shown.direction]);

  return (
    <div className="relative z-0 h-full w-full flex">
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <WoodBackground />
      </div>

      {/* Left column: spacer, keeps content clear of the fixed TimelineRail. */}
      <div className="w-[88px] flex-shrink-0 relative pointer-events-none" />

      {/* Right column: content */}
      <div className="relative z-0 flex-grow h-full pt-[24px] pb-5 pr-4 min-w-0 flex flex-col justify-start">
        <div className="w-full h-full mx-auto overflow-hidden flex items-start justify-center pointer-events-auto">
          <div className="w-full h-full flex flex-col justify-start min-h-0">
            <ProjectSwapProvider value={swap}>
              <ProjectDetails project={project} isActive showDetailsHint={showDetailsHint} />
            </ProjectSwapProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

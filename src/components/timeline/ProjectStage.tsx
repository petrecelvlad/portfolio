import { ITimelineProject } from '@/src/core/domain/models';
import { ProjectDetails } from '@/src/components/timeline/ProjectDetails';
import { WoodBackground } from '@/src/components/bento/shared/WoodBackground';

interface ProjectStageProps {
  project: ITimelineProject;
  showDetailsHint: boolean;
}

// The persistent Project Viewer shell — Phase 1 of
// cone/project/architecture/systems/PROJECT_VIEWER.md. Mounted ONCE by
// Timeline.tsx as a `position: sticky` overlay spanning the whole project
// list's scroll range. This component doesn't know or care about scroll
// position — it just renders whichever `project` it's handed. The
// background/clipboard/phone/notes/banner chrome never remounts as the user
// scrolls between projects; only this component's `project` prop changes,
// swapping the content inside the same mounted DOM tree.
//
// `key={project.id}` on ProjectDetails below is deliberate, not incidental:
// without it, BentoResponsibilities' internal page-tab state (and any other
// per-project local state deeper in the tree) would persist across a
// project change, since React would see "the same component, new props"
// rather than "a different project" — e.g. leaving the clipboard on page 3
// when scrolling from a project you'd flipped ahead on into the next one.
// Keying on the project forces a clean remount of the content subtree (but
// not this shell) on every swap, which for Phase 1's "instant swap, no
// animation" posture is exactly the right amount of continuity: the frame
// stays, the content starts fresh.
export function ProjectStage({ project, showDetailsHint }: ProjectStageProps) {
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
            <ProjectDetails key={project.id} project={project} isActive showDetailsHint={showDetailsHint} />
          </div>
        </div>
      </div>
    </div>
  );
}

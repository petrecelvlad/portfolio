import { useEffect, useMemo, Ref, RefObject } from 'react';
import { IExperience } from '@/src/core/domain/models';
import { useTimelineOrchestrator, PageSection, PageSectionRefs } from '@/src/hooks/useTimelineOrchestrator';
import { TimelineRail } from '@/src/components/timeline/TimelineRail';
import { ProjectStage } from '@/src/components/timeline/ProjectStage';
import { ProjectDetails } from '@/src/components/timeline/ProjectDetails';
import { WoodBackground } from '@/src/components/bento/shared/WoodBackground';
import { useScreenTier } from '@/src/hooks/useScreenTier';

interface TimelineProps {
  experiences: IExperience[];
  containerRef: RefObject<HTMLDivElement>;
  sectionRefs: PageSectionRefs;
  onActiveSectionChange: (section: PageSection) => void;
  ref?: Ref<HTMLDivElement>;
}

// Phase 1 of cone/project/architecture/systems/PROJECT_VIEWER.md: the
// project region is one persistent shell (ProjectStage) whose content swaps
// on scroll, not N independent scrollable cards. Two layers share the same
// grid cell ([grid-area:1/1], both children — CSS Grid explicitly supports
// overlapping children this way, unlike normal block flow):
//   1. N bare "trigger" divs — same height/snap behavior projects always
//      had, purely so useTimelineOrchestrator's IntersectionObserver and
//      the scrollbar itself still have real, per-project scroll distance
//      to work with. No visual content of their own anymore.
//   2. ProjectStage, `position: sticky`, mounted ONCE — the actual chrome
//      (background/clipboard/phone/notes/banner), reading projects[activeIndex].
// The trigger layer sets the grid row's height (N x 100vh); ProjectStage's
// own height is just one section tall, and `sticky` keeps it pinned to the
// top of the viewport for as long as any part of that N x 100vh row is still
// on screen, releasing naturally once the user scrolls past it — no manual
// scroll-bounds bookkeeping needed. useTimelineOrchestrator and TimelineRail
// are unchanged from before this change; they already treated activeIndex as
// state, not as "which DOM node happens to be scrolled into view."
export function Timeline({ experiences, containerRef, sectionRefs, onActiveSectionChange, ref }: TimelineProps) {
  const projects = useMemo(() => {
    return experiences.flatMap(exp => exp.projects.map(project => {
      const madeFor = project.client ?? exp;
      return {
        ...project,
        company: madeFor.company,
        companyLogo: madeFor.companyLogo,
        companyUrl: madeFor.companyUrl,
      };
    }));
  }, [experiences]);

  const isMobile = useScreenTier() === 'mobile';

  const {
    activeIndex,
    itemRefs,
    isTimelineInFullView,
    activeSection
  } = useTimelineOrchestrator({ itemCount: projects.length, containerRef, sectionRefs, triggerLayout: isMobile ? 'flow' : 'stage' });

  useEffect(() => {
    onActiveSectionChange(activeSection);
  }, [activeSection, onActiveSectionChange]);

  // Mobile scrolls normally, so there is no one-screen stage to swap content in: every project is
  // laid out in turn, as tall as its content, and each one is its own scroll trigger. The top
  // padding keeps each project's start clear of the horizontal rail pinned under the navbar.
  if (isMobile) {
    return (
      <div ref={ref} className="relative w-full">
        <TimelineRail
          projects={projects}
          activeIndex={activeIndex}
          isInFullView={isTimelineInFullView}
          onNavigate={(index) => itemRefs.current[index]?.scrollIntoView({ behavior: 'instant', block: 'start' })}
        />
        {projects.map((project, index) => (
          <div
            key={project.id}
            ref={el => { itemRefs.current[index] = el; }}
            className="relative px-[var(--tier-gutter)] pt-9"
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <WoodBackground />
            </div>
            <div className="relative z-0">
              <ProjectDetails project={project} isActive={index === activeIndex} showDetailsHint={index === activeIndex} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative w-full grid">
      <TimelineRail
        projects={projects}
        activeIndex={activeIndex}
        isInFullView={isTimelineInFullView}
        onNavigate={(index) => {
          // 'smooth' was verified working pre-Phase-1 (distant rail-dot
          // clicks animated correctly). Under the grid+sticky layout it's
          // now completely broken — confirmed via instrumentation
          // (Element.prototype.scrollIntoView spy): the call fires with the
          // correct target every time, but produces zero scroll movement,
          // even for an adjacent (1-section) jump, not just distant ones —
          // so it isn't the scroll-snap/smooth-scroll distance interaction
          // documented elsewhere in this codebase, it's something specific
          // to this new overlapping-grid-cell + sticky-sibling structure.
          // 'instant' was verified reliable in the same test. Root cause
          // not chased further — ship a working instant jump now; revisit
          // the animated version, if wanted, alongside Phase 2's content-
          // transition work (cone/project/architecture/systems/PROJECT_VIEWER.md).
          itemRefs.current[index]?.scrollIntoView({ behavior: 'instant', block: 'start' });
        }}
      />

      {/* Scroll triggers — bare positional divs, no visual content. */}
      <div className="[grid-area:1/1]">
        {projects.map((project, index) => (
          <div
            key={project.id}
            ref={el => { itemRefs.current[index] = el; }}
            className="snap-start snap-always h-[calc(100vh-var(--chrome-navbar-height))] w-full"
            aria-hidden
          />
        ))}
      </div>

      {/* The Project Viewer — mounted once, sticky, shows the active project.
          top-0, not var(--chrome-navbar-height): the scroll container this
          sticks within is <main> (App.tsx), whose own scrollport already
          starts right below the navbar (Navbar is a normal flex sibling,
          not position:fixed) — offsetting by the navbar height again here
          double-counted it, leaving a visible gap above the shell where the
          section behind it (SkillTree/whatever's above) showed through. */}
      {activeIndex !== -1 && (
        <div className="[grid-area:1/1] sticky top-0 h-[calc(100vh-var(--chrome-navbar-height))] w-full">
          <ProjectStage project={projects[activeIndex]} index={activeIndex} showDetailsHint />
        </div>
      )}
    </div>
  );
}

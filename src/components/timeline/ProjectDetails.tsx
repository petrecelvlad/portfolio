import { useState } from 'react';
import type React from 'react';
import { ITimelineProject } from '@/src/core/domain/models';
import { BentoHeader } from '../bento/shared/BentoHeader';
import { BentoResponsibilities } from '../bento/shared/BentoResponsibilities';
import { BentoSkills } from '../bento/shared/BentoSkills';
import { BentoAchievement } from '../bento/shared/BentoAchievement';
import { BentoVideoFrame } from '../bento/BentoVideoFrame';
import { Stack } from '../atoms/Stack';
import { PhotoViewer } from './PhotoViewer';

interface ProjectDetailsProps {
  key?: React.Key;
  project: ITimelineProject;
  isActive: boolean;
  showDetailsHint?: boolean;
}

// Landscape (tablet and up): clipboard column beside achievement, video and notes, one screen.
// Portrait tablet: the same pieces stacked, the clipboard at a fixed height so it still fits one
// screen. Mobile: stacked at natural heights, as tall as the content.
export function ProjectDetails({ project, isActive, showDetailsHint = false }: ProjectDetailsProps) {
  const [slide, setSlide] = useState(0);
  // Coming into view or leaving it, the slideshow starts over from the first screenshot.
  const [wasActive, setWasActive] = useState(isActive);
  if (wasActive !== isActive) {
    setWasActive(isActive);
    setSlide(0);
  }
  const [viewer, setViewer] = useState<{ index: number; from: DOMRect } | null>(null);
  // On the project stage this stays mounted while projects swap in, so a new project starts
  // over too: first screenshot, no photo open.
  const [shownProjectId, setShownProjectId] = useState(project.id);
  if (shownProjectId !== project.id) {
    setShownProjectId(project.id);
    setSlide(0);
    setViewer(null);
  }
  const openPhoto = (index: number, from: DOMRect) => setViewer({ index, from });
  const pages = project.isDiscontinued && project.links.youtube
    ? [...project.links.pages, { kind: 'youtube' as const, url: project.links.youtube }]
    : project.links.pages;

  return (
    <Stack gap="md" className="w-full tablet:h-full min-h-0 tablet:overflow-y-auto overflow-x-hidden px-1 py-7">
      <div className="grid grid-cols-1 tablet:landscape:grid-cols-[46%_1fr] laptop:landscape:grid-cols-[40%_1fr] tablet:portrait:grid-rows-[470px_minmax(0,1fr)] flex-grow gap-4 md:gap-6 items-stretch min-h-0">
        
        {/* Left Column */}
        <Stack gap="md" className="min-h-0">
          <BentoHeader
            title={project.title}
            icon={project.icon}
            startDate={project.startDate}
            endDate={project.endDate}
          />
          <div className="flex-grow min-h-0 flex flex-col">
            <BentoResponsibilities
              overview={project.overview}
              responsibilities={project.responsibilities}
              role={project.role}
              title={project.title}
              icon={project.icon}
              startDate={project.startDate}
              endDate={project.endDate}
              galleryScreenshots={project.keyScreenshots}
              onOpenPhoto={openPhoto}
              company={project.company}
              companyLogo={project.companyLogo}
              companyUrl={project.companyUrl}
              links={[...pages, ...(project.keyScreenshots[slide]?.links ?? [])]}
              isDiscontinued={project.isDiscontinued}
              showDetailsHint={showDetailsHint}
            />
          </div>
        </Stack>

        {/* Right Column */}
        <Stack gap="md" className="min-h-0">
          <div className="flex-shrink-0">
            <BentoAchievement achievement={project.achievements?.[0]} />
          </div>
          {/* Mobile has no screen height to fill, so the frame takes a 16:9 box of its own. Only the
              active project gets its YouTube player; the rest show their screenshot in the same shell.
              The key swaps the whole frame, per project too: the YouTube API replaces the player's
              placeholder node with its iframe, so React must never be left to remove that node on its own. */}
          <div className="aspect-video tablet:aspect-auto flex-grow min-h-0 flex flex-col">
            <BentoVideoFrame
              key={`${project.id}-${isActive ? 'player' : 'screenshot'}`}
              orientation={project.frameOrientation ?? 'landscape'}
              screenshots={project.keyScreenshots}
              slide={slide}
              onSlideChange={setSlide}
              youtubeUrl={isActive ? project.links.youtube : undefined}
              // Paused behind the open viewer: no slides advancing, no video playing unseen.
              isActive={isActive && !viewer}
              onOpenPhoto={openPhoto}
            />
          </div>
          <div className="flex-shrink-0">
            <BentoSkills skills={project.technologies} />
          </div>
        </Stack>

      </div>
      {viewer && (
        <PhotoViewer
          title={project.title}
          screenshots={project.keyScreenshots}
          startIndex={viewer.index}
          openedFrom={viewer.from}
          onClose={() => setViewer(null)}
        />
      )}
    </Stack>
  );
}

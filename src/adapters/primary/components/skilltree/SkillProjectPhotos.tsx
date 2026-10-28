import { InstantPhoto } from '@/src/components/atoms/InstantPhoto';
import type { Skill } from '@/src/core/domain/skillTreeTypes';
import type { IProject } from '@/src/core/domain/models';

const PHOTO_ROTATIONS = [-4, 3, -5];
// Rendered height of one photo per unit of its width: the square-photo frame (1.11) plus the tape tab above it and the rotation's extra height.
const PHOTO_FOOTPRINT_HEIGHT_PER_WIDTH = 1.26;
// Never wider than a third of the row (the pre-region size), and narrow enough that the footprint fits the region's height.
// cq units resolve against the content box, so the row's px-6 is already excluded; 2rem = the two gap-4s.
const PHOTO_WIDTH = `min(calc((100cqw - 2rem) / 3), calc((100cqh - 2rem) / ${PHOTO_FOOTPRINT_HEIGHT_PER_WIDTH}))`;

export interface SkillProjectPhotosProps {
  skill: Skill | null;
  projectsById: Map<string, IProject>;
  className?: string;
}

export function SkillProjectPhotos({ skill, projectsById, className = '' }: SkillProjectPhotosProps) {
  const photos = skill
    ? skill.projects
        .map(id => projectsById.get(id))
        .filter((p): p is IProject => p !== undefined)
        .slice(0, 3)
    : [];

  return (
    <div className={`[container-type:size] flex items-center justify-center gap-4 px-6 ${className}`}>
      {photos.map((project, i) => (
        <div key={project.id} className="flex-none" style={{ width: PHOTO_WIDTH }}>
          <InstantPhoto
            src={project.icon ?? ''}
            alt={project.title}
            rotation={PHOTO_ROTATIONS[i % PHOTO_ROTATIONS.length]}
            photoAspect={1}
            className="w-full drop-shadow-xl"
          />
        </div>
      ))}
    </div>
  );
}

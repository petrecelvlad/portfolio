import type { IProfile, IProject } from './models';

// Projects that ended within this many years get their full bullets in the CV; older ones one line.
const CV_DETAIL_YEARS = 10;

export function isDetailedInCv(project: Pick<IProject, 'endDate'>, now: Date): boolean {
  if (project.endDate === 'Present') return true;
  const cutoff = new Date(now.getFullYear() - CV_DETAIL_YEARS, now.getMonth(), now.getDate());
  return new Date(project.endDate) >= cutoff;
}

// "Vlad-Petre-Game-Producer-CV.pdf": the name a recruiter's downloads folder will show.
export function cvFileName(profile: Pick<IProfile, 'name' | 'role'>): string {
  return `${[profile.name, profile.role, 'CV'].join(' ').trim().replace(/\s+/g, '-')}.pdf`;
}

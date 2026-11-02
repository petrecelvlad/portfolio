import fs from 'fs';
import path from 'path';
import type { IContact, IExperience, IProfile, IProject } from '../../src/core/domain/models';
import { newestFirst } from '../../src/core/domain/experienceOrder';

// The site's content as the build-time outputs read it (the plain document in index.html, the CV):
// straight from the data files the app reads, so a change to them reaches every output.

const DATA_DIR = 'src/infrastructure/data';

export type ContentProject = Omit<IProject, 'keyScreenshots'>;
export type ContentExperience = Omit<IExperience, 'projects'> & { projects: ContentProject[] };

export interface SiteContent {
  profile: IProfile;
  contact: IContact;
  experiences: ContentExperience[];
}

// A project with the company it was made for, in the timeline's order.
export interface ContentEntry {
  project: ContentProject;
  company: string;
  location?: string;
}

function readJson<T>(root: string, file: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, DATA_DIR, file), 'utf8')) as T;
}

export function loadSiteContent(root: string): SiteContent {
  return {
    profile: readJson(root, 'profile.json'),
    contact: readJson(root, 'contact.json'),
    experiences: readJson(root, 'portfolio.json'),
  };
}

export function orderedExperiences(experiences: readonly ContentExperience[]): ContentExperience[] {
  return [...experiences].sort(newestFirst).map(experience => ({
    ...experience,
    projects: [...experience.projects].sort(newestFirst),
  }));
}

export function toEntry(project: ContentProject, experience: ContentExperience): ContentEntry {
  return { project, company: project.client?.company ?? experience.company, location: experience.location };
}

export function timelineEntries(experiences: readonly ContentExperience[]): ContentEntry[] {
  return orderedExperiences(experiences).flatMap(experience =>
    experience.projects.map(project => toEntry(project, experience)));
}

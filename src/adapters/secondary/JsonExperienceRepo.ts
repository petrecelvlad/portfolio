import { IExperience, IProject, IScreenshot } from '@/src/core/domain/models';
import { IExperienceRepository } from '@/src/ports/experienceRepo';
import portfolioData from '@/src/infrastructure/data/portfolio.json';
import responsiveImages from 'virtual:responsive-images';

// The JSON writes an uncaptioned screenshot as its bare path.
type JsonProject = Omit<IProject, 'keyScreenshots'> & { keyScreenshots: (string | IScreenshot)[] };
type JsonExperience = Omit<IExperience, 'projects'> & { projects: JsonProject[] };

const BASE = import.meta.env.BASE_URL;

function assetPath(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('/')) return `${BASE}${path.slice(1)}`;
  return path;
}

function srcSetFor(path: string): string | undefined {
  const entry = responsiveImages[path];
  if (!entry?.variants.length) return undefined;
  return [...entry.variants, { file: path, width: entry.width }]
    .map(v => `${assetPath(v.file)} ${v.width}w`)
    .join(', ');
}

function resolveScreenshot(shot: string | IScreenshot): IScreenshot {
  const { src, ...rest } = typeof shot === 'string' ? { src: shot } : shot;
  return { ...rest, src: assetPath(src), srcSet: srcSetFor(src) };
}

function resolveProjectPaths(project: JsonProject): IProject {
  return {
    ...project,
    icon: assetPath(project.icon),
    keyScreenshots: project.keyScreenshots.map(resolveScreenshot),
    client: project.client && { ...project.client, companyLogo: assetPath(project.client.companyLogo) },
  };
}

function resolveExperience(exp: JsonExperience): IExperience {
  return {
    ...exp,
    companyLogo: assetPath(exp.companyLogo),
    projects: exp.projects.map(resolveProjectPaths),
  };
}

function sortDesc(a: string, b: string): number {
  return b.localeCompare(a);
}

function prepare(data: JsonExperience[]): IExperience[] {
  return [...data]
    .map(resolveExperience)
    .sort((a, b) => sortDesc(a.startDate, b.startDate))
    .map(exp => ({
      ...exp,
      projects: [...exp.projects].sort((a, b) => sortDesc(a.startDate, b.startDate)),
    }));
}

export class JsonExperienceRepository implements IExperienceRepository {
  async getAllExperiences(): Promise<IExperience[]> {
    return prepare(portfolioData as JsonExperience[]);
  }

  async getExperienceById(id: string): Promise<IExperience | undefined> {
    const all = await this.getAllExperiences();
    return all.find(exp => exp.id === id);
  }
}

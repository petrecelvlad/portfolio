import type { IProjectLink, ProjectLinkKind } from './models';

// Link order is this object's order: pages to play or read about the game first, social pages after.
export const LINK_LABELS: Record<ProjectLinkKind, string> = {
  website: 'Website',
  article: 'Article',
  newgrounds: 'Newgrounds',
  appStore: 'App Store',
  googlePlay: 'Google Play',
  steam: 'Steam',
  youtube: 'YouTube',
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X',
  discord: 'Discord',
};

const LINK_ORDER = Object.keys(LINK_LABELS) as ProjectLinkKind[];

export function orderLinks(links: readonly IProjectLink[]): IProjectLink[] {
  return [...links].sort((a, b) => LINK_ORDER.indexOf(a.kind) - LINK_ORDER.indexOf(b.kind));
}

export function linkLabel(link: IProjectLink): string {
  return link.label ?? LINK_LABELS[link.kind];
}

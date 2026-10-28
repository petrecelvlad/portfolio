// Recruiter summary shown as the clipboard's first page. Any "[? …]" span inside these
// strings is copy the owner hasn't confirmed yet (see unconfirmedCopy.ts).
export interface IProjectOverview {
  summary: string;
}

export interface IProject {
  id: string;
  title: string;
  role: string;
  // ISO date "YYYY-MM-DD" | "Present" for current roles. Displayed as quarter (Q1–Q4 YYYY) in UI.
  startDate: string;
  endDate: string;
  description?: string;
  icon?: string;
  type: 'GAME' | 'SOFTWARE';
  overview: IProjectOverview;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  keyScreenshots: IScreenshot[];
  // youtube is the trailer the video frame plays; pages are the clipboard's link tags.
  links: { youtube?: string; pages: IProjectLink[] };
  // The game no longer runs; its remaining pages (usually social) are all that's left, so its trailer becomes a tag too.
  isDiscontinued?: boolean;
  // Portrait shows an upright phone: one per screenshot, or a single one playing the trailer. Left out means landscape.
  frameOrientation?: FrameOrientation;
  // Work for another company than the employer: the clipboard shows the client's name, logo and site instead.
  client?: Pick<IExperience, 'company' | 'companyLogo' | 'companyUrl'>;
}

// For an entry that covers several games (e.g. Amber): caption names the screenshot's game, and
// links are that game's own pages, which the clipboard shows as tags while the screenshot shows.
export interface IScreenshot {
  src: string;
  // The same image at smaller widths, in <img srcset> syntax; absent when there are none (GIFs).
  srcSet?: string;
  caption?: string;
  links?: IProjectLink[];
}

export type FrameOrientation = 'landscape' | 'portrait';

export type ProjectLinkKind =
  | 'website' | 'article' | 'newgrounds' | 'appStore' | 'googlePlay' | 'steam' | 'youtube'
  | 'facebook' | 'instagram' | 'x' | 'discord';

export interface IProjectLink {
  kind: ProjectLinkKind;
  url: string;
  // Replaces the kind's own tag text, for links a kind alone can't tell apart (two articles).
  label?: string;
}

// A project with the company it was made for, as the timeline shows it.
export interface ITimelineProject extends IProject {
  company: string;
  companyLogo?: string;
  companyUrl?: string;
}

export interface IExperience {
  id: string;
  company: string;
  companyLogo?: string;
  // Left out when there is no company (freelance, independent) or it no longer exists.
  companyUrl?: string;
  location?: string;
  // ISO date "YYYY-MM-DD" | "Present". Brackets the full employment/engagement span.
  startDate: string;
  endDate: string;
  projects: IProject[];
}

// The email is stored as [name, domain] and joined in the visitor's browser, so the whole address
// never sits in a file a scraper can read.
export interface IContact {
  emailParts: [string, string];
}

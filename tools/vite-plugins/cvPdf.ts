import { createRequire } from 'module';
import path from 'path';
import PDFDocument from 'pdfkit';
import type { Plugin } from 'vite';
import { cvFileName, isDetailedInCv } from '../../src/core/domain/cv';
import { splitEmphasis } from '../../src/core/domain/emphasizedCopy';
import { formatMonthYear } from '../../src/core/domain/formatDate';
import { CATEGORIES, SKILLS, type SkillCategory } from '../../src/core/domain/skillTreeTypes';
import {
  loadSiteContent, orderedExperiences, toEntry, type ContentEntry, type ContentExperience, type SiteContent,
} from './siteContent';

// T-080: every build writes an ATS-ready CV from the same data as the site. ATS tools parse a CV
// into fields, so it stays one column of real text: standard section names, title and company on
// one line, `Mon YYYY` dates on the next, plain bullets. One accent colour and the site's font
// keep it from looking like every other CV without costing the parser anything.

const FONT_DIR = '@expo-google-fonts/outfit';
const FONTS = {
  regular: `${FONT_DIR}/400Regular/Outfit_400Regular.ttf`,
  medium: `${FONT_DIR}/500Medium/Outfit_500Medium.ttf`,
  bold: `${FONT_DIR}/700Bold/Outfit_700Bold.ttf`,
} as const;

const INK = '#1C1610';
const MUTED = '#5C5248';
const ACCENT = '#D9245D';
const MARGIN = 50;
const BODY_SIZE = 9.5;
const LINE_GAP = 1.5;
const BULLET_INDENT = 10;
// An entry's title, date line and first lines must start on the same page.
const ENTRY_MIN_SPACE = 70;

type Doc = InstanceType<typeof PDFDocument>;
type FontName = keyof typeof FONTS;
type TextOptions = PDFKit.Mixins.TextOptions;

// Kerning is written as tiny position shifts between letters, and text extractors read the wider
// ones as spaces ("T oday", "T ap TD"), which breaks titles for ATS parsers. fontkit turns a feature
// off from an object; PDFKit's types only describe the array form.
const NO_KERNING = { kern: false } as unknown as TextOptions['features'];

function style(doc: Doc, font: FontName, size = BODY_SIZE, color = INK) {
  doc.font(font).fontSize(size).fillColor(color);
}

function write(doc: Doc, text: string, options: TextOptions = {}) {
  doc.text(text, { features: NO_KERNING, ...options });
}

function plainCopy(copy: string): string {
  return splitEmphasis(copy).map(segment => segment.text).join('');
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function dateRange(startDate: string, endDate: string): string {
  return `${formatMonthYear(startDate)} – ${formatMonthYear(endDate)}`;
}

function ensureSpace(doc: Doc, height: number) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

function sectionHeading(doc: Doc, title: string) {
  ensureSpace(doc, ENTRY_MIN_SPACE);
  doc.moveDown(0.9);
  style(doc, 'bold', 11, ACCENT);
  write(doc, title.toUpperCase(), { characterSpacing: 1 });
  const y = doc.y + 2;
  doc.moveTo(MARGIN, y).lineTo(doc.page.width - MARGIN, y).lineWidth(0.6).strokeColor(ACCENT).stroke();
  doc.y = y + 6;
}

function bullets(doc: Doc, items: readonly string[], font: FontName) {
  if (!items.length) return;
  style(doc, font);
  doc.list(items.map(plainCopy), {
    features: NO_KERNING,
    bulletRadius: 1.4,
    bulletIndent: 2,
    textIndent: BULLET_INDENT,
    lineGap: LINE_GAP,
    paragraphGap: 1.5,
  });
}

function header(doc: Doc, { profile, contact }: SiteContent) {
  style(doc, 'bold', 24);
  write(doc, profile.name);
  style(doc, 'medium', 13, ACCENT);
  write(doc, profile.role);
  doc.moveDown(0.3);
  const email = contact.emailParts.join('@');
  const links: { text: string; link?: string }[] = [
    { text: profile.location },
    { text: email, link: `mailto:${email}` },
    { text: displayUrl(contact.linkedinUrl), link: contact.linkedinUrl },
    { text: displayUrl(contact.portfolioUrl), link: contact.portfolioUrl },
  ];
  style(doc, 'regular', BODY_SIZE, MUTED);
  links.forEach(({ text, link }, i) => {
    const isLast = i === links.length - 1;
    write(doc, text, { link, continued: true });
    write(doc, isLast ? '' : '  ·  ', { link: null, continued: !isLast });
  });
}

function summary(doc: Doc, { profile }: SiteContent) {
  sectionHeading(doc, 'Summary');
  style(doc, 'regular');
  profile.bio.forEach(line => write(doc, plainCopy(line), { lineGap: LINE_GAP }));
}

function skills(doc: Doc) {
  sectionHeading(doc, 'Skills');
  (Object.keys(CATEGORIES) as SkillCategory[]).forEach((category, i) => {
    const names = SKILLS.filter(skill => skill.category === category).map(skill => skill.name);
    if (i > 0) doc.moveDown(0.25);
    style(doc, 'bold');
    write(doc, `${sentenceCase(CATEGORIES[category].label)}: `, { continued: true, lineGap: LINE_GAP });
    style(doc, 'regular');
    write(doc, names.join(', '), { lineGap: LINE_GAP });
  });
}

function experienceEntry(doc: Doc, { project, company, location }: ContentEntry) {
  ensureSpace(doc, ENTRY_MIN_SPACE);
  doc.moveDown(0.6);
  style(doc, 'bold', 10.5);
  write(doc, project.role, { continued: true });
  style(doc, 'regular', 10.5);
  write(doc, `  |  ${company}`);
  const dates = dateRange(project.startDate, project.endDate);
  style(doc, 'regular', BODY_SIZE, MUTED);
  write(doc, location ? `${dates}  ·  ${location}` : dates);
  doc.moveDown(0.2);
  style(doc, 'medium');
  write(doc, `${project.title}: `, { continued: true, lineGap: LINE_GAP });
  style(doc, 'regular');
  write(doc, plainCopy(project.overview.summary), { lineGap: LINE_GAP });
  doc.moveDown(0.2);
  bullets(doc, project.achievements, 'medium');
  bullets(doc, project.responsibilities, 'regular');
}

// One line in Earlier experience: a single older project, or a whole experience folded together.
interface EarlierLine {
  role: string;
  company: string;
  titles: string;
  startDate: string;
  endDate: string;
}

function earlierLine(doc: Doc, { role, company, titles, startDate, endDate }: EarlierLine) {
  ensureSpace(doc, 16);
  doc.moveDown(0.25);
  style(doc, 'bold');
  write(doc, `${role}  |  ${company}`, { continued: true });
  style(doc, 'regular', BODY_SIZE, MUTED);
  write(doc, `  ·  ${dateRange(startDate, endDate)}  ·  ${titles}`);
}

function cvExperience(experiences: readonly ContentExperience[], now: Date) {
  const detailed: ContentEntry[] = [];
  const earlier: EarlierLine[] = [];
  for (const experience of orderedExperiences(experiences)) {
    const projects = experience.projects.filter(project => !project.omitFromCv);
    if (experience.cvCombinedRole) {
      earlier.push({
        role: experience.cvCombinedRole,
        company: experience.company,
        titles: projects.map(project => project.title).join(', '),
        startDate: experience.startDate,
        endDate: experience.endDate,
      });
      continue;
    }
    for (const project of projects) {
      const entry = toEntry(project, experience);
      if (isDetailedInCv(project, now)) detailed.push(entry);
      else earlier.push({ ...project, company: entry.company, titles: project.title });
    }
  }
  return { detailed, earlier };
}

export function renderCvPdf(content: SiteContent, now: Date, fontRoot: string): Promise<Buffer> {
  const { profile } = content;
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    lang: 'en-GB',
    displayTitle: true,
    info: { Title: `${profile.name}, ${profile.role} – CV`, Author: profile.name, Subject: `${profile.role} CV` },
  });
  const requireFont = createRequire(path.join(fontRoot, 'package.json'));
  (Object.keys(FONTS) as FontName[]).forEach(name => doc.registerFont(name, requireFont.resolve(FONTS[name])));

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const { detailed, earlier } = cvExperience(content.experiences, now);

  header(doc, content);
  summary(doc, content);
  skills(doc);
  sectionHeading(doc, 'Experience');
  detailed.forEach(entry => experienceEntry(doc, entry));
  if (earlier.length) {
    sectionHeading(doc, 'Earlier experience');
    earlier.forEach(line => earlierLine(doc, line));
  }
  doc.end();
  return done;
}

// Built into the output on every build, and served fresh by the dev server so the footer's
// download works there too.
export function cvPdf(): Plugin {
  let root = '';
  let base = '/';
  return {
    name: 'cv-pdf',
    configResolved(config) {
      root = config.root;
      base = config.base;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const content = loadSiteContent(root);
        if (req.url !== `${base}${cvFileName(content.profile)}`) return next();
        res.setHeader('Content-Type', 'application/pdf');
        res.end(await renderCvPdf(content, new Date(), root));
      });
    },
    async generateBundle() {
      const content = loadSiteContent(root);
      this.emitFile({
        type: 'asset',
        fileName: cvFileName(content.profile),
        source: await renderCvPdf(content, new Date(), root),
      });
    },
  };
}

import type { Plugin } from 'vite';
import type { IContact, IProfile } from '../../src/core/domain/models';
import { getStatValue } from '../../src/core/domain/career';
import { splitEmphasis } from '../../src/core/domain/emphasizedCopy';
import { formatMonthYear } from '../../src/core/domain/formatDate';
import { linkLabel, orderLinks } from '../../src/core/domain/projectLinks';
import { CATEGORIES, SKILLS, type SkillCategory } from '../../src/core/domain/skillTreeTypes';
import { loadSiteContent, timelineEntries, type ContentEntry, type SiteContent } from './siteContent';

// T-078: index.html carries the whole site as a plain document inside #root, written from the same
// data files the app reads. Anything that doesn't run JavaScript (link previews, recruiter tools,
// some crawlers) reads it as an ordinary page. With JavaScript it's hidden before the body paints,
// and React replaces it when the app mounts, so visitors never see it.

const ROOT_ELEMENT = '<div id="root"></div>';

// The site's CSS reset flattens headings and lists, so the document brings its own hierarchy.
const DOCUMENT_STYLE = [
  '.js .static-document{display:none}',
  '.static-document{display:block;max-width:760px;margin:0 auto;padding:32px 16px}',
  '.static-document h1{font-size:2em;font-weight:700;line-height:1.2}',
  '.static-document h2{font-size:1.5em;font-weight:700;margin-top:1.5em}',
  '.static-document h3{font-size:1.2em;font-weight:700;margin-top:1.25em}',
  '.static-document h4{font-weight:700;margin-top:.75em}',
  '.static-document p,.static-document ul{margin:.4em 0}',
  '.static-document ul{list-style:disc;padding-left:1.5em}',
  '.static-document a{text-decoration:underline}',
].join('');

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function copyHtml(copy: string): string {
  return splitEmphasis(copy)
    .map(({ text, isEmphasized }) => (isEmphasized ? `<strong>${escapeHtml(text)}</strong>` : escapeHtml(text)))
    .join('');
}

function listHtml(items: readonly string[]): string {
  return `<ul>${items.map(item => `<li>${copyHtml(item)}</li>`).join('')}</ul>`;
}

function profileHtml(profile: IProfile, now: Date): string {
  const stats = profile.stats.map(stat => `${getStatValue(stat, now)} ${stat.label.toLowerCase()}`);
  return `<header>
<h1>${escapeHtml(profile.name)}</h1>
<p><strong>${escapeHtml(profile.role)}</strong>, ${escapeHtml(profile.location)}</p>
${profile.bio.map(line => `<p>${copyHtml(line)}</p>`).join('\n')}
${listHtml(stats)}
</header>`;
}

function skillsHtml(): string {
  const categories = (Object.keys(CATEGORIES) as SkillCategory[]).map((category) => {
    const { label, description } = CATEGORIES[category];
    const skills = SKILLS.filter(skill => skill.category === category).map(skill => skill.name);
    return `<h3>${escapeHtml(label)}</h3>
<p>${copyHtml(description)}</p>
<p>${escapeHtml(skills.join(', '))}</p>`;
  });
  return `<section>
<h2>Skills</h2>
${categories.join('\n')}
</section>`;
}

function projectHtml({ project, company, location }: ContentEntry): string {
  const dates = `${formatMonthYear(project.startDate)} – ${formatMonthYear(project.endDate)}`;
  const links = orderLinks(project.links.pages)
    .map(link => `<a href="${escapeHtml(link.url)}">${escapeHtml(linkLabel(link))}</a>`);
  if (project.links.youtube) links.push(`<a href="${escapeHtml(project.links.youtube)}">Trailer</a>`);
  return `<article>
<h3>${escapeHtml(project.title)}</h3>
<p>${escapeHtml(project.role)}, ${escapeHtml(company)}${location ? `, ${escapeHtml(location)}` : ''}. ${dates}</p>
<p>${copyHtml(project.overview.summary)}</p>
${project.responsibilities.length ? `<h4>Details</h4>\n${listHtml(project.responsibilities)}` : ''}
${project.achievements.length ? `<h4>Achievements</h4>\n${listHtml(project.achievements)}` : ''}
${project.technologies.length ? `<p>Skills: ${escapeHtml(project.technologies.join(', '))}</p>` : ''}
${links.length ? `<p>${links.join(' · ')}</p>` : ''}
</article>`;
}

function projectsHtml(entries: ContentEntry[]): string {
  return `<section>
<h2>Projects</h2>
${entries.map(projectHtml).join('\n')}
</section>`;
}

// The email stays out on purpose: the whole address never sits in a shipped file (T-074).
function contactHtml(contact: IContact): string {
  return `<footer>
<h2>Contact</h2>
<p><a href="${escapeHtml(contact.linkedinUrl)}">LinkedIn</a></p>
</footer>`;
}

export function renderStaticDocument({ profile, contact, experiences }: SiteContent, now: Date): string {
  return `<article class="static-document">
${profileHtml(profile, now)}
${skillsHtml()}
${projectsHtml(timelineEntries(experiences))}
${contactHtml(contact)}
</article>`;
}

export function staticDocument(): Plugin {
  let root = '';
  return {
    name: 'static-document',
    configResolved(config) {
      root = config.root;
    },
    transformIndexHtml(html) {
      const document = renderStaticDocument(loadSiteContent(root), new Date());
      return {
        html: html.replace(ROOT_ELEMENT, `<div id="root">${document}</div>`),
        tags: [
          { tag: 'script', children: "document.documentElement.classList.add('js');", injectTo: 'head-prepend' },
          { tag: 'style', children: DOCUMENT_STYLE, injectTo: 'head' },
        ],
      };
    },
  };
}

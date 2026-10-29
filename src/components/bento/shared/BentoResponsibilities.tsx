/**
 * @propolis
 * {
 *   "role": "UI_COMPONENT",
 *   "constraints": [
 *     "C-008: the details hint hand bobs as a CSS transform animation (index.css .hint-bob)",
 *     "C-008: page turns are Motion transform strings and opacity (ClipboardPage.tsx)",
 *     "C-010: the hand stops through index.css's reduced-motion rule; page turns check useReducedMotion and crossfade instead"
 *   ],
 *   "agent_instructions": "The clipboard for the project on show. Only the hint hand moves nonstop, and only until the visitor's first tab click. A tab click turns the page; a project swap (projectSwap.ts) tears the sheet off or drops a new one on."
 * }
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronRight, Facebook, FileText, Gamepad2, Globe, Images, Instagram, ListChecks, MessageCircle, Newspaper,
  Play, Pointer, Smartphone, Twitter, Youtube, type LucideIcon,
} from 'lucide-react';
import { Text } from '@/src/components/atoms/Text';
import { InstantPhoto } from '@/src/components/atoms/InstantPhoto';
import { ResponsibilitiesSlotProps } from '@/src/components/bento/ports';
import { useProjectSwap } from '@/src/components/bento/projectSwap';
import { ClipboardPage, type PageTurn } from './ClipboardPage';
import type { IProjectLink, ProjectLinkKind } from '@/src/core/domain/models';
import { formatDateToQuarter, formatDuration } from '@/src/core/domain/formatDate';
import { splitUnconfirmed } from '@/src/core/domain/unconfirmedCopy';
import { splitEmphasis } from '@/src/core/domain/emphasizedCopy';
import { dismissDetailsHint, useDetailsHintDismissed } from '@/src/hooks/useDetailsHint';
import {
  HERITAGE_PALETTE, saturate, darken, EMBOSS_LIGHT, EMBOSS_DARK, EMBOSS_AMBIENT_SHADOW,
  BOARD_COLOR, PAPER_COLOR, BOARD_UNDERSHADOW,
} from './palette';

type SectionType = 'overview' | 'details' | 'gallery';

interface ClipboardSection {
  type: SectionType;
  side: 'left' | 'right';
  label: string;
  Icon: LucideIcon;
  isPresent: (props: ResponsibilitiesSlotProps) => boolean;
}

// Tab order is this array's order. A project only gets a tab for the sections it
// has content for; a new section type is one entry here plus its renderSectionBody case.
// Each tab keeps its side of the binder clip whether or not the others are present.
const SECTIONS: ClipboardSection[] = [
  { type: 'overview', side: 'left', label: 'Overview', Icon: FileText, isPresent: () => true },
  { type: 'details', side: 'left', label: 'Details', Icon: ListChecks, isPresent: (p) => p.responsibilities.length > 0 },
  { type: 'gallery', side: 'right', label: 'Gallery', Icon: Images, isPresent: (p) => p.galleryScreenshots.length > 0 },
];

// How far the binder clip sticks up above the board. Tabs rise the same distance
// so their tops line up with the clip's, plus a tucked-in part hidden behind the board.
const CLIP_OVERHANG_PX = 27;
const TAB_TUCK_PX = 14;
// How long the Overview stays open before the hand points at the Details tab.
const DETAILS_HINT_DWELL_MS = 2000;

// The project icon itself (frame, scotch tape, shadow) is the shared InstantPhoto atom
// (components/atoms/InstantPhoto.tsx) — also used by SkillTree's project photos, same recipe,
// sized differently per consumer. Used to be a bespoke torn-edge clip-path here; replaced
// 2026-07-27 so the two stop drifting into different shapes.
// Page tabs used to pull their color from a mix of a bauhaus role token and
// three raw palette colors (--role-responsibilities-accent, --color-butter,
// --color-sky, --color-mint) — none of those are heritage colors at all,
// which is why they read as too dark/saturated next to the desk's soft
// palette. Derived from the same six HERITAGE_PALETTE colors as the Skills
// sticky notes instead (2026-07-24), so this is one shared color language,
// not two. Pushed noticeably more saturated than the flat notes — these are
// meant to read as buttons, not paper — via saturate(), the per-component
// knob palette.ts exists for, rather than hand-picking a one-off tab palette.
const TAB_ACCENTS = HERITAGE_PALETTE.map((c) => saturate(c, 45));
// The open tab: a deeper shade of its own color, so which page is open reads at a glance.
const OPEN_TAB_ACCENTS = HERITAGE_PALETTE.map((c) => darken(saturate(c, 55), 16));

// The heritage emboss (see palette.ts's top-of-file comment, and its
// EMBOSS_LIGHT/EMBOSS_DARK/EMBOSS_AMBIENT_SHADOW exports) is normally
// consumed as `boxShadow: 'var(--shadow-raised)'` / `shadow-[var(--shadow-
// raised)]` directly — that was tried here first and was wrong: box-shadow
// is computed from the element's rectangular bounding box, not an SVG
// path's actual alpha shape, so it rendered as a visible stray rectangle
// around the clip icon's transparent corners. Same class of bug the old
// torn-edge photo frame (now InstantPhoto, a plain rectangle — moot for
// this shape) once had to solve too. Fixed the same way: the ambient/ombré part of the shadow becomes
// a `filter: drop-shadow()` (respects real alpha shape), and the emboss's
// two solid inset LINES become actual SVG rects clipped to the clip's own
// path via an SVG <clipPath> (which follows the real curve exactly,
// unlike a CSS clip-path polygon() approximation of it) — colors imported
// from palette.ts, not redeclared here.
//
// EMBOSS_LINE_HEIGHT is this SVG's own viewBox-unit thickness for both
// bars — a separate number from the shared 3px CSS value (different unit
// systems, this viewBox is 32 units tall) but deliberately the same value
// for both rects, for the same "equal thickness" reason the CSS token
// itself was fixed. The bottom bar's visible result is the tapering
// silhouette's own clipped tip, not a uniform line the way the flat top
// edge produces — an inherent limit of approximating a curved edge with a
// clipped rectangle, not a bug to chase further.
const EMBOSS_LINE_HEIGHT = 3;

// The ruled paper: RULE_HEIGHT is the background's line spacing. Every text element has
// line-height RULE_HEIGHT, and every fixed-height block (the cover header, a badge's line) is a
// whole number of lines tall, so all text below it stays on the lines whatever wraps.
// PAPER_BASELINE_NUDGE is the one whole-block phase correction against the rule background.
const RULE_HEIGHT = 30;
const PAPER_BASELINE_NUDGE = 0;

// The cover: the photo with the title, role, dates and duration beside it; the summary under the
// photo, never beside it. The photo is as large as the sheet allows: the first
// size whose minimum sheet width and height fit. The smallest leaves the text column room for the
// date badge on a phone, and its slightly smaller text keeps a sideways tablet's page from overflowing.
const COVER_SIZES = [
  { minWidth: 480, minHeight: 600, photoClassName: 'w-[160px]', gapClassName: 'gap-5', headerLines: 7, titleClassName: 'text-2xl', roleClassName: 'tracking-widest', summaryClassName: 'text-lg' },
  { minWidth: 400, minHeight: 0, photoClassName: 'w-[112px]', gapClassName: 'gap-4', headerLines: 5, titleClassName: 'text-xl', roleClassName: 'tracking-widest', summaryClassName: 'text-lg' },
  { minWidth: 0, minHeight: 0, photoClassName: 'w-[96px]', gapClassName: 'gap-3', headerLines: 5, titleClassName: 'text-lg', roleClassName: 'tracking-wider', summaryClassName: 'text-base' },
];

// Bulldog-clip silhouette: a tapering trapezoid body with a crease line —
// reads as "pinned paper" without a wire-loop handle (which read as a bag).
function BinderClip() {
  const clipId = useId();
  const clipPath = 'M6 2 H50 L38 27 Q28 33 18 27 Z';
  return (
    <svg
      viewBox="0 0 56 32"
      className="absolute left-1/2 -translate-x-1/2 w-24 h-auto rotate-[-2deg] z-30"
      style={{ top: -CLIP_OVERHANG_PX, filter: EMBOSS_AMBIENT_SHADOW }}
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <path d={clipPath} />
        </clipPath>
      </defs>
      <path
        d={clipPath}
        fill="var(--role-responsibilities-accent)"
        stroke="var(--color-ink-base)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="2" width="56" height={EMBOSS_LINE_HEIGHT} fill={EMBOSS_LIGHT} />
        <rect x="0" y={30 - EMBOSS_LINE_HEIGHT} width="56" height={EMBOSS_LINE_HEIGHT} fill={EMBOSS_DARK} />
      </g>
      <line x1="13" y1="12" x2="43" y2="12" stroke="var(--color-ink-base)" strokeWidth="2" opacity="0.35" />
    </svg>
  );
}

// Tag order is this object's order: pages to play or read about the game first, social pages after.
const LINK_KINDS: Record<ProjectLinkKind, { label: string; Icon: LucideIcon }> = {
  website: { label: 'Website', Icon: Globe },
  article: { label: 'Article', Icon: Newspaper },
  newgrounds: { label: 'Newgrounds', Icon: Play },
  appStore: { label: 'App Store', Icon: Smartphone },
  googlePlay: { label: 'Google Play', Icon: Play },
  steam: { label: 'Steam', Icon: Gamepad2 },
  youtube: { label: 'YouTube', Icon: Youtube },
  facebook: { label: 'Facebook', Icon: Facebook },
  instagram: { label: 'Instagram', Icon: Instagram },
  x: { label: 'X', Icon: Twitter },
  discord: { label: 'Discord', Icon: MessageCircle },
};
const LINK_ORDER = Object.keys(LINK_KINDS) as ProjectLinkKind[];

function LinkTags({ links }: { links: IProjectLink[] }) {
  const sortedLinks = [...links].sort((a, b) => LINK_ORDER.indexOf(a.kind) - LINK_ORDER.indexOf(b.kind));
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-2.5">
      {sortedLinks.map((link, i) => {
        const { label, Icon } = LINK_KINDS[link.kind];
        return (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded border-2 border-ink-base shadow-[0_2px_0_var(--color-ink-base)] font-mono font-bold text-xs uppercase tracking-wide text-ink-base whitespace-nowrap transition-transform hover:-translate-y-px"
            style={{ backgroundColor: HERITAGE_PALETTE[i % HERITAGE_PALETTE.length], rotate: `${i % 2 === 0 ? -1.5 : 1.5}deg` }}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
            {link.label ?? label}
          </a>
        );
      })}
    </div>
  );
}

function CompanyMark({ company, companyLogo }: { company: string; companyLogo?: string }) {
  return companyLogo
    ? <img src={companyLogo} alt={`${company} logo`} className="max-w-[128px] max-h-[72px] object-contain mix-blend-multiply" />
    : <CompanyStamp company={company} />;
}

// Stands in for a company logo: freelance and independent work has none, and some companies'
// can't be found. The name curves around the top like an official seal; a qualifier like "(Flash Era)" is dropped.
function CompanyStamp({ company }: { company: string }) {
  const pathId = useId();
  const name = company.replace(/\s*\(.*\)/, '');
  // The name's arc is about 120 units long; a mono glyph advances 0.6em plus the 1-unit letter spacing.
  // Above 9 units the capitals reach the inner ring.
  const nameSize = Math.min(9, (120 / name.length - 1) / 0.6);
  return (
    <svg viewBox="0 0 100 100" className="w-[116px] h-[116px] -rotate-12 opacity-85 text-sky-deep" role="img" aria-label={name}>
      <defs>
        <path id={`${pathId}top`} d="M 21 63.5 A 32 32 0 1 1 79 63.5" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="47" strokeWidth="3" />
        <circle cx="50" cy="50" r="42" strokeWidth="1.2" />
        <circle cx="50" cy="50" r="22" strokeWidth="1.2" />
      </g>
      <g fill="currentColor" className="font-mono font-bold uppercase">
        <text fontSize={nameSize} letterSpacing="1">
          <textPath href={`#${pathId}top`} startOffset="50%" textAnchor="middle">{name}</textPath>
        </text>
        <polygon points="50,38 52.94,45.95 61.41,46.29 54.76,51.55 57.05,59.71 50,55 42.95,59.71 45.24,51.55 38.59,46.29 47.06,45.95" />
      </g>
    </svg>
  );
}

function CopyWithGaps({ copy }: { copy: string }) {
  return (
    <>
      {splitUnconfirmed(copy).map((segment, i) =>
        segment.isConfirmed ? segment.text : <span key={i} className="text-error">{segment.text}</span>
      )}
    </>
  );
}

// One empty ruled line between bullets, dropped when the spaced list would run past the page.
// Bullet line-height is locked to RULE_HEIGHT so every line, wrapped or not, advances in the
// same steps as the ruled background.
function DetailsList({ items }: { items: string[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    const list = listRef.current!;
    const page = list.closest<HTMLElement>('[data-ruled-page]')!;
    const fit = () => {
      list.style.rowGap = `${RULE_HEIGHT}px`;
      if (page.scrollHeight > page.clientHeight) list.style.rowGap = '0px';
    };
    const observer = new ResizeObserver(fit);
    observer.observe(page);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);
  return (
    <ul ref={listRef} className="flex flex-col" style={{ rowGap: RULE_HEIGHT }}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 items-start">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-ink-base mt-[11px]" />
          <p
            style={{ fontFamily: 'var(--font-hand)', lineHeight: `${RULE_HEIGHT}px` }}
            className="m-0 text-lg text-ink-base"
          >
            {splitEmphasis(item).map((segment, j) =>
              segment.isEmphasized ? <strong key={j} className="font-bold">{segment.text}</strong> : segment.text
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function BentoResponsibilities(props: ResponsibilitiesSlotProps) {
  const {
    overview, responsibilities, role, title, icon, startDate, endDate, galleryScreenshots, onOpenPhoto,
    company, companyLogo, companyUrl, links, isDiscontinued = false, showDetailsHint = false,
  } = props;
  const [activeIndex, setActiveIndex] = useState(0);
  const [turn, setTurn] = useState<PageTurn>({ kind: 'tab', direction: 1 });
  // A project swap opens the new project on its first page.
  const swap = useProjectSwap();
  const [shownSwapKey, setShownSwapKey] = useState(swap.key);
  if (shownSwapKey !== swap.key) {
    setShownSwapKey(swap.key);
    setActiveIndex(0);
    setTurn({ kind: 'project', direction: swap.direction === -1 ? -1 : 1 });
  }
  const sections = SECTIONS.filter((section) => section.isPresent(props));
  const activeSection = sections[activeIndex];
  const detailsIndex = sections.findIndex((section) => section.type === 'details');

  const sheetRef = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState(COVER_SIZES[0]);
  useLayoutEffect(() => {
    const sheet = sheetRef.current!;
    const observer = new ResizeObserver(() => setCover(COVER_SIZES.find(
      (size) => sheet.clientWidth >= size.minWidth && sheet.clientHeight >= size.minHeight,
    )!));
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);
  const ruledLine = { lineHeight: `${RULE_HEIGHT}px` };

  const isHintDismissed = useDetailsHintDismissed();
  const isHintDue = showDetailsHint && !isHintDismissed && detailsIndex !== -1 && activeIndex === 0;
  const [isHintShown, setIsHintShown] = useState(false);
  useEffect(() => {
    if (!isHintDue) return;
    const timer = setTimeout(() => setIsHintShown(true), DETAILS_HINT_DWELL_MS);
    return () => {
      clearTimeout(timer);
      setIsHintShown(false);
    };
  }, [isHintDue]);

  const openSection = (index: number) => {
    setTurn({ kind: 'tab', direction: index > activeIndex ? 1 : -1 });
    setActiveIndex(index);
    dismissDetailsHint();
  };

  const renderTab = (section: ClipboardSection, index: number) => {
    const isActive = index === activeIndex;
    return (
      <button
        key={section.type}
        type="button"
        onClick={() => openSection(index)}
        aria-label={section.label}
        aria-current={isActive}
        title={section.label}
        className={`w-10 md:w-11 flex justify-center pt-[3px] rounded-t-md border-[length:var(--border-width-md)] border-ink-base shadow-[var(--shadow-raised)] origin-bottom transition-[translate,scale,background-color] ${
          isActive ? 'relative z-[1] cursor-default' : 'translate-y-[4px] hover:translate-y-px brightness-95 hover:brightness-100 cursor-pointer'
        }`}
        style={{
          height: CLIP_OVERHANG_PX + TAB_TUCK_PX,
          backgroundColor: (isActive ? OPEN_TAB_ACCENTS : TAB_ACCENTS)[index % TAB_ACCENTS.length],
          color: 'var(--color-ink-base)',
        }}
      >
        <section.Icon className="w-4 h-4" strokeWidth={2.5} aria-hidden />
      </button>
    );
  };

  const renderSectionBody = (type: SectionType) => {
    switch (type) {
      case 'overview':
        return (
          <>
            <div className={`flex items-start ${cover.gapClassName}`} style={{ minHeight: cover.headerLines * RULE_HEIGHT }}>
              {icon && (
                <InstantPhoto
                  src={icon}
                  alt={title ?? role}
                  rotation={3}
                  photoAspect={1}
                  className={`flex-none mt-2 ${cover.photoClassName}`}
                />
              )}
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'var(--font-hand)', ...ruledLine }} className={`m-0 text-ink-base ${cover.titleClassName}`}>
                  {title}
                </p>
                <Text variant="mono" size="sm" color="subtle" className={`uppercase ${cover.roleClassName}`} style={ruledLine}>
                  {role}
                </Text>
                {startDate && endDate && (
                  <>
                    <div className="flex items-center" style={{ height: RULE_HEIGHT }}>
                      <Text variant="mono" size="sm" className="px-2 rounded bg-slot-casing text-slot-text whitespace-nowrap" style={{ lineHeight: `${RULE_HEIGHT - 4}px` }}>
                        {formatDateToQuarter(startDate)} - {formatDateToQuarter(endDate)}
                      </Text>
                    </div>
                    <div className="flex items-center" style={{ height: RULE_HEIGHT }}>
                      <span className="px-2 rounded border-[1.5px] border-slot-casing font-mono font-bold text-xs uppercase tracking-wider text-slot-casing whitespace-nowrap" style={{ lineHeight: `${RULE_HEIGHT - 10}px` }}>
                        {formatDuration(startDate, endDate)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-hand)', ...ruledLine }} className={`m-0 text-ink-base ${cover.summaryClassName}`}>
              <CopyWithGaps copy={overview.summary} />
              {detailsIndex !== -1 && (
                <>
                  <br />
                  <button
                    type="button"
                    onClick={() => openSection(detailsIndex)}
                    className="inline-flex items-center gap-0.5 font-bold text-sky-deep underline decoration-2 underline-offset-4 whitespace-nowrap hover:text-ink-base cursor-pointer"
                  >
                    Read more
                    <ChevronRight className="w-4 h-4" strokeWidth={3} aria-hidden />
                  </button>
                </>
              )}
            </p>
            <div className="mt-auto flex items-end gap-4 pt-4">
              {(links.length > 0 || isDiscontinued) && (
                <div className="flex flex-col gap-1.5 min-w-0">
                  {isDiscontinued && (
                    <span className="font-mono text-[11px] uppercase tracking-wider text-ink-subtle">
                      Game shut down
                    </span>
                  )}
                  {links.length > 0 && <LinkTags links={links} />}
                </div>
              )}
              <div className="ml-auto flex-none">
                {companyUrl ? (
                  <a
                    href={companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${company} website`}
                    className="block transition-transform hover:-translate-y-0.5"
                  >
                    <CompanyMark company={company} companyLogo={companyLogo} />
                  </a>
                ) : (
                  <CompanyMark company={company} companyLogo={companyLogo} />
                )}
              </div>
            </div>
          </>
        );
      case 'details':
        return <DetailsList items={responsibilities} />;
      case 'gallery':
        return (
          <div className="flex flex-wrap justify-center gap-6 pt-4">
            {galleryScreenshots.map(({ src, srcSet }, i) => (
              <button
                key={src}
                type="button"
                onClick={(event) => onOpenPhoto(i, event.currentTarget.getBoundingClientRect())}
                aria-label={`View ${title ?? role} screenshot ${i + 1} full screen`}
                className={`${galleryScreenshots.length === 1 ? 'w-[85%]' : 'w-[calc(50%-16px)]'} cursor-zoom-in transition-transform hover:-translate-y-1`}
              >
                <InstantPhoto
                  src={src}
                  srcSet={srcSet}
                  alt={`${title ?? role} screenshot ${i + 1}`}
                  rotation={i % 2 === 0 ? -2 : 2}
                  className="w-full aspect-[4/3]"
                />
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="relative h-full pl-1 pr-1">
      <BinderClip />

      {/* Section tabs — behind the board, poking up past its top edge on either
          side of the binder clip. The board's z-10 is what keeps them behind it.
          The active tab stands at full height; the rest sit a little lower. */}
      {sections.length > 1 && (
        <>
          <div className="absolute left-6 flex gap-1" style={{ top: -CLIP_OVERHANG_PX }}>
            {sections.map((section, i) => section.side === 'left' && renderTab(section, i))}
          </div>
          <div className="absolute right-6 flex gap-1" style={{ top: -CLIP_OVERHANG_PX }}>
            {sections.map((section, i) => section.side === 'right' && renderTab(section, i))}
          </div>
        </>
      )}

      {/* Tutorial hand: a row mirroring the left tabs, above the board, with the hand under the
          Details tab's slot pointing up at it. */}
      <AnimatePresence>
        {isHintShown && (
          <motion.div
            className="absolute left-6 top-0 z-30 flex gap-1 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            aria-hidden
          >
            {sections.slice(0, detailsIndex + 1).map((section, i) => section.side === 'left' && (
              <div key={section.type} className="w-10 md:w-11 flex justify-center">
                {i === detailsIndex && (
                  <div className="hint-bob relative w-9 h-9 drop-shadow-[2px_3px_0_rgba(43,32,22,0.35)]">
                    {/* Pointer's outline is several open paths, so its own fill only covers parts of the
                        hand; this closed silhouette of the same outline paints the white underneath. */}
                    <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full">
                      <path d="M6 14V4a2 2 0 0 1 4 0v5a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15Z" fill="#FFFFFF" />
                    </svg>
                    <Pointer className="relative w-full h-full text-ink-base" strokeWidth={2} />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clipboard board — bottom layer, rounded corners, the only rounded
          element in the stack; the papers on top stay sharp-cornered. */}
      <div
        className="relative z-10 h-full rounded-2xl border-[length:var(--border-width-md)] border-ink-base p-[10px] md:p-3"
        style={{ backgroundColor: BOARD_COLOR, boxShadow: `${BOARD_UNDERSHADOW}, var(--shadow-raised)` }}
      >
        {/* Back sheet — a second piece of paper peeking out behind, sharp corners.
            Flipped horizontally (Vlad, 2026-07-23) so it peeks out past the
            front sheet's LEFT edge instead of its right. Mirroring a
            rotate+translate pair across a vertical axis means negating both
            the angle and the x-offset, not appending scaleX(-1) — that
            first attempt applied the flip to the point space before the
            rotation composed on top of it, so the peek stayed on the same
            (right) side instead of moving to the left as intended (and a
            second attempt via a Tailwind `-scale-x-100` class compiled to
            `transform: none` entirely, dropping the rotate/translate too —
            verified via getComputedStyle). Negating both values of the
            original rotate(3deg) translateX(4px) is the direct mirror;
            the angle was later eased to 1deg (2026-10-17). */}
        <div
          className="absolute inset-[10px] md:inset-3 border border-ink-whisper"
          style={{ backgroundColor: PAPER_COLOR, transform: 'rotate(-1deg) translateX(-4px)' }}
          aria-hidden
        />

        {/* Front sheets — the pages on the pile, tilted the mirror of the back sheet. The tilt
            flattens 3D for everything inside, so the perspective for the page turns sits here on
            the same element rather than further up. */}
        <div ref={sheetRef} className="relative z-20 h-full rotate-[1deg]" style={{ perspective: 1600 }}>
          <AnimatePresence mode="popLayout" initial={false} custom={turn}>
            <ClipboardPage key={`${shownSwapKey}:${activeSection?.type}`} ruleHeight={RULE_HEIGHT}>
              {/* Single shared phase correction for EVERYTHING below — see
                  the RULE_HEIGHT/PAPER_BASELINE_NUDGE comment above. Every
                  child here is positioned relative to EACH OTHER by normal
                  flow plus the box-quantization rule (each block's own
                  height is a RULE_HEIGHT multiple, centered within it) —
                  this wrapper's translateY is the ONLY absolute offset
                  against the fixed rule background in the whole subtree. */}
              <div className="relative flex-1 flex flex-col" style={{ transform: `translateY(${PAPER_BASELINE_NUDGE}px)` }}>
                {activeSection && renderSectionBody(activeSection.type)}
              </div>
            </ClipboardPage>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

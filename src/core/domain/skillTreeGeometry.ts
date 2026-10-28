import { Skill, SkillCategory, SKILLS, CATEGORIES } from './skillTreeTypes';

export const PILL_W = 208;
export const PILL_H = 32;
export const BADGE_W = 96;
export const CATEGORY_GAP = 24;

/** Column gap between pill columns (and badge to roots), row gap between pills. */
export interface TreeSpacing {
  gapX: number;
  gapY: number;
}

export const DEFAULT_SPACING: TreeSpacing = { gapX: 60, gapY: 10 };

export const CATEGORY_ORDER = Object.keys(CATEGORIES) as SkillCategory[];

export const FLOW_SPEED_PX_PER_SEC = 1100;
export const MIN_SEGMENT_DURATION = 0.06;

export function segmentDuration(pixelLength: number): number {
  return Math.max(pixelLength / FLOW_SPEED_PX_PER_SEC, MIN_SEGMENT_DURATION);
}

export interface LayoutNode {
  skill: Skill;
  screenLeft: number;
  screenTop: number;
  depth: number;
}

export interface LayoutLink {
  sourceId: string;
  targetId: string;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  /** Where the elbow bends. Lane-separated per distinct source sharing a
   *  gutter — see the lane-assignment pass below — so two different
   *  branches' vertical runs never land on the same x and read as one line. */
  midX: number;
  sourceDepth: number;
  targetDepth: number;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  links: LayoutLink[];
  canvasWidth: number;
  canvasHeight: number;
  rootTop: number;
}

const ANCHOR_PREFIX = '__root__';

/** Depth of every skill in `skills` — column index from its nearest null-parent ancestor. */
function buildDepthMap(skills: Skill[]): Map<string, number> {
  const byId = new Map(skills.map(s => [s.id, s]));
  const depthOf = new Map<string, number>();
  function getDepth(skill: Skill): number {
    const cached = depthOf.get(skill.id);
    if (cached !== undefined) return cached;
    const d = skill.parent === null ? 0 : getDepth(byId.get(skill.parent)!) + 1;
    depthOf.set(skill.id, d);
    return d;
  }
  skills.forEach(getDepth);
  return depthOf;
}

/**
 * Only one sibling group per column is ever open (see getNextExpandedSkillIds), so each group is
 * centered on its parent's row and groups that never show together may share rows. A category
 * reserves rows for its biggest sibling group only, so its height never changes as branches open.
 */
function getRowCount(category: SkillCategory): number {
  const skills = SKILLS.filter(s => s.category === category);
  const roots = skills.filter(s => s.parent === null);
  return Math.max(roots.length, ...[...buildChildrenMap(skills).values()].map(kids => kids.length));
}

export function computeLayout(category: SkillCategory, { gapX, gapY }: TreeSpacing): TreeLayout {
  const skills = SKILLS.filter(s => s.category === category);
  const depthOf = buildDepthMap(skills);
  const childrenOf = buildChildrenMap(skills);
  const roots = skills.filter(s => s.parent === null);
  const rowCount = getRowCount(category);

  const rowOf = new Map<string, number>();
  const placeGroup = (group: Skill[], centerRow: number) => {
    const firstRow = Math.min(Math.max(Math.round(centerRow - (group.length - 1) / 2), 0), rowCount - group.length);
    group.forEach((s, i) => {
      rowOf.set(s.id, firstRow + i);
      placeGroup(childrenOf.get(s.id) ?? [], firstRow + i);
    });
  };
  placeGroup(roots, (rowCount - 1) / 2);

  // The badge is treated as a real column before column 0 — every root
  // sits one full gutter (gapX) to the right of it, exactly like every
  // other parent/child pair, instead of butting up against it directly.
  const nodes: LayoutNode[] = skills.map(s => ({
    skill: s,
    screenLeft: gapX + depthOf.get(s.id)! * (PILL_W + gapX),
    screenTop: rowOf.get(s.id)! * (PILL_H + gapY),
    depth: depthOf.get(s.id)!,
  }));
  const nodeById = new Map(nodes.map(n => [n.skill.id, n]));

  // Every bend sits at the exact horizontal midpoint of its gutter — one
  // consistent rule, so every branch point in the tree reads the same way.
  // Unambiguous because only one source per gutter is ever visible.
  const links: LayoutLink[] = skills
    .filter(s => s.parent !== null)
    .map(s => {
      const source = nodeById.get(s.parent!)!;
      const target = nodeById.get(s.id)!;
      const sx = source.screenLeft + PILL_W;
      const tx = target.screenLeft;
      return {
        sourceId: source.skill.id,
        targetId: target.skill.id,
        sx,
        sy: source.screenTop + PILL_H / 2,
        tx,
        ty: target.screenTop + PILL_H / 2,
        midX: (sx + tx) / 2,
        sourceDepth: source.depth,
        targetDepth: target.depth,
      };
    });

  // The anchor is the badge's own column-(-1) position (x=0, exactly where
  // the badge pill ends) — always present, whether the category has one
  // root or several, so the badge-to-root connector is just an ordinary
  // link through an ordinary full-width gutter rather than a special case.
  // Its vertical position is the mean of the real roots' rows.
  const rootTop = roots.reduce((sum, r) => sum + nodeById.get(r.id)!.screenTop, 0) / roots.length;
  roots.forEach(r => {
    const target = nodeById.get(r.id)!;
    links.push({
      sourceId: `${ANCHOR_PREFIX}${category}`,
      targetId: r.id,
      sx: 0,
      sy: rootTop + PILL_H / 2,
      tx: target.screenLeft,
      ty: target.screenTop + PILL_H / 2,
      midX: (0 + target.screenLeft) / 2,
      sourceDepth: 0,
      targetDepth: target.depth,
    });
  });

  return {
    nodes,
    links,
    canvasWidth: Math.max(...nodes.map(n => n.screenLeft)) + PILL_W,
    canvasHeight: rowCount * (PILL_H + gapY) - gapY,
    rootTop,
  };
}

export type TreeLayouts = Record<SkillCategory, TreeLayout>;

export function computeLayouts(spacing: TreeSpacing): TreeLayouts {
  return Object.fromEntries(CATEGORY_ORDER.map(cat => [cat, computeLayout(cat, spacing)])) as TreeLayouts;
}

// What the tree reserves at full depth, so the fitted spacing never has to change as branches open.
const COLUMN_COUNT = Math.max(...buildDepthMap(SKILLS).values()) + 1;
const ROW_COUNTS = CATEGORY_ORDER.map(getRowCount);
const ROW_GAP_COUNT = ROW_COUNTS.reduce((sum, rows) => sum + rows - 1, 0);

/** Full-depth tree width, badge column and side padding included. */
export function treeWidth(gapX: number, padX: number): number {
  return 2 * padX + BADGE_W + COLUMN_COUNT * (PILL_W + gapX);
}

function treeHeight(gapY: number): number {
  return ROW_COUNTS.reduce((sum, rows) => sum + rows * PILL_H, 0) + ROW_GAP_COUNT * gapY + (CATEGORY_ORDER.length - 1) * CATEGORY_GAP;
}

export interface TreeSpacingBounds {
  padX: number;
  gapXMin: number;
  gapXMax: number;
  gapYMax: number;
}

/**
 * Spacing that fills a width × height box with the full-depth tree: each gap stretches within its
 * bounds. Below the minimums the tree is simply wider or taller than the box, and the board's
 * ScaleToFit shrinks it.
 */
export function fitTreeSpacing(width: number, height: number, bounds: TreeSpacingBounds): TreeSpacing {
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  return {
    gapX: Math.floor(clamp((width - treeWidth(0, bounds.padX)) / COLUMN_COUNT, bounds.gapXMin, bounds.gapXMax)),
    gapY: Math.floor(clamp((height - treeHeight(0)) / ROW_GAP_COUNT, DEFAULT_SPACING.gapY, bounds.gapYMax)),
  };
}

export function getActivePathNodeIds(activeSkill: Skill | null): Set<string> {
  const pathIds = new Set<string>();
  if (!activeSkill) return pathIds;

  let current: Skill | undefined = activeSkill;
  while (current) {
    pathIds.add(current.id);
    if (!current.parent) break;
    const parentId = current.parent;
    current = SKILLS.find(s => s.id === parentId);
  }
  return pathIds;
}

/**
 * Root-to-selection order for the active-path fill animation — a fluid
 * flowing through connected pipe segments, each one starting only once the
 * previous one has fully filled. Keyed by each link's targetId so
 * `SkillTreeConnections.tsx` can look up "how many segments come before
 * this one" directly. `link.sourceDepth` can't be reused for this: the
 * anchor→root link and the root's own first real link both have
 * sourceDepth 0 and would fire simultaneously — this walks the actual
 * selected skill's ancestor chain instead. Since the anchor is now always
 * present, index 0 is always its link into the root (chain[0]).
 */
export function getActivePathOrder(activeSkill: Skill | null): Map<string, number> {
  const order = new Map<string, number>();
  if (!activeSkill) return order;

  const chain: Skill[] = [];
  let current: Skill | undefined = activeSkill;
  while (current) {
    chain.push(current);
    if (!current.parent) break;
    const parentId = current.parent;
    current = SKILLS.find(s => s.id === parentId);
  }
  chain.reverse(); // root ... selected
  chain.forEach((s, i) => order.set(s.id, i));
  return order;
}

function linkPixelLength(link: LayoutLink): number {
  return Math.abs(link.tx - link.sx) + Math.abs(link.ty - link.sy);
}

/** Only depth 0 (the root skills) is shown by default; every deeper layer collapses until its branch is selected. */
export function isDefaultVisibleDepth(depth: number): boolean {
  return depth < 1;
}

export function getChildSkills(skillId: string): Skill[] {
  return SKILLS.filter(s => s.parent === skillId);
}

export function getRootSkills(category: SkillCategory): Skill[] {
  return SKILLS.filter(s => s.category === category && s.parent === null);
}

export function getParentSkill(skill: Skill): Skill | null {
  return SKILLS.find(s => s.id === skill.parent) ?? null;
}

function buildChildrenMap(skills: Skill[]): Map<string, Skill[]> {
  const childrenOf = new Map<string, Skill[]>();
  skills.forEach(s => {
    if (s.parent === null) return;
    const arr = childrenOf.get(s.parent) ?? [];
    arr.push(s);
    childrenOf.set(s.parent, arr);
  });
  return childrenOf;
}

/**
 * Which skill pills are currently mounted for this category: the always-visible
 * depth-0/1 baseline, plus — for every skill in `expandedSkillIds` that is
 * ITSELF currently visible — that skill's DIRECT children only (one layer at
 * a time, not its whole subtree; a grandchild only appears once its own
 * parent has separately been added to `expandedSkillIds`). Computed as a
 * top-down BFS from the baseline so an entry that becomes unreachable (its
 * own parent got removed from the set) naturally stops contributing, with no
 * explicit pruning needed — see getNextExpandedSkillIds for how the set
 * changes on each selection.
 */
export function getVisibleSkillIds(category: SkillCategory, expandedSkillIds: Set<string>): Set<string> {
  const skills = SKILLS.filter(s => s.category === category);
  const depthOf = buildDepthMap(skills);
  const childrenOf = buildChildrenMap(skills);

  const visible = new Set<string>();
  const queue: Skill[] = [];
  skills.forEach(s => {
    if (isDefaultVisibleDepth(depthOf.get(s.id)!)) {
      visible.add(s.id);
      queue.push(s);
    }
  });

  while (queue.length) {
    const node = queue.shift()!;
    if (!expandedSkillIds.has(node.id)) continue;
    for (const child of childrenOf.get(node.id) ?? []) {
      if (!visible.has(child.id)) {
        visible.add(child.id);
        queue.push(child);
      }
    }
  }

  return visible;
}

/**
 * Next `expandedSkillIds` after clicking `skill`: only the path from its root down to it stays
 * open, so every other branch (siblings included, across all categories) collapses. Clicking a
 * skill that is already open leaves the set unchanged — a click never collapses its own branch.
 */
export function getNextExpandedSkillIds(expandedSkillIds: Set<string>, skill: Skill): Set<string> {
  if (expandedSkillIds.has(skill.id)) return expandedSkillIds;
  return getActivePathNodeIds(skill);
}

/**
 * Per-link duration + cumulative delay for a "branch growing outward" reveal
 * animation, BFS'd outward from the category's anchor so every currently
 * visible link (not just the single active-path highlight `getActivePathOrder`
 * covers) gets a delay equal to how long it takes the line to actually grow
 * out to it — segment N starts exactly when its parent segment finishes.
 * Consumed by `SkillTreeConnections.tsx` to sequence both the connector
 * draw-in/retract and the pill it leads to appearing/disappearing right as
 * the line reaches/leaves it. Pass only the currently-VISIBLE link set (not
 * the full static layout) so delays are relative to what's actually newly
 * appearing right now, not the whole tree's shape.
 */
export function getLinkRevealTiming(
  category: SkillCategory,
  links: LayoutLink[],
): Map<string, { duration: number; delay: number }> {
  const timing = new Map<string, { duration: number; delay: number }>();
  const childrenOfSource = new Map<string, LayoutLink[]>();
  links.forEach(l => {
    const arr = childrenOfSource.get(l.sourceId) ?? [];
    arr.push(l);
    childrenOfSource.set(l.sourceId, arr);
  });

  const anchorId = `${ANCHOR_PREFIX}${category}`;
  const queue: { sourceId: string; delay: number }[] = [{ sourceId: anchorId, delay: 0 }];
  while (queue.length) {
    const { sourceId, delay } = queue.shift()!;
    for (const link of childrenOfSource.get(sourceId) ?? []) {
      const duration = segmentDuration(linkPixelLength(link));
      timing.set(link.targetId, { duration, delay });
      queue.push({ sourceId: link.targetId, delay: delay + duration });
    }
  }

  return timing;
}

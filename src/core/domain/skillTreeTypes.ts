import type { LucideIcon } from 'lucide-react';
import { PenTool, Factory, Crown } from 'lucide-react';

export type SkillCategory = 'design' | 'production' | 'leadership';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  parent: string | null;
  description: string;
  projects: string[];
}

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  /** Shown in SkillDetailsPanel when the category badge itself is selected, not a specific skill within it — see SkillTree.tsx's handleSelectCategory. */
  description: string;
  /**
   * Drives `Badge`'s `color` prop in `SkillDetailsPanel.tsx` — Badge's colorMap
   * pulls from the SITE's shared --color-* tokens, a separate palette from this
   * category's own bgBase/bgTop/bgBottom/stroke/glow arcade hex below. For
   * `leadership` that's an exact match: its colors ARE the site's purple tokens.
   */
  color: 'coral' | 'sky' | 'butter' | 'mint' | 'periwinkle';
  stroke: string;
  bgBase: string;
  bgTop: string;
  bgBottom: string;
}

/**
 * Arcade accent palette — reused verbatim from the hex already live elsewhere
 * in the Gamified skin (Hero's AchievementShaderCanvas.tsx/FloatingIslandBackdrop.tsx,
 * widgets/EmergencyButton.tsx, widgets/ToggleSwitch.tsx) per Ketchapp_Casual_Style.md's
 * documented face/base pairs, rather than the tree's own previously-invented hex.
 * bgBase = fill color, bgBottom = the bevel's dark bottom line (pills and category badges
 * are the standard raised Button, colored via skilltree/arcadeStyle.ts's getArcadeButtonColor),
 * bgTop = lighter tint for the on-path outline, stroke = connector accent. No separate
 * glow color — the site avoids blur/glow effects. `leadership` reads the site's
 * purple tokens instead of literal hex, so it can't drift from the rest of the UI.
 */
export const CATEGORIES: Record<SkillCategory, CategoryConfig> = {
  design: {
    label: 'DESIGN',
    icon: PenTool,
    description: 'Shaping how a game plays, feels, and earns, from core systems and level craft to onboarding, economy, and interface, all grounded in research rather than guesswork.',
    color: 'butter',
    stroke: '#FACC15',
    bgBase: '#FACC15',
    bgTop: '#FDE047',
    bgBottom: '#CA8A04',
  },
  production: {
    label: 'PRODUCTION',
    icon: Factory,
    description: 'Running the machinery that turns a design into a shipped, live product: planning, pipelines, and documentation, plus the player-facing operations that keep a title healthy after launch.',
    color: 'sky',
    stroke: '#38BDF8',
    bgBase: '#38BDF8',
    bgTop: '#7DD3FC',
    bgBottom: '#0284C7',
  },
  leadership: {
    label: 'LEADERSHIP',
    icon: Crown,
    description: 'Directing people and priorities across concurrent teams: setting strategy and roadmaps, coordinating dependencies, and translating between creative vision and business reality.',
    color: 'periwinkle',
    stroke: 'var(--color-periwinkle)',
    bgBase: 'var(--color-periwinkle)',
    bgTop: 'var(--color-lilac)',
    bgBottom: 'var(--color-periwinkle-darkest)',
  },
};

export const SKILLS: Skill[] = [
  // DESIGN
  {
    id: 'system-design', name: 'System Design', category: 'design', parent: null,
    description: 'Architecting end-to-end systems that are internally consistent, predictable, and scalable, from feature sets to full product experiences.',
    projects: ['proj-fe-high-voltage', 'proj-lead-level-designer', 'proj-deca-rotmg', 'proj-idle-td', 'proj-newton-slots', 'proj-clash-of-towers', 'proj-fitkin', 'proj-castellum', 'proj-alphabetty-saga', 'proj-marble-frenzy-2', 'proj-bounzy', 'proj-newgrounds'],
  },
  {
    id: 'game-design', name: 'Game Design', category: 'design', parent: 'system-design',
    description: 'Designing core loops, game modes, and feature systems that balance engagement with long-term retention.',
    projects: ['proj-fe-high-voltage', 'proj-idle-td', 'proj-newton-slots', 'proj-deca-rotmg', 'proj-castellum', 'proj-clash-of-towers', 'proj-fitkin', 'proj-alphabetty-saga', 'proj-marble-frenzy-2', 'proj-bounzy', 'proj-newgrounds'],
  },
  {
    id: 'level-design', name: 'Level Design', category: 'design', parent: 'game-design',
    description: 'Crafting and producing levels at scale, from handcrafted puzzles to pipelines delivering thousands.',
    projects: ['proj-lead-level-designer', 'proj-idle-td', 'proj-merge-mansion', 'proj-bubble-witch-saga', 'proj-alphabetty-saga', 'proj-bounzy'],
  },
  {
    id: 'balancing', name: 'Balancing', category: 'design', parent: 'game-design',
    description: 'Tuning difficulty curves, enemy and level stats, and content pacing to keep challenge fair across a full progression arc.',
    projects: ['proj-idle-td', 'proj-lead-level-designer', 'proj-merge-mansion', 'proj-bubble-witch-saga', 'proj-fe-high-voltage', 'proj-newton-slots', 'proj-alphabetty-saga', 'proj-bounzy', 'proj-deca-rotmg'],
  },
  {
    id: 'economy-design', name: 'Economy Design', category: 'design', parent: 'game-design',
    description: 'Balancing in-game economies: currency generators and sinks, drop rates, payout formulas, progression curves, and NFT asset integration.',
    projects: ['proj-idle-td', 'proj-clash-of-towers', 'proj-castellum', 'proj-bounzy'],
  },
  {
    id: 'monetization', name: 'Monetization', category: 'design', parent: 'game-design',
    description: 'Designing monetization systems: IAP pack pricing and discount structures, loot boxes, payout formulas, and progression gates.',
    projects: ['proj-newton-slots', 'proj-idle-td', 'proj-clash-of-towers', 'proj-castellum', 'proj-marble-frenzy-2', 'proj-bounzy'],
  },
  {
    id: 'gamification', name: 'Gamification', category: 'design', parent: 'game-design',
    description: 'Applying game mechanics (rewards, quests, progression) to non-game contexts to drive engagement and behavior change.',
    projects: ['proj-idle-td', 'proj-newton-slots', 'proj-fitkin'],
  },
  {
    id: 'prototyping', name: 'Prototyping', category: 'design', parent: null,
    description: 'Building rapid prototypes to validate mechanics, loops, and design decisions before committing to full implementation.',
    projects: ['proj-idle-td', 'proj-castellum', 'proj-newgrounds', 'proj-clash-of-towers', 'proj-marble-frenzy-2', 'proj-bounzy'],
  },
  {
    id: 'meta-core-loops', name: 'Meta Core Loops', category: 'design', parent: 'game-design',
    description: 'Designing the session-to-session meta loop (long-term goals, unlocks, and progression systems that pull players back) and iterating on it post-launch using live performance data.',
    projects: ['proj-idle-td', 'proj-fe-high-voltage', 'proj-newton-slots', 'proj-clash-of-towers', 'proj-castellum', 'proj-marble-frenzy-2', 'proj-bounzy', 'proj-newgrounds'],
  },
  {
    id: 'web-design', name: 'Layout Design', category: 'design', parent: 'system-design',
    description: 'Designing digital interfaces and systems for web and app-based products, spanning UI, UX, and design system architecture.',
    projects: ['proj-fitkin', 'proj-castellum', 'proj-idle-td'],
  },
  {
    id: 'ui-design', name: 'UI Design', category: 'design', parent: 'web-design',
    description: 'Crafting visual interfaces with strong aesthetic direction: typography, color, component hierarchy, and screen composition guided by the user flow.',
    projects: ['proj-castellum', 'proj-idle-td', 'proj-clash-of-towers', 'proj-marble-frenzy-2', 'proj-bounzy', 'proj-newgrounds'],
  },
  {
    id: 'ux-design', name: 'UX Design', category: 'design', parent: 'web-design',
    description: 'Designing screen flows, interaction patterns, and interface logic for mobile-first game and product experiences.',
    projects: ['proj-castellum', 'proj-idle-td', 'proj-clash-of-towers', 'proj-marble-frenzy-2', 'proj-bounzy', 'proj-deca-rotmg'],
  },
  {
    id: 'ftue-onboarding', name: 'FTUE & Onboarding', category: 'design', parent: 'web-design',
    description: 'Owning the end-to-end first-time user experience: onboarding strategy, tutorial sequencing, and the cadence of introducing new mechanics to new players.',
    projects: ['proj-idle-td', 'proj-alphabetty-saga', 'proj-clash-of-towers', 'proj-castellum', 'proj-marble-frenzy-2', 'proj-bounzy'],
  },
  {
    id: 'design-systems', name: 'Design Systems', category: 'design', parent: 'web-design',
    description: 'Designing the complete design system for a digital product or game: token architecture, component libraries, and visual/interaction consistency end-to-end.',
    projects: ['proj-idle-td'],
  },
  {
    id: 'research', name: 'Research', category: 'design', parent: null,
    description: 'Conducting competitive analysis, domain research, and player behavior research to ground design in evidence.',
    projects: ['proj-fe-high-voltage', 'proj-lead-level-designer', 'proj-merge-mansion', 'proj-newton-slots', 'proj-fitkin', 'proj-castellum', 'proj-alphabetty-saga'],
  },

  // PRODUCTION
  {
    id: 'backlog-mgmt', name: 'Backlog Mgmt', category: 'production', parent: 'agile-planning',
    description: 'Prioritizing and refining feature backlogs across concurrent game production tracks and multiple teams.',
    projects: ['proj-lead-level-designer', 'proj-idle-td', 'proj-clash-of-towers', 'proj-castellum'],
  },
  {
    id: 'agile-planning', name: 'Agile Planning', category: 'production', parent: 'project-mgmt',
    description: 'Running sprints, standups, and iterative delivery cycles across multi-team game production environments.',
    projects: ['proj-lead-level-designer', 'proj-idle-td', 'proj-clash-of-towers', 'proj-castellum'],
  },
  {
    id: 'documentation', name: 'Documentation', category: 'production', parent: 'agile-planning',
    description: 'Writing GDDs, design specs, process guides, and standardized procedures that outlast the project.',
    projects: ['proj-lead-level-designer', 'proj-fe-high-voltage', 'proj-idle-td', 'proj-alphabetty-saga', 'proj-fitkin', 'proj-castellum', 'proj-deca-rotmg', 'proj-newton-slots', 'proj-clash-of-towers'],
  },
  {
    id: 'standards-patterns', name: 'Standards & Patterns', category: 'production', parent: 'agile-planning',
    description: 'Identifying recurring patterns across a project and codifying them into heuristic rules and standards that ensure systemic coherence and predictability.',
    projects: ['proj-lead-level-designer'],
  },
  {
    id: 'project-mgmt', name: 'Project Mgmt', category: 'production', parent: null,
    description: 'Owning project timelines and milestone planning for game and software delivery end-to-end.',
    projects: ['proj-lead-level-designer', 'proj-idle-td', 'proj-clash-of-towers', 'proj-castellum', 'proj-marble-frenzy-2', 'proj-bounzy'],
  },
  {
    id: 'pipeline-design', name: 'Pipeline Design', category: 'production', parent: 'project-mgmt',
    description: 'Designing the production pipeline itself: the shared workflow, framework, and sprint methodology a team operates under.',
    projects: ['proj-lead-level-designer'],
  },
  {
    id: 'player-ops', name: 'Player Ops', category: 'production', parent: null,
    description: 'Owning the player-facing side of a live game: community, marketing, live operations, and the data that measures whether it’s all working.',
    projects: ['proj-idle-td', 'proj-deca-rotmg'],
  },
  {
    id: 'live-ops', name: 'Live Ops', category: 'production', parent: 'player-ops',
    description: 'Running the live-service content cadence for continuously operated titles: event scheduling, live balancing, and retention-driven updates post-launch.',
    projects: ['proj-deca-rotmg', 'proj-lead-level-designer', 'proj-idle-td', 'proj-alphabetty-saga'],
  },
  {
    id: 'marketing', name: 'Marketing', category: 'production', parent: 'community-mgmt',
    description: 'Producing promotional content and running campaigns that build awareness and drive acquisition for a shipped title.',
    projects: ['proj-idle-td', 'proj-castellum', 'proj-marble-frenzy-2', 'proj-bounzy'],
  },
  {
    id: 'community-mgmt', name: 'Community Mgmt', category: 'production', parent: 'player-ops',
    description: 'Listening to and engaging an existing player base directly: moderating community channels, responding to feedback, and folding it back into design decisions.',
    projects: ['proj-idle-td', 'proj-castellum'],
  },
  {
    id: 'kpi-tracking', name: 'KPI Tracking', category: 'production', parent: 'player-ops',
    description: 'Defining the metrics that measure a live game’s success and using the resulting data to drive design decisions, from onboarding tuning to core and meta loop redesigns.',
    projects: ['proj-alphabetty-saga', 'proj-idle-td', 'proj-lead-level-designer'],
  },
  {
    id: 'ab-testing', name: 'A/B Testing', category: 'production', parent: 'kpi-tracking',
    description: 'Running controlled experiments, like parallel onboarding difficulty tracks, to measure impact on retention and engagement before committing to a single design.',
    projects: ['proj-alphabetty-saga', 'proj-idle-td', 'proj-deca-rotmg'],
  },

  // LEADERSHIP
  {
    id: 'team-leadership', name: 'Team Leadership', category: 'leadership', parent: null,
    description: 'Building and leading 5 teams and training 12 designers: setting direction, unblocking, and maintaining quality.',
    projects: ['proj-lead-level-designer', 'proj-fe-high-voltage', 'proj-castellum', 'proj-clash-of-towers', 'proj-idle-td', 'proj-marble-frenzy-2', 'proj-bounzy'],
  },
  {
    id: 'strategy', name: 'Strategy', category: 'leadership', parent: 'team-leadership',
    description: 'Defining the holistic strategy for a game as a product: core pillars and design direction, economy, live events, monetization, release cadence, and the KPIs used to track it all end-to-end.',
    projects: ['proj-idle-td', 'proj-lead-level-designer', 'proj-castellum', 'proj-marble-frenzy-2', 'proj-bounzy'],
  },
  {
    id: 'coaching', name: 'Coaching', category: 'leadership', parent: 'cross-team-coord',
    description: 'Training junior designers from scratch: 12 Level Designers trained from QA staff, brought from onboarding to production-ready.',
    projects: ['proj-lead-level-designer', 'proj-alphabetty-saga'],
  },
  {
    id: 'roadmapping', name: 'Roadmapping', category: 'leadership', parent: 'strategy',
    description: 'Defining phased delivery plans that sequence features by risk, dependency, and business value.',
    projects: ['proj-lead-level-designer', 'proj-idle-td', 'proj-clash-of-towers', 'proj-castellum'],
  },
  {
    id: 'cross-team-coord', name: 'Coordination', category: 'leadership', parent: 'team-leadership',
    description: 'Acting as lead coordinator across 5 teams, synchronizing dependencies and keeping production lanes unblocked.',
    projects: ['proj-lead-level-designer'],
  },
  {
    id: 'stakeholder-comms', name: 'Stakeholder Comms', category: 'leadership', parent: 'cross-team-coord',
    description: 'Managing client relationships and translating between creative vision and business requirements.',
    projects: ['proj-lead-level-designer', 'proj-fe-high-voltage'],
  },
  {
    id: 'cross-functional-comms', name: 'Cross-Functional Comms', category: 'leadership', parent: 'cross-team-coord',
    description: 'Coordinating laterally across art, development, and QA to keep departments aligned and working efficiently toward the same delivery.',
    projects: ['proj-fitkin', 'proj-lead-level-designer', 'proj-fe-high-voltage', 'proj-alphabetty-saga', 'proj-bubble-witch-saga'],
  },
];

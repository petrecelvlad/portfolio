import { Gamepad2, Linkedin, Mail, Network, type LucideIcon } from 'lucide-react';
import { Row } from '@/src/components/atoms/Row';
import { Button, BUTTON_COLORS, type ButtonColor } from '@/src/components/atoms/Button';
import type { PageSection } from '@/src/hooks/useTimelineOrchestrator';
import { BOARD_COLOR } from '@/src/components/bento/shared/palette';
import {
  OUTLINE_COLOR, OUTLINE_WIDTH, BOARD_HIGHLIGHT_COLOR, BOARD_ELEVATION_COLOR,
  HIGHLIGHT_HEIGHT_PX, ELEVATION_HEIGHT_PX,
} from '@/src/components/bento/shared/WoodPlankConstants';
import { PlankGrain } from '@/src/components/bento/shared/PlankGrain';

const NAV_ITEMS: { label: string; section: PageSection; Icon: LucideIcon; color: ButtonColor }[] = [
  { label: 'Skilltree', section: 'skills', Icon: Network, color: BUTTON_COLORS.butter },
  { label: 'Projects', section: 'projects', Icon: Gamepad2, color: BUTTON_COLORS.mint },
  { label: 'Contact', section: 'contact', Icon: Mail, color: BUTTON_COLORS.coral },
];

interface NavbarProps {
  activeSection: PageSection;
  onNavigate: (section: PageSection) => void;
}

function ProfileLinks() {
  return (
    <Row align="center" gap="sm">
      <Button
        href="https://www.astrocade.com/profile/Octo"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Astrocade"
        color={BUTTON_COLORS.white}
      >
        <img src={`${import.meta.env.BASE_URL}assets/icons/astrocade.webp`} alt="" className="w-4 h-4" />
      </Button>
      <Button
        href="https://www.linkedin.com/in/vladpetrebiz/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        color={BUTTON_COLORS.linkedin}
        className="text-white"
      >
        <Linkedin className="w-4 h-4" />
      </Button>
    </Row>
  );
}

// Tablet and up: section links as carved text. Mobile: the section links become icon buttons, one
// color each, centered in the bar; the grid's equal side columns keep them centered, and only shift
// them right when the name is wider than its half (the narrowest phones).
export function Navbar({ activeSection, onNavigate }: NavbarProps) {
  return (
    <nav
      className="h-[var(--chrome-navbar-height)] flex-shrink-0 relative w-full z-50 flex flex-col"
      style={{ backgroundColor: OUTLINE_COLOR, padding: OUTLINE_WIDTH }}
    >
      <div style={{ height: `${HIGHLIGHT_HEIGHT_PX}px`, backgroundColor: BOARD_HIGHLIGHT_COLOR }} aria-hidden />
      <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: BOARD_COLOR }}>
        <PlankGrain vertical={false} />
        <div className="absolute inset-0 grid grid-cols-[1fr_auto_1fr] gap-x-2 items-center tablet:flex tablet:justify-between px-[var(--tier-gutter)] tablet:px-8">
          <button
            type="button"
            onClick={() => onNavigate('hero')}
            // Outline unit = text size / the Hero title's 96px, so the outline keeps the Hero's proportions.
            // 26px on mobile so the name and five buttons fit a 360px-wide phone.
            className="justify-self-start whitespace-nowrap font-jersey font-bold text-[26px] tablet:text-3xl uppercase tracking-wider leading-none pixel-text-outline [--pixel-outline-unit:calc(26px/96)] tablet:[--pixel-outline-unit:0.3125px] cursor-pointer"
          >
            Vlad Petre
          </button>

          <Row align="center" gap="xl" className="hidden tablet:flex laptop:absolute laptop:left-1/2 laptop:-translate-x-1/2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => onNavigate(item.section)}
                aria-current={activeSection === item.section ? 'location' : undefined}
                className={`carved-text text-[22px] leading-none cursor-pointer ${activeSection === item.section ? 'carved-text-selected' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </Row>

          <Row align="center" gap="sm" className="tablet:hidden">
            {NAV_ITEMS.map(({ label, section, Icon, color }) => (
              <Button
                key={section}
                onClick={() => onNavigate(section)}
                aria-label={label}
                aria-current={activeSection === section ? 'location' : undefined}
                color={color}
                className="text-ink-base"
                // Same selected mark as the skill tree's active pill.
                style={activeSection === section ? { outline: '2px solid #FFFFFF' } : undefined}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
          </Row>
          <div className="justify-self-end">
            <ProfileLinks />
          </div>
        </div>
      </div>
      <div style={{ height: `${ELEVATION_HEIGHT_PX}px`, backgroundColor: BOARD_ELEVATION_COLOR }} aria-hidden />
    </nav>
  );
}


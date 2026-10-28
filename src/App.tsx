/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, useMemo, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { IExperience } from '@/src/core/domain/models';
import { JsonExperienceRepository } from '@/src/adapters/secondary/JsonExperienceRepo';
import { Navbar } from '@/src/adapters/primary/components/Navbar';
import type { PageSection, PageSectionRefs } from '@/src/hooks/useTimelineOrchestrator';
import { Hero } from '@/src/adapters/primary/components/Hero';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { IslandPositionProvider } from '@/src/context/IslandPositionContext';
import { IslandPositionPanel } from '@/src/components/IslandPositionPanel';
import { ContactEmail } from '@/src/components/ContactEmail';
import { contactEmail } from '@/src/adapters/secondary/contact';
import { Circle, Square, Triangle, Linkedin } from 'lucide-react';

// Below-the-fold sections — kept out of the initial bundle so Hero can
// paint before their JS (and the libraries they pull in)
// has to download/parse.
const SkillTree = lazy(() => import('@/src/adapters/primary/components/SkillTree').then(m => ({ default: m.SkillTree })));
const Timeline = lazy(() => import('@/src/adapters/primary/components/Timeline').then(m => ({ default: m.Timeline })));

export default function App() {
  const [experiences, setExperiences] = useState<IExperience[]>([]);
  const repo = new JsonExperienceRepository();
  const mainRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const sectionRefs = useMemo<PageSectionRefs>(() => ({ skills: skillsRef, projects: projectsRef, contact: contactRef }), []);
  // Mirrors the Timeline orchestrator's activeSection (fed by onActiveSectionChange); never set anywhere else.
  const [activeSection, setActiveSection] = useState<PageSection>('hero');

  useEffect(() => {
    repo.getAllExperiences().then(setExperiences);
  }, []);

  const navigateTo = (section: PageSection) => {
    const top = section === 'hero' ? 0 : sectionRefs[section].current?.offsetTop ?? 0;
    mainRef.current?.scrollTo({ top, behavior: 'instant' });
  };

  return (
    <IslandPositionProvider>
      <div className="bg-bg text-text h-screen overflow-hidden flex flex-col relative">
        <Helmet>
          <title>Vlad Petre | Senior Game Designer Portfolio</title>
        </Helmet>

        <Navbar activeSection={activeSection} onNavigate={navigateTo} />
        <IslandPositionPanel />

        <main ref={mainRef} className="flex-1 w-full relative overflow-y-auto tablet:snap-y tablet:snap-mandatory select-none">
          <div className="snap-start snap-always min-h-[calc(100vh-var(--chrome-navbar-height))] tablet:h-[calc(100vh-var(--chrome-navbar-height))] w-full flex flex-col relative z-0">
            <ErrorBoundary>
              <Hero />
            </ErrorBoundary>
          </div>
          {/* The skills slot sits outside Suspense so it exists from first paint: without it, a scroll
              before the lazy chunks arrive snaps straight to the footer, the only section after Hero. */}
          <div ref={skillsRef} className="snap-start snap-always min-h-[calc(100vh-var(--chrome-navbar-height))] tablet:h-[calc(100vh-var(--chrome-navbar-height))] w-full relative z-0 flex flex-col">
            <Suspense fallback={null}>
              <SkillTree experiences={experiences} />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <Timeline
              ref={projectsRef}
              experiences={experiences}
              containerRef={mainRef}
              sectionRefs={sectionRefs}
              onActiveSectionChange={setActiveSection}
            />
          </Suspense>
          
          <footer ref={contactRef} className="footer-snap snap-start snap-always bg-surface-inverse text-surface-base px-[var(--tier-gutter)] py-14 tablet:px-8 tablet:py-20 border-t-[length:var(--border-width-lg)] border-ink-base relative overflow-hidden tablet:h-[calc(100vh-var(--chrome-navbar-height))] flex flex-col justify-center">
            {/* Background Decorative Shape */}
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-coral/10 rounded-full -mr-48 -mb-48" />

            <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center gap-8 tablet:gap-12">
              <div className="flex gap-4">
                 <Circle className="w-12 h-12 fill-coral text-ink-base" />
                 <Square className="w-12 h-12 fill-sky text-ink-base" />
                 <Triangle className="w-12 h-12 fill-butter text-ink-base" />
              </div>

              <div className="text-center">
                <div className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">VLAD PETRE</div>
                <div className="font-display text-lg font-bold uppercase tracking-[0.4em] text-surface-base/50 italic">
                  Making <span className="text-periwinkle">APPS</span> that make you H<span className="text-periwinkle">APP</span>Y!
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <ContactEmail email={contactEmail} />
                <a
                  href="https://www.linkedin.com/in/vladpetrebiz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.3em] text-surface-base/50 hover:text-periwinkle transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  LinkedIn
                </a>
              </div>

              <div className="font-mono pt-10 tablet:pt-20 border-t border-surface-base/10 w-full text-center text-xs font-bold uppercase tracking-[0.2em] tablet:tracking-[0.5em] text-surface-base/30">
                &copy; {new Date().getFullYear()} Vlad Petre &bull; Game Designer &amp; Producer
              </div>
            </div>
          </footer>
        </main>
      </div>
    </IslandPositionProvider>
  );
}


'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

import IntroPanel, { type IntroPanelHandle } from '../components/IntroPanel';
import { ScrollInterfaceService, type ScrollState } from '../services/ScrollInterfaceService';
import dynamic from 'next/dynamic';
import { type BackgroundCanvasRef } from '../components/BackgroundCanvas';

const BackgroundCanvas = dynamic(() => import('../components/BackgroundCanvas'), { ssr: false });

gsap.registerPlugin(useGSAP, ScrollToPlugin);

const SECTIONS = ['Intro', 'Education', 'Experience', 'About', 'Contacts'] as const;

export default function Page() {
  // ── DOM refs ──────────────────────────────────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);

  // ── Service refs (not React state — never trigger re-render) ──────────────
  const scrollServiceRef = useRef<ScrollInterfaceService | null>(null);
  const introPanelRef = useRef<IntroPanelHandle>(null);
  const backgroundCanvasRef = useRef<BackgroundCanvasRef>(null);
  const prevSectionRef = useRef<number>(0);

  // ── UI state (only what needs to re-render) ───────────────────────────────
  const [scrollState, setScrollState] = useState<ScrollState>({
    progress: 0,
    activeSection: 0,
    sectionProgress: 0,
  });

  // ── Pointer handler — fed to all services ─────────────────────────────────
  const handlePointerMove = useCallback((e: PointerEvent) => {
    introPanelRef.current?.updatePointer(e.clientX, e.clientY);
    backgroundCanvasRef.current?.updatePointer(e.clientX, e.clientY);
  }, []);

  // ── Register IntroPanel DOM element as panel[0] ──────────────────────────
  // useImperativeHandle runs after render; we collect containerEl here.
  const [introPanelReady, setIntroPanelReady] = useState(false);

  useEffect(() => {
    if (introPanelRef.current?.containerEl) {
      panelRefs.current[0] = introPanelRef.current.containerEl;
      setIntroPanelReady(true);
    }
  }, []);

  // ── Init ScrollInterfaceService after mount ───────────────────────────────
  useGSAP(() => {
    if (!introPanelReady) return;
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    const panels = panelRefs.current.filter(Boolean) as HTMLElement[];

    if (!wrapper || !track || panels.length !== SECTIONS.length) return;

    scrollServiceRef.current = new ScrollInterfaceService(
      wrapper,
      track,
      panels,
      (state) => setScrollState(state),
    );

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      scrollServiceRef.current?.destroy();
      scrollServiceRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handlePointerMove, introPanelReady]);

  // ── Navigate to section on nav click ──────────────────────────────────────
  const handleNavClick = useCallback((index: number) => {
    scrollServiceRef.current?.scrollToSection(index);
  }, []);

  // ── Morph particles on section change ────────────────────────────────────
  useEffect(() => {
    const { activeSection, sectionProgress } = scrollState;

    // Scroll-scrub: morph toward the NEXT section proportionally
    const nextSection = Math.min(activeSection + 1, SECTIONS.length - 1);
    if (sectionProgress > 0 && nextSection !== activeSection) {
      backgroundCanvasRef.current?.morphTo(nextSection, sectionProgress);
    }

    // Trigger full morph on discrete section change
    if (activeSection !== prevSectionRef.current) {
      prevSectionRef.current = activeSection;
      backgroundCanvasRef.current?.morphTo(activeSection);
    }
  }, [scrollState]);

  // ── Panel ref collector helper ─────────────────────────────────────────────
  const setPanelRef = (index: number) => (el: HTMLElement | null) => {
    panelRefs.current[index] = el;
  };

  const stepLabel = `[STEP.0${scrollState.activeSection + 1}/05]`;

  return (
    <>
      <BackgroundCanvas ref={backgroundCanvasRef} />
      {/* ── Fixed Header ──────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-300"
        style={{
          height: '60px',
          padding: '0 var(--space-12)',
          background: scrollState.activeSection === 0
            ? 'rgba(250,250,250,0)'
            : 'rgba(250,250,250,0.4)',
          backdropFilter: scrollState.activeSection === 0
            ? 'blur(0px)'
            : 'blur(12px)',
          borderBottom: scrollState.activeSection === 0
            ? '0.5px solid transparent'
            : '0.5px solid var(--color-border)',
        }}
      >
        <span
          className="font-mono text-xs tracking-widest"
          style={{ color: 'var(--color-primary)', letterSpacing: 'var(--tracking-ui)' }}
        >
          DV.SYS
        </span>

        <nav
          className="flex gap-8 transition-all duration-300"
          style={{
            opacity: scrollState.activeSection === 0 ? 0 : 1,
            pointerEvents: scrollState.activeSection === 0 ? 'none' : 'auto',
            transform: scrollState.activeSection === 0 ? 'translateY(-10px)' : 'translateY(0)',
          }}
        >
          {SECTIONS.map((name, i) => (
            <button
              key={name}
              onClick={() => handleNavClick(i)}
              className="font-display text-sm font-medium transition-colors duration-200"
              style={{
                color: scrollState.activeSection === i
                  ? 'var(--color-accent)'
                  : 'var(--color-secondary)',
                letterSpacing: '0.05em',
                background: 'none',
                border: 'none',
                borderBottom: scrollState.activeSection === i
                  ? '1px solid var(--color-accent)'
                  : '1px solid transparent',
                cursor: 'pointer',
                padding: '2px 0',
              }}
            >
              {name}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Scroll Wrapper (height = 500vh drives the scroll distance) ───── */}
      <div ref={wrapperRef} id="scroll-wrapper" className="relative w-full h-[500vh]">

        {/* Sticky viewport */}
        <div
          ref={viewportRef}
          id="viewport"
          className="sticky top-0 left-0 w-screen h-screen overflow-hidden"
        >
          {/* Horizontal track */}
          <div
            ref={trackRef}
            id="horizontal-track"
            className="flex h-full will-change-transform"
            style={{ width: `${SECTIONS.length * 100}vw` }}
          >

            {/* Panel 0 — Intro (video scrub + DotGrid + Navigator) */}
            <IntroPanel ref={introPanelRef} onNavClick={handleNavClick} />

            {/* Panel 1 — Education */}
            <section
              ref={setPanelRef(1)}
              id="education"
              className="panel w-screen h-full flex-none flex items-center justify-center"
              style={{ background: 'var(--color-background)' }}
            >
              <div style={{ padding: 'var(--space-12)' }}>
                <p className="font-mono text-xs mb-4" style={{ color: 'var(--color-secondary)', letterSpacing: 'var(--tracking-ui)' }}>
                  [STEP.02/05] — Education
                </p>
                <h2 className="font-display font-bold" style={{ fontSize: 'var(--text-h1)', color: 'var(--color-primary)' }}>
                  Education
                </h2>
              </div>
            </section>

            {/* Panel 2 — Experience */}
            <section
              ref={setPanelRef(2)}
              id="experience"
              className="panel w-screen h-full flex-none flex items-center justify-center"
              style={{ background: 'var(--color-background)' }}
            >
              <div style={{ padding: 'var(--space-12)' }}>
                <p className="font-mono text-xs mb-4" style={{ color: 'var(--color-secondary)', letterSpacing: 'var(--tracking-ui)' }}>
                  [STEP.03/05] — Experience
                </p>
                <h2 className="font-display font-bold" style={{ fontSize: 'var(--text-h1)', color: 'var(--color-primary)' }}>
                  Experience
                </h2>
              </div>
            </section>

            {/* Panel 3 — About */}
            <section
              ref={setPanelRef(3)}
              id="about"
              className="panel w-screen h-full flex-none flex items-center justify-center"
              style={{ background: 'var(--color-background)' }}
            >
              <div style={{ padding: 'var(--space-12)' }}>
                <p className="font-mono text-xs mb-4" style={{ color: 'var(--color-secondary)', letterSpacing: 'var(--tracking-ui)' }}>
                  [STEP.04/05] — About
                </p>
                <h2 className="font-display font-bold" style={{ fontSize: 'var(--text-h1)', color: 'var(--color-primary)' }}>
                  About
                </h2>
              </div>
            </section>

            {/* Panel 4 — Contacts */}
            <section
              ref={setPanelRef(4)}
              id="contacts"
              className="panel w-screen h-full flex-none flex items-center justify-center"
              style={{ background: 'var(--color-background)' }}
            >
              <div style={{ padding: 'var(--space-12)' }}>
                <p className="font-mono text-xs mb-4" style={{ color: 'var(--color-secondary)', letterSpacing: 'var(--tracking-ui)' }}>
                  [STEP.05/05] — Contacts
                </p>
                <h2 className="font-display font-bold" style={{ fontSize: 'var(--text-h1)', color: 'var(--color-primary)' }}>
                  Contacts
                </h2>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ── Fixed Scroll Progress Indicator ──────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Progress line */}
        <div
          className="relative h-px"
          style={{ background: 'var(--color-border)' }}
        >
          <div
            className="absolute top-0 left-0 h-full transition-none"
            style={{
              width: `${scrollState.progress * 100}%`,
              background: 'var(--color-primary)',
            }}
          />
        </div>

        {/* Step label */}
        <div
          className="absolute bottom-2 right-0 font-mono text-xs"
          style={{
            color: 'var(--color-secondary)',
            padding: 'var(--space-3) var(--space-4)',
            letterSpacing: 'var(--tracking-ui)',
          }}
        >
          {stepLabel}
        </div>
      </div>
    </>
  );
}

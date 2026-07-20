'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import dynamic from 'next/dynamic';

import IntroPanel, { type IntroPanelHandle } from '../components/IntroPanel';
import { ScrollInterfaceService, type ScrollState } from '../services/ScrollInterfaceService';
import { VideoInteractionService } from '../services/VideoInteractionService';
import type { BackgroundCanvasRef } from '../components/BackgroundCanvas';
import contentData from '../data/content.json';

import { Header } from '../components/ui/Header/Header';
import { ScrollProgressIndicator } from '../components/ui/ScrollProgressIndicator/ScrollProgressIndicator';
import { TimelineItem } from '../components/ui/TimelineItem/TimelineItem';
import { SkillTag } from '../components/ui/SkillTag/SkillTag';
import { CtaButton } from '../components/ui/CtaButton/CtaButton';

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
  const videoServiceRef = useRef<VideoInteractionService | null>(null);
  const prevSectionRef = useRef<number>(0);

  // ── UI state (only what needs to re-render) ───────────────────────────────
  const [scrollState, setScrollState] = useState<ScrollState>({
    progress: 0,
    activeSection: 0,
    sectionProgress: 0,
  });

  // ── Mobile detection (SSR-safe, updated on mount) ───────────────────────────
  const [isMobile, setIsMobile] = useState(false);

  // ── Pointer throttle — ~60fps cap to avoid overloading RAF ──────────────────
  const lastPointerTimeRef = useRef(0);
  const POINTER_THROTTLE_MS = 16; // ≈ 60 fps

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const now = performance.now();
    if (now - lastPointerTimeRef.current < POINTER_THROTTLE_MS) return;
    lastPointerTimeRef.current = now;
    backgroundCanvasRef.current?.updatePointer(e.clientX, e.clientY);
    videoServiceRef.current?.updatePointer(e.clientX, e.clientY);
  }, []);

  // ── Register IntroPanel DOM element as panel[0] ──────────────────────────
  const [introPanelReady, setIntroPanelReady] = useState(false);

  useEffect(() => {
    // Detect mobile on mount (client-only)
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onMqChange);

    if (introPanelRef.current?.containerEl) {
      panelRefs.current[0] = introPanelRef.current.containerEl;
      setIntroPanelReady(true);
    }

    return () => mq.removeEventListener('change', onMqChange);
  }, []);

  // ── Init Services after mount ───────────────────────────────
  useGSAP(() => {
    if (!introPanelReady) return;
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    const panels = panelRefs.current.filter(Boolean) as HTMLElement[];

    if (!wrapper || !track || panels.length !== SECTIONS.length) return;

    // 1. Init Scroll Service — desktop only (≥ 768px)
    if (!isMobile) {
      scrollServiceRef.current = new ScrollInterfaceService(
        wrapper,
        track,
        panels,
        (state) => setScrollState(state),
      );

      const scrollTween = scrollServiceRef.current.scrollTween;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!reduced && scrollTween) {
        panels.forEach((panel, i) => {
          if (i === 0) return;
          const elements = panel.querySelectorAll('.animate-entrance');
          if (elements.length > 0) {
            gsap.from(elements, {
              opacity: 0,
              y: 24,
              duration: 0.5,
              stagger: 0.08,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: panel,
                start: 'left 85%',
                horizontal: true,
                containerAnimation: scrollTween,
              }
            });
          }
        });
      }
    }

    // 2. Init Video Interaction Service
    const videoEl = introPanelRef.current?.videoEl;
    const videoWrapEl = introPanelRef.current?.videoWrapEl;
    if (videoEl && videoWrapEl) {
      videoServiceRef.current = new VideoInteractionService(videoEl, videoWrapEl);
    }

    // 3. Pointer move global listener
    window.addEventListener('pointermove', handlePointerMove);

    // 4. ResizeObserver — keeps Three.js canvas in sync with viewport size
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      backgroundCanvasRef.current?.resize(width, height);
    });
    resizeObserver.observe(document.documentElement);

    return () => {
      scrollServiceRef.current?.destroy();
      scrollServiceRef.current = null;
      videoServiceRef.current?.destroy();
      videoServiceRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
    };
  }, [handlePointerMove, introPanelReady, isMobile]);

  // ── Navigate to section on nav click ──────────────────────────────────────
  const handleNavClick = useCallback((index: number) => {
    scrollServiceRef.current?.scrollToSection(index);
  }, []);

  // ── Morph particles on section change ────────────────────────────────────
  useEffect(() => {
    const { activeSection, sectionProgress } = scrollState;

    const nextSection = Math.min(activeSection + 1, SECTIONS.length - 1);
    if (sectionProgress > 0 && nextSection !== activeSection) {
      backgroundCanvasRef.current?.morphTo(nextSection, sectionProgress);
    }

    if (activeSection !== prevSectionRef.current) {
      prevSectionRef.current = activeSection;
      backgroundCanvasRef.current?.morphTo(activeSection);
    }
  }, [scrollState]);

  const setPanelRef = (index: number) => (el: HTMLElement | null) => {
    panelRefs.current[index] = el;
  };

  return (
    <>
      <BackgroundCanvas ref={backgroundCanvasRef} />
      
      {/* ── Fixed Header ──────────────────────────────────────────────────── */}
      <Header 
        activeSectionIndex={scrollState.activeSection} 
        sections={SECTIONS} 
        onNavClick={handleNavClick} 
      />

      {/* ── Scroll Wrapper ────────────────────────────────────────────────── */}
      <div ref={wrapperRef} id="scroll-wrapper" className={`relative w-full ${isMobile ? 'h-auto' : 'h-[500vh]'}`}>
        <div ref={viewportRef} id="viewport" className="sticky top-0 left-0 w-screen h-screen overflow-hidden">
          <div
            ref={trackRef}
            id="horizontal-track"
            className="flex h-full will-change-transform"
            style={{ width: `${SECTIONS.length * 100}vw` }}
          >

            {/* Panel 0 — Intro */}
            <IntroPanel ref={introPanelRef} onNavClick={handleNavClick} />

            {/* Panel 1 — Education */}
            <section
              ref={setPanelRef(1)}
              id="education"
              className="panel w-screen h-full flex-none flex items-center"
              style={{ background: 'var(--color-background)', paddingLeft: '10vw' }}
            >
              <div className="max-w-4xl" data-speed="0.2">
                <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary animate-entrance">
                  [STEP.02/05] — Education
                </p>
                <h2 className="font-display font-bold uppercase mb-16 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
                  {contentData.education.header}
                </h2>
                
                <div className="flex flex-col gap-12">
                  {contentData.education.items.map((item, idx) => (
                    <div key={idx} className="border-l border-border pl-8 relative animate-entrance" data-speed={(0.1 * (idx + 1)).toString()}>
                      <div className="absolute w-2 h-2 rounded-full bg-primary -left-[4px] top-2" />
                      <div className="flex items-start gap-4 mb-3">
                        {item.logo && (
                          <div
                            className="shrink-0 flex items-center justify-center"
                            style={{
                              width: '48px',
                              height: '48px',
                              background: 'var(--color-surface, #f4f4f4)',
                              border: '0.5px solid var(--color-border)',
                              padding: '6px',
                            }}
                          >
                            <Image
                              src={item.logo}
                              alt={item.institution}
                              width={36}
                              height={36}
                              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                              unoptimized
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-display font-semibold text-xl mb-1 text-primary">{item.institution}</h3>
                          <p className="font-mono text-sm text-secondary uppercase tracking-wider">{item.specialty}</p>
                        </div>
                      </div>
                      <p className="font-body text-secondary leading-relaxed max-w-2xl">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Panel 2 — Experience */}
            <section
              ref={setPanelRef(2)}
              id="experience"
              className="panel w-screen h-full flex-none flex items-center justify-center relative overflow-hidden"
              style={{ background: 'var(--color-background)' }}
            >
              <div className="w-full px-[10vw]">
                <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary animate-entrance" data-speed="0.1">
                  [STEP.03/05] — Experience
                </p>
                <h2 className="font-display font-bold uppercase mb-24 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }} data-speed="0.2">
                  {contentData.experience.header}
                </h2>

                <div className="relative animate-entrance">
                  <div className="absolute top-[10px] left-0 w-[150vw] h-px border-b border-dashed border-border" />
                  
                  <div className="flex gap-24 relative z-10" data-speed="0.3">
                    {contentData.experience.items.map((item, idx) => (
                      <div key={idx} className="min-w-[300px]">
                        <TimelineItem 
                          period={item.period}
                          role={item.role}
                          place={item.place}
                          details={item.details}
                        />
                        {item.focus && <p className="font-body text-secondary text-sm leading-relaxed mt-4">{item.focus}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Panel 3 — About */}
            <section
              ref={setPanelRef(3)}
              id="about"
              className="panel w-screen h-full flex-none flex items-center"
              style={{ background: 'var(--color-background)' }}
            >
              <div className="grid gap-16 px-[10vw] w-full max-w-[100vw]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                {/* Column 1 — Title + Bio */}
                <div data-speed="0.1" className="flex flex-col justify-center">
                  <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary animate-entrance">
                    [STEP.04/05] — About
                  </p>
                  <h2 className="font-display font-bold uppercase mb-8 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
                    {contentData.about.header}
                  </h2>
                  <p className="font-body text-lg text-secondary leading-relaxed animate-entrance">
                    {contentData.about.bio}
                  </p>
                </div>

                {/* Column 2 — Skills */}
                <div className="flex flex-col justify-center gap-10" data-speed="0.25">
                  {Object.entries(contentData.about.skills).map(([key, category]) => (
                    <div key={key} className="animate-entrance">
                      <h3 className="font-display text-sm uppercase tracking-widest text-primary mb-4 border-b border-border pb-2 inline-block">
                        {category.title}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {category.items.map((item, i) => (
                          <SkillTag key={i}>{item}</SkillTag>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 3 — Photo */}
                <div className="flex items-center justify-center" data-speed="0.4">
                  <div
                    className="animate-entrance"
                    style={{
                      position: 'relative',
                      width: '280px',
                      aspectRatio: '3/4',
                      border: '0.5px solid var(--color-border)',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src="/preview-my-photo.jpg"
                      alt="Dmitry Volkov"
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                      sizes="280px"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Panel 4 — Contacts */}
            <section
              ref={setPanelRef(4)}
              id="contacts"
              className="panel w-screen h-full flex-none flex items-center justify-center relative"
              style={{ background: 'var(--color-background)' }}
            >
              <div className="grid gap-16 px-[10vw] w-full" style={{ gridTemplateColumns: '1fr 1fr' }}>

                {/* Left — Heading + Email + Social + Photo */}
                <div data-speed="0.15" className="flex flex-col justify-center">
                  <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary animate-entrance">
                    [STEP.05/05] — Contacts
                  </p>
                  <h2 className="font-display font-bold uppercase mb-10 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
                    {contentData.contacts.header}
                  </h2>

                  <a
                    href={`mailto:${contentData.contacts.email}`}
                    className="font-display font-medium tracking-tight text-primary block mb-10 animate-entrance transition-colors duration-200"
                    style={{ fontSize: 'var(--text-h3)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                  >
                    {contentData.contacts.email}
                  </a>

                  {/* Social links with SVG icons */}
                  <div className="flex gap-6 mb-10 animate-entrance">
                    {contentData.contacts.social.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.name}
                        className="flex items-center gap-2 font-mono text-sm tracking-widest uppercase transition-colors duration-200"
                        style={{ color: 'var(--color-secondary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-secondary)')}
                      >
                        {/* Inline SVG icons — no external dependency */}
                        {link.icon === 'github' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                          </svg>
                        )}
                        {link.icon === 'linkedin' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        )}
                        {link.icon === 'telegram' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                        )}
                        <span>{link.name}</span>
                      </a>
                    ))}
                  </div>

                  {/* Profile photo */}
                  <div
                    className="animate-entrance"
                    style={{
                      position: 'relative',
                      width: '120px',
                      height: '120px',
                      border: '0.5px solid var(--color-border)',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src="/contact-my-photo.jpg"
                      alt="Dmitry Volkov"
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                      sizes="120px"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Right — Contact Form */}
                <div data-speed="0.3" className="flex flex-col justify-center">
                  <form
                    action={`mailto:${contentData.contacts.email}`}
                    method="get"
                    encType="text/plain"
                    className="flex flex-col gap-4 animate-entrance"
                  >
                    <input
                      name="name"
                      type="text"
                      placeholder="Ваше имя"
                      required
                      style={{
                        border: '0.5px solid var(--color-border)',
                        background: 'transparent',
                        padding: 'var(--space-3, 12px) var(--space-4, 16px)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-primary)',
                        outline: 'none',
                        width: '100%',
                      }}
                      onFocus={(e) => (e.currentTarget.style.outline = '2px solid var(--color-ring, #000)')}
                      onBlur={(e) => (e.currentTarget.style.outline = 'none')}
                    />
                    <input
                      name="email"
                      type="email"
                      placeholder="Ваш email"
                      required
                      style={{
                        border: '0.5px solid var(--color-border)',
                        background: 'transparent',
                        padding: 'var(--space-3, 12px) var(--space-4, 16px)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-primary)',
                        outline: 'none',
                        width: '100%',
                      }}
                      onFocus={(e) => (e.currentTarget.style.outline = '2px solid var(--color-ring, #000)')}
                      onBlur={(e) => (e.currentTarget.style.outline = 'none')}
                    />
                    <textarea
                      name="message"
                      placeholder="Сообщение..."
                      rows={5}
                      required
                      style={{
                        border: '0.5px solid var(--color-border)',
                        background: 'transparent',
                        padding: 'var(--space-3, 12px) var(--space-4, 16px)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-primary)',
                        outline: 'none',
                        resize: 'none',
                        width: '100%',
                      }}
                      onFocus={(e) => (e.currentTarget.style.outline = '2px solid var(--color-ring, #000)')}
                      onBlur={(e) => (e.currentTarget.style.outline = 'none')}
                    />
                    <div className="flex justify-start">
                      <CtaButton type="submit">Отправить</CtaButton>
                    </div>
                  </form>
                </div>
              </div>

              {/* Footer note */}
              <div className="absolute bottom-8 w-full text-center animate-entrance" data-speed="0.05">
                <p className="font-mono text-xs tracking-wider" style={{ color: 'var(--color-secondary)' }}>
                  {contentData.contacts.footer}
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ── Fixed Scroll Progress Indicator ──────────────────────────────── */}
      <ScrollProgressIndicator progress={scrollState.progress} activeSection={scrollState.activeSection} />
    </>
  );
}

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
import { prefersReducedMotion, watchReducedMotion } from '../utils/prefersReducedMotion';
import { useTheme } from '../contexts/ThemeContext';

import { Header } from '../components/ui/Header/Header';
import { ScrollProgressIndicator } from '../components/ui/ScrollProgressIndicator/ScrollProgressIndicator';
import { TimelineItem } from '../components/ui/TimelineItem/TimelineItem';
import { SkillTag } from '../components/ui/SkillTag/SkillTag';
import { CtaButton } from '../components/ui/CtaButton/CtaButton';
import OptionWheel from '../components/OptionWheel';

const BackgroundCanvas = dynamic(() => import('../components/BackgroundCanvas'), { ssr: false });

gsap.registerPlugin(useGSAP, ScrollToPlugin);

// Nav sections (excludes Intro/Promo — they are not user-navigable)
const SECTIONS = ['About', 'Experience', 'Services', 'Education', 'Contacts'] as const;

// Map section HTML id → BGS positions array index
const SECTION_ID_TO_INDEX: Record<string, number> = {
  intro:      0,
  promo:      1,
  about:      2,
  experience: 3,
  services:   4,
  education:  5,
  contacts:   6,
};

export default function Page() {
  // ── DOM refs ──────────────────────────────────────────────────────────────
  const aboutSectionRef = useRef<HTMLElement>(null);
  const aboutTrackRef = useRef<HTMLDivElement>(null);
  const aboutItemRefs = useRef<(HTMLElement | null)[]>([]);

  // ── Service refs (not React state — never trigger re-render) ──────────────
  const aboutScrollServiceRef = useRef<ScrollInterfaceService | null>(null);
  const introPanelRef = useRef<IntroPanelHandle>(null);
  const backgroundCanvasRef = useRef<BackgroundCanvasRef>(null);
  const videoServiceRef = useRef<VideoInteractionService | null>(null);
  const prevSectionRef = useRef<number>(0);

  // ── UI state (only what needs to re-render) ───────────────────────────────
  const [activeSection, setActiveSection] = useState(-1);
  const activeSectionRef = useRef<number>(-1);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const { theme } = useTheme();

  // ── Mobile detection (SSR-safe, updated on mount) ───────────────────────────
  const [isMobile, setIsMobile] = useState(false);

  // ── Pointer throttle — ~60fps cap to avoid overloading RAF ──────────────────
  const lastPointerTimeRef = useRef(0);
  const lastClientXRef = useRef(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const POINTER_THROTTLE_MS = 16; // ≈ 60 fps

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const now = performance.now();
    if (now - lastPointerTimeRef.current < POINTER_THROTTLE_MS) return;
    lastPointerTimeRef.current = now;
    lastClientXRef.current = e.clientX;
    backgroundCanvasRef.current?.updatePointer(e.clientX, e.clientY);
    videoServiceRef.current?.updatePointer(e.clientX, e.clientY);

    // Matrix Pill logic on intro section
    if (activeSectionRef.current === -1) {
      const progressX = e.clientX / window.innerWidth;
      if (progressX < 0.4 || progressX > 0.6) {
        backgroundCanvasRef.current?.morphToGeometry('pill');
        backgroundCanvasRef.current?.setPillMode(true);
      } else {
        backgroundCanvasRef.current?.morphToGeometry('grid');
        backgroundCanvasRef.current?.setPillMode(false);
      }
    }
  }, []);

  useEffect(() => {
    // Detect mobile on mount (client-only)
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onMqChange);

    return () => mq.removeEventListener('change', onMqChange);
  }, []);

  // ── Update video source on theme change ───────────────────────
  useEffect(() => {
    if (videoServiceRef.current) {
      videoServiceRef.current.updateVideoSource(theme);
    }
  }, [theme]);

  // ── Init Services after mount ───────────────────────────────
  useGSAP(() => {
    // 1. Init About horizontal scroll — desktop only (≥ 768px)
    if (!isMobile && aboutSectionRef.current && aboutTrackRef.current) {
      const items = aboutItemRefs.current.filter(Boolean) as HTMLElement[];
      if (items.length > 0) {
        aboutScrollServiceRef.current = new ScrollInterfaceService(
          aboutSectionRef.current,
          aboutTrackRef.current,
          items,
          (progress) => {
            // Update background morphing based on about scroll
            backgroundCanvasRef.current?.morphAboutTrack(progress);
          }
        );
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

    // 5. Watch for reduced motion preference changes
    const unwatch = watchReducedMotion((isReduced) => {
      backgroundCanvasRef.current?.setReducedMotion(isReduced);
    });

    // 6. Section-based scroll observer for background morphing
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            const bgsIndex = SECTION_ID_TO_INDEX[sectionId];
            
            // Update active nav section (only for the 5 navigable sections)
            const navIndex = SECTIONS.findIndex(s => s.toLowerCase() === sectionId);
            if (navIndex !== -1) {
              setActiveSection(navIndex);
              activeSectionRef.current = navIndex;
            } else {
              // intro or promo: no nav section active
              setActiveSection(-1);
              activeSectionRef.current = -1;
            }

            if (bgsIndex !== undefined) {
              if (sectionId === 'intro') {
                // Reset to Intro grid
                backgroundCanvasRef.current?.morphTo(0);
                // Restore pill based on current mouse position
                const progressX = lastClientXRef.current / window.innerWidth;
                if (progressX < 0.4 || progressX > 0.6) {
                  backgroundCanvasRef.current?.setPillMode(true);
                  backgroundCanvasRef.current?.morphToGeometry('pill');
                } else {
                  backgroundCanvasRef.current?.setPillMode(false);
                }
              } else {
                backgroundCanvasRef.current?.setPillMode(false);
                backgroundCanvasRef.current?.morphTo(bgsIndex);
              }
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll('section[id]').forEach(section => {
      sectionObserver.observe(section);
    });

    return () => {
      aboutScrollServiceRef.current?.destroy();
      aboutScrollServiceRef.current = null;
      videoServiceRef.current?.destroy();
      videoServiceRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      unwatch();
      sectionObserver.disconnect();
    };
  }, [handlePointerMove, isMobile]);

  // ── Navigate to section on nav click ──────────────────────────────────────
  const handleNavClick = useCallback((index: number) => {
    // SECTIONS = ['About','Experience','Services','Education','Contacts']
    const section = document.getElementById(SECTIONS[index].toLowerCase());
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const setAboutItemRef = (index: number) => (el: HTMLElement | null) => {
    aboutItemRefs.current[index] = el;
  };

  return (
    <>
      <BackgroundCanvas ref={backgroundCanvasRef} />
      
      {/* ── Fixed Header ──────────────────────────────────────────────────── */}
      <Header 
        activeSectionIndex={activeSection} 
        sections={SECTIONS} 
        onNavClick={handleNavClick} 
      />

      {/* ── Main Content — Vertical Scroll ───────────────────────────────────── */}
      <main className="relative w-full">

        {/* Section 0 — Intro */}
        <IntroPanel ref={introPanelRef} onNavClick={handleNavClick} />

        {/* Section 1 — Promo (Cosmic Transition) */}
        <section
          id="promo"
          className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'transparent' }}
        >
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-6xl mx-auto">
            <p
              className="font-mono text-xs tracking-widest uppercase mb-10"
              style={{ color: 'var(--color-secondary)', letterSpacing: '0.25em' }}
            >
              PROMO — CREATIVE ARCHITECT
            </p>
            <h2
              className="font-display font-bold uppercase leading-none tracking-tight"
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 6.5rem)',
                color: 'var(--color-primary)',
                letterSpacing: '-0.02em',
                lineHeight: '1.05',
              }}
            >
              CRAFTING
              <br />
              <span style={{ color: 'var(--color-accent)' }}>HIGH-IMPACT</span>
              <br />
              DIGITAL EXPERIENCES
              <br />
              &amp; INTERACTIVE
              <br />
              WEB ENGINES
            </h2>
            <div
              className="mt-14 w-px"
              style={{ height: '80px', background: 'linear-gradient(to bottom, var(--color-accent), transparent)' }}
            />
          </div>
        </section>

        {/* Section 2 — About (Horizontal Scroll) */}
        <section
          ref={aboutSectionRef}
          id="about"
          className="horizontal-scroll-section min-h-screen flex flex-col justify-center relative overflow-hidden py-8"
          style={{ background: 'transparent' }}
        >
          <div className="w-full">
            <div className="px-[10vw] mb-8">
              <p className="font-mono text-xs mb-3 tracking-widest uppercase text-secondary animate-entrance">
                [STEP.01/05] — About
              </p>
              <h2 className="font-display font-bold uppercase text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
                {contentData.about.header}
              </h2>
            </div>
            
            <div className="relative w-full">
              {/* Horizontal guide line */}
              <div className="absolute top-[50%] left-0 w-[200vw] h-px border-b border-dashed border-border/40 pointer-events-none" />
              
              {/* Horizontal scroll track */}
              <div
                ref={aboutTrackRef}
                className="horizontal-track flex gap-12 md:gap-16 px-[10vw] relative z-10 will-change-transform items-stretch"
              >
                {/* Card 1 — Bio & Vision */}
                <div
                  ref={setAboutItemRef(0)}
                  className="scroll-item min-w-[320px] w-[80vw] max-w-[500px] flex-none rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 md:p-10 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-primary/40"
                  data-speed="0.1"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
                      <span className="font-mono text-xs tracking-widest uppercase text-accent font-semibold">
                        [01 / 03] — VISION
                      </span>
                      <span className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded border border-border bg-surface text-secondary">
                        SHAPE: SPHERE
                      </span>
                    </div>

                    <h3 className="font-display text-2xl font-bold uppercase text-primary mb-6">
                      Философия & Подход
                    </h3>

                    <p className="font-body text-base text-secondary leading-relaxed mb-6">
                      {contentData.about.bio}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-border/40 flex items-center justify-between text-xs font-mono text-secondary">
                    <span>3D GEOMETRY SYNCHRONIZED</span>
                    <span className="text-primary font-bold">● LIVE SCRUB</span>
                  </div>
                </div>

                {/* Card 2 — Skills & Tech Stack */}
                <div
                  ref={setAboutItemRef(1)}
                  className="scroll-item min-w-[360px] w-[85vw] max-w-[620px] flex-none rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 md:p-10 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-primary/40"
                  data-speed="0.25"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
                      <span className="font-mono text-xs tracking-widest uppercase text-accent font-semibold">
                        [02 / 03] — TECH STACK
                      </span>
                      <span className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded border border-border bg-surface text-secondary">
                        SHAPE: CUBE
                      </span>
                    </div>

                    <h3 className="font-display text-2xl font-bold uppercase text-primary mb-6">
                      Навыки & Технологии
                    </h3>

                    <div className="flex flex-col gap-6">
                      {Object.entries(contentData.about.skills).map(([key, category]) => (
                        <div key={key}>
                          <h4 className="font-display text-xs uppercase tracking-widest text-primary/80 mb-3 font-semibold">
                            {category.title}
                          </h4>
                          <div className="flex flex-wrap gap-2.5">
                            {category.items.map((item, i) => (
                              <SkillTag key={i}>{item}</SkillTag>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/40 flex items-center justify-between text-xs font-mono text-secondary mt-6">
                    <span>STRUCTURED ENGINE</span>
                    <span className="text-primary font-bold">GSAP + THREE.JS</span>
                  </div>
                </div>

                {/* Card 3 — Profile & Visual Frame */}
                <div
                  ref={setAboutItemRef(2)}
                  className="scroll-item min-w-[300px] w-[80vw] max-w-[480px] flex-none rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 md:p-10 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-primary/40"
                  data-speed="0.4"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
                      <span className="font-mono text-xs tracking-widest uppercase text-accent font-semibold">
                        [03 / 03] — IDENTITY
                      </span>
                      <span className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded border border-border bg-surface text-secondary">
                        SHAPE: TORUS
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div
                        className="relative w-full max-w-[260px] aspect-[3/4] rounded-xl border border-border overflow-hidden mb-6 shadow-inner group"
                      >
                        <Image
                          src="/preview-my-photo.jpg"
                          alt="Dmitry Volkov"
                          fill
                          style={{ objectFit: 'cover', objectPosition: 'top' }}
                          sizes="260px"
                          className="transition-transform duration-500 group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
                      </div>

                      <p className="font-mono text-xs text-center tracking-wider text-secondary uppercase">
                        Dmitry Volkov — Creative Developer
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/40 flex items-center justify-between text-xs font-mono text-secondary">
                    <span>CONTINUOUS EVOLUTION</span>
                    <span className="text-primary font-bold">TORUS LOOP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 — Experience */}
        <section
          id="experience"
          className="min-h-screen flex items-center relative overflow-hidden"
          style={{ background: 'transparent', paddingLeft: '10vw', paddingRight: '10vw' }}
        >
          <div className="w-full max-w-4xl">
            <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary">
              [STEP.02/05] — Experience
            </p>
            <h2 className="font-display font-bold uppercase mb-16 text-primary" style={{ fontSize: 'var(--text-h1)' }}>
              {contentData.experience.header}
            </h2>

            <div className="flex flex-col gap-12 relative">
              <div className="absolute top-0 bottom-0 left-[3px] w-px border-l border-dashed border-border" />
              
              {contentData.experience.items.map((item, idx) => (
                <div
                  key={idx}
                  className="relative z-10 pl-8 animate-entrance" data-speed={(0.1 * (idx + 1)).toString()}
                >
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
        </section>

        {/* Section 4 — Services (Interactive OptionWheel Controller) */}
        <section
          id="services"
          className="min-h-screen flex flex-col justify-center relative overflow-hidden py-16"
          style={{ background: 'transparent', paddingLeft: '10vw', paddingRight: '10vw' }}
        >
          <div className="w-full max-w-6xl mx-auto">
            <p className="font-mono text-xs mb-4 tracking-widest uppercase text-secondary animate-entrance">
              [STEP.03/05] — Services & Solutions
            </p>
            <h2 className="font-display font-bold uppercase mb-12 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
              {contentData.services.header}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Column: Interactive OptionWheel */}
              <div className="lg:col-span-5 h-[380px] sm:h-[420px] relative rounded-2xl border border-border/40 bg-surface/20 backdrop-blur-md overflow-hidden flex items-center shadow-2xl">
                <OptionWheel
                  items={contentData.services.items.map((item) => item.title)}
                  defaultSelected={0}
                  onChange={(index) => setActiveServiceIndex(index)}
                  side="left"
                  fontSize={isMobile ? 1.2 : 1.5}
                  curve={1.1}
                  tilt={7}
                  inset={isMobile ? 24 : 40}
                />
              </div>

              {/* Right Column: Dynamic Service Detail Card */}
              <div className="lg:col-span-7 flex flex-col justify-between min-h-[380px] rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 sm:p-10 shadow-2xl transition-all duration-300">
                {contentData.services.items[activeServiceIndex] && (
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
                        <span className="font-mono text-xs tracking-widest uppercase text-accent font-semibold">
                          [SERVICE.0{activeServiceIndex + 1} / 0{contentData.services.items.length}]
                        </span>
                        <span className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded border border-border bg-surface text-secondary">
                          {contentData.services.items[activeServiceIndex].price}
                        </span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-primary mb-2">
                        {contentData.services.items[activeServiceIndex].title}
                      </h3>
                      <p className="font-mono text-xs text-accent uppercase tracking-wider mb-6">
                        {contentData.services.items[activeServiceIndex].subtitle}
                      </p>

                      <p className="font-body text-base text-secondary leading-relaxed mb-8">
                        {contentData.services.items[activeServiceIndex].description}
                      </p>

                      <div className="mb-8">
                        <h4 className="font-mono text-xs uppercase tracking-widest text-primary/80 mb-3 font-semibold">
                          Ключевые результаты / Deliverables:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {contentData.services.items[activeServiceIndex].deliverables.map((item, idx) => (
                            <span
                              key={idx}
                              className="font-mono text-xs px-3 py-1.5 rounded-sm border border-border/60 bg-surface/80 text-primary"
                            >
                              ✓ {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border/40 flex items-center justify-between mt-4">
                      <span className="font-mono text-xs text-secondary">
                        CONTROLLER: OPTIONWHEEL ACTIVE
                      </span>
                      <a
                        href="#contacts"
                        className="font-mono text-xs uppercase tracking-wider px-5 py-2.5 rounded border border-accent bg-accent/10 text-primary hover:bg-accent hover:text-black transition-all duration-200 font-semibold"
                      >
                        Запросить расчет →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 — Education */}
        <section
          id="education"
          className="min-h-screen flex items-center"
          style={{ background: 'transparent', paddingLeft: '10vw', paddingRight: '10vw' }}
        >
          <div className="max-w-4xl" data-speed="0.2">
            <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary animate-entrance">
              [STEP.04/05] — Education
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

        {/* Section 6 — Contacts */}
        <section
          id="contacts"
          className="min-h-screen flex items-center justify-center relative"
          style={{ background: 'transparent' }}
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
                        aria-label={`Перейти в ${link.name}`}
                        className="flex items-center gap-2 font-mono text-sm tracking-widest uppercase transition-colors duration-200"
                        style={{ color: 'var(--color-secondary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-secondary)')}
                      >
                        {/* Inline SVG icons — no external dependency */}
                        {link.icon === 'github' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                          </svg>
                        )}
                        {link.icon === 'linkedin' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        )}
                        {link.icon === 'telegram' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
                    <div>
                      <label htmlFor="contact-name" className="sr-only">Ваше имя</label>
                      <input
                        id="contact-name"
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
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="sr-only">Ваш email</label>
                      <input
                        id="contact-email"
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
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="sr-only">Сообщение</label>
                      <textarea
                        id="contact-message"
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
                    </div>
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

      </main>

      {/* ── Fixed Scroll Progress Indicator ──────────────────────────────── */}
      <ScrollProgressIndicator progress={0} activeSection={activeSection} />
    </>
  );
}

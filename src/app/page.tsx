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

const BackgroundCanvas = dynamic(() => import('../components/BackgroundCanvas'), { ssr: false });

gsap.registerPlugin(useGSAP, ScrollToPlugin);

const SECTIONS = ['Intro', 'Education', 'Experience', 'About', 'Services', 'Contacts'] as const;

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
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef<number>(0);
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
    if (activeSectionRef.current === 0) {
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
            backgroundCanvasRef.current?.morphTo(3, progress);
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
            const sectionIndex = SECTIONS.findIndex(s => s.toLowerCase() === sectionId);
            if (sectionIndex !== -1) {
              setActiveSection(sectionIndex);
              activeSectionRef.current = sectionIndex;
              
              if (sectionIndex === 0) {
                // Ensure section color and state are reset to Intro
                backgroundCanvasRef.current?.morphTo(0);
                
                // Restore morph based on current mouse position
                const progressX = lastClientXRef.current / window.innerWidth;
                if (progressX < 0.4 || progressX > 0.6) {
                  backgroundCanvasRef.current?.setPillMode(true);
                  backgroundCanvasRef.current?.morphToGeometry('pill');
                } else {
                  backgroundCanvasRef.current?.setPillMode(false);
                }
              } else {
                // Clear any pill mode / color overrides from intro
                backgroundCanvasRef.current?.setPillMode(false);
                backgroundCanvasRef.current?.morphTo(sectionIndex);
              }
            }
          }
        });
      },
      { threshold: 0.5 }
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

        {/* Section 1 — Education */}
        <section
          id="education"
          className="min-h-screen flex items-center"
          style={{ background: 'transparent', paddingLeft: '10vw', paddingRight: '10vw' }}
        >
              <div className="max-w-4xl" data-speed="0.2">
                <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary animate-entrance">
                  [STEP.02/06] — Education
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

        {/* Section 2 — Experience */}
        <section
          id="experience"
          className="min-h-screen flex items-center relative overflow-hidden"
          style={{ background: 'transparent', paddingLeft: '10vw', paddingRight: '10vw' }}
        >
          <div className="w-full max-w-4xl">
            <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary">
              [STEP.03/06] — Experience
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

        {/* Section 3 — About (Horizontal Scroll) */}
        <section
          ref={aboutSectionRef}
          id="about"
          className="horizontal-scroll-section min-h-screen flex items-center relative overflow-hidden"
          style={{ background: 'transparent' }}
        >
          <div className="w-full px-[10vw]">
            <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary animate-entrance">
              [STEP.04/06] — About
            </p>
            <h2 className="font-display font-bold uppercase mb-16 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
              {contentData.about.header}
            </h2>
            
            <div className="relative">
              <div className="absolute top-[50%] left-0 w-[150vw] h-px border-b border-dashed border-border" />
              
              {/* Horizontal scroll track */}
              <div
                ref={aboutTrackRef}
                className="horizontal-track flex gap-24 relative z-10 will-change-transform items-center"
              >
                {/* Column 1 — Bio */}
                <div ref={setAboutItemRef(0)} className="scroll-item min-w-[300px] w-[350px] flex-none" data-speed="0.1">
                  <p className="font-body text-lg text-secondary leading-relaxed animate-entrance">
                    {contentData.about.bio}
                  </p>
                </div>

                {/* Column 2 — Skills */}
                <div ref={setAboutItemRef(1)} className="scroll-item min-w-[350px] w-[400px] flex-none flex flex-col gap-10" data-speed="0.25">
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
                <div ref={setAboutItemRef(2)} className="scroll-item min-w-[280px] flex-none flex items-center justify-center" data-speed="0.4">
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
            </div>
          </div>
        </section>

        {/* Section 4.5 — Services */}
        <section
          id="services"
          className="min-h-screen flex items-center relative overflow-hidden"
          style={{ background: 'transparent', paddingLeft: '10vw', paddingRight: '10vw' }}
        >
          <div className="w-full max-w-4xl" data-speed="0.2">
            <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary animate-entrance">
              [STEP.05/06] — Services
            </p>
            <h2 className="font-display font-bold uppercase mb-16 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
              {contentData.services.header}
            </h2>

            <div className="flex flex-col gap-8 relative z-10">
              {contentData.services.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 animate-entrance"
                  data-speed={(0.1 * (idx + 1)).toString()}
                >
                  <h3 className="font-display text-2xl text-primary mb-2 md:mb-0">
                    {item.title}
                  </h3>
                  <div className="font-mono text-sm tracking-widest uppercase text-secondary whitespace-nowrap bg-surface px-4 py-2 rounded-sm border border-border inline-block">
                    {item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5 — Contacts */}
        <section
          id="contacts"
          className="min-h-screen flex items-center justify-center relative"
          style={{ background: 'transparent' }}
        >
              <div className="grid gap-16 px-[10vw] w-full" style={{ gridTemplateColumns: '1fr 1fr' }}>

                {/* Left — Heading + Email + Social + Photo */}
                <div data-speed="0.15" className="flex flex-col justify-center">
                  <p className="font-mono text-xs mb-8 tracking-widest uppercase text-secondary animate-entrance">
                    [STEP.06/06] — Contacts
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

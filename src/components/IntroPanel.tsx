'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import { CtaButton } from './ui/CtaButton/CtaButton';
import contentData from '../data/content.json';
import { useTheme } from '../contexts/ThemeContext';

/** Public API exposed to the parent Orchestrator via ref */
export interface IntroPanelHandle {
  /** The root DOM element — lets Orchestrator register this as panel[0] */
  containerEl: HTMLElement | null;
  /** Video element for VideoInteractionService */
  videoEl: HTMLVideoElement | null;
  /** Video container element for VideoInteractionService parallax */
  videoWrapEl: HTMLDivElement | null;
}

interface IntroPanelProps {
  onNavClick?: (index: number) => void;
}

const IntroPanel = forwardRef<IntroPanelHandle, IntroPanelProps>(function IntroPanel(
  { onNavClick },
  ref
) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Expose DOM refs to parent Orchestrator
  useImperativeHandle(ref, () => ({
    containerEl: containerRef.current,
    videoEl: videoRef.current,
    videoWrapEl: videoWrapRef.current,
  }));

  const { title, subtitle, tagline, cta } = contentData.intro;

  return (
    <section
      ref={containerRef}
      id="intro"
      className="relative w-screen min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* Hero text */}
      <div className="absolute left-[var(--space-8)] md:left-[var(--space-12)] top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none pr-[var(--space-8)] md:pr-0">
        <p
          className="font-mono text-xs tracking-widest uppercase mb-4"
          style={{ color: 'var(--color-secondary)', letterSpacing: 'var(--tracking-ui)' }}
        >
          [SYSTEM ONLINE] — CREATIVE ARCHITECT
        </p>
        <h1
          className="font-display font-bold leading-none whitespace-pre-line"
          style={{
            fontSize: 'var(--text-hero)',
            letterSpacing: 'var(--tracking-hero)',
            color: 'var(--color-primary)',
            lineHeight: 'var(--leading-tight)',
          }}
          data-speed="0.2"
        >
          {title}
        </h1>
        <p
          className="font-display mt-4"
          style={{ fontSize: 'var(--text-h3)', color: 'var(--color-secondary)' }}
          data-speed="0.3"
        >
          {subtitle}
        </p>
        <p 
          className="font-body mt-2 max-w-md"
          style={{ fontSize: 'var(--text-body)', color: 'var(--color-secondary)', lineHeight: 'var(--leading-body)' }}
          data-speed="0.4"
        >
          {tagline}
        </p>
        <CtaButton className="mt-8">
          {cta}
        </CtaButton>
      </div>

      {/* Video silhouette — mix-blend-mode: multiply makes white transparent in light theme, screen makes black transparent in dark theme */}
      <div
        ref={videoWrapRef}
        aria-hidden="true"
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[75vw] md:w-[38vw] z-10 overflow-visible pointer-events-none"
        style={{ mixBlendMode: theme === 'light' ? 'multiply' : 'screen' }}
      >
        <video
          ref={videoRef}
          src={theme === 'light' ? '/lbm.mp4' : '/lbm_dark.mp4'}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
        />
      </div>



      {/* Scroll hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 font-mono text-xs tracking-widest animate-bounce"
        style={{ color: 'var(--color-secondary)' }}
      >
        scroll ↓
      </div>
    </section>
  );
});

export default IntroPanel;

'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import DotGrid from './ui/DotGrid/DotGrid';
import OptionWheel from './OptionWheel';
import { CtaButton } from './ui/CtaButton/CtaButton';
import contentData from '../data/content.json';

/** Public API exposed to the parent Orchestrator via ref */
export interface IntroPanelHandle {
  /** The root DOM element — lets Orchestrator register this as panel[0] */
  containerEl: HTMLDivElement | null;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);

  // Expose DOM refs to parent Orchestrator
  useImperativeHandle(ref, () => ({
    containerEl: containerRef.current,
    videoEl: videoRef.current,
    videoWrapEl: videoWrapRef.current,
  }));

  const { title, subtitle, tagline, cta } = contentData.intro;

  return (
    <div
      ref={containerRef}
      id="intro"
      className="relative w-screen h-full flex items-center justify-center overflow-hidden bg-white"
    >
      {/* DotGrid reactive background */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={4}
          gap={8}
          baseColor="#ffffff"
          activeColor="#999999"
          proximity={70}
          speedTrigger={100}
          shockRadius={80}
          shockStrength={5}
          maxSpeed={5000}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* Hero text */}
      <div className="absolute left-[var(--space-8)] md:left-[var(--space-12)] top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none pr-[var(--space-8)] md:pr-0">
        <p
          className="font-mono text-xs tracking-widest uppercase mb-4"
          style={{ color: 'var(--color-secondary)', letterSpacing: 'var(--tracking-ui)' }}
        >
          [STEP.01/05] — Intro
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

      {/* Video silhouette — mix-blend-mode: multiply makes white transparent */}
      <div
        ref={videoWrapRef}
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[75vw] md:w-[38vw] z-10 overflow-visible pointer-events-none"
        style={{ mixBlendMode: 'multiply' }}
      >
        <video
          ref={videoRef}
          src="/lbm.mp4"
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
        />
      </div>

      {/* OptionWheel Navigator */}
      <div className="absolute inset-0 flex items-center justify-end z-30 pointer-events-none">
        <div className="w-[400px] h-full pointer-events-auto">
          <OptionWheel
            items={['Intro', 'Education', 'Experience', 'About', 'Contacts']}
            defaultSelected={0}
            textColor="#bbbbbb"
            activeColor="#000000"
            side="right"
            fontSize={4}
            spacing={1.4}
            curve={0.35}
            tilt={6}
            blur={2}
            fade={0.25}
            minOpacity={0.2}
            smoothing={200}
            inset={80}
            loop={false}
            draggable
            wheelPassthrough
            soundUrl="/assets/sounds/click-soft.mp3"
            soundVolume={0.5}
            onItemClick={(index: number) => {
              if (onNavClick) onNavClick(index);
            }}
          />
        </div>
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 font-mono text-xs tracking-widest animate-bounce"
        style={{ color: 'var(--color-secondary)' }}
      >
        scroll ↓
      </div>
    </div>
  );
});

export default IntroPanel;

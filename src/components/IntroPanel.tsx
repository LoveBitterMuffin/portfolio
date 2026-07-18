'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DotGrid from './ui/DotGrid/DotGrid';
import OptionWheel from './OptionWheel';

gsap.registerPlugin(useGSAP);

/** Public API exposed to the parent Orchestrator via ref */
export interface IntroPanelHandle {
  /** The root DOM element — lets Orchestrator register this as panel[0] */
  containerEl: HTMLDivElement | null;
  updatePointer(clientX: number, clientY: number): void;
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

  // Internal mutable state — never triggers React re-render
  const stateRef = useRef({ currentTime: 0 });
  const lastSeekTimeRef = useRef(0);
  const tweensReadyRef = useRef(false);

  // Expose pointer update + DOM ref to parent Orchestrator
  useImperativeHandle(ref, () => ({
    containerEl: containerRef.current,
    updatePointer(clientX: number, clientY: number) {
      const video = videoRef.current;
      const videoWrap = videoWrapRef.current;
      if (!video || !videoWrap || !tweensReadyRef.current) return;

      const now = performance.now();
      const THROTTLE_MS = 33; // 30fps cap for video seeks
      const PARALLAX_STRENGTH = 24;

      // Video scrubbing — X position maps to playback time
      if (video.duration) {
        const progress = Math.max(0, Math.min(1, clientX / window.innerWidth));
        gsap.to(stateRef.current, {
          currentTime: progress * video.duration,
          duration: 0.6,
          ease: 'power1.out',
          overwrite: 'auto',
        });
      }

      // Parallax displacement of video container
      const offsetX = (clientX / window.innerWidth - 0.5) * PARALLAX_STRENGTH;
      const offsetY = (clientY / window.innerHeight - 0.5) * PARALLAX_STRENGTH;

      gsap.to(videoWrap, {
        x: offsetX,
        y: offsetY,
        duration: 1.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      // Throttled video seek (not more than 30/sec)
      if (now - lastSeekTimeRef.current > THROTTLE_MS) {
        const target = stateRef.current.currentTime;
        if (Math.abs(video.currentTime - target) > 0.01) {
          video.currentTime = target;
          lastSeekTimeRef.current = now;
        }
      }
    },
  }));

  useGSAP(
    () => {
      tweensReadyRef.current = true;
      return () => {
        tweensReadyRef.current = false;
        gsap.killTweensOf(stateRef.current);
        gsap.killTweensOf(videoWrapRef.current);
      };
    },
    { scope: containerRef },
  );

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
      <div className="absolute left-[var(--space-12)] top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none">
        <p
          className="font-mono text-xs tracking-widest uppercase mb-4"
          style={{ color: 'var(--color-secondary)', letterSpacing: 'var(--tracking-ui)' }}
        >
          [STEP.01/05] — Intro
        </p>
        <h1
          className="font-display font-bold leading-none"
          style={{
            fontSize: 'var(--text-hero)',
            letterSpacing: 'var(--tracking-hero)',
            color: 'var(--color-primary)',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          Dmitry
          <br />
          Volkov
        </h1>
        <p
          className="font-display mt-4"
          style={{ fontSize: 'var(--text-h3)', color: 'var(--color-secondary)' }}
        >
          Creative Developer
        </p>
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


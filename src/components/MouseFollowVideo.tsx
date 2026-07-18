"use client";

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DotGrid from './ui/DotGrid/DotGrid';

gsap.registerPlugin(useGSAP);

export default function MouseFollowVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const video = videoRef.current;
    const videoWrap = videoWrapRef.current;
    if (!video || !videoWrap) return;

    const state = { currentTime: 0 };
    let lastSeekTime = 0;
    const throttleMs = 33;
    const PARALLAX_STRENGTH = 24;

    // Unified pointer handler — works for both mouse and touch
    const handlePointer = (clientX: number, clientY: number) => {
      if (video.duration) {
        const progress = Math.max(0, Math.min(1, clientX / window.innerWidth));
        gsap.to(state, {
          currentTime: progress * video.duration,
          duration: 0.6,
          ease: 'power1.out',
          overwrite: 'auto',
        });
      }

      const offsetX = (clientX / window.innerWidth - 0.5) * PARALLAX_STRENGTH;
      const offsetY = (clientY / window.innerHeight - 0.5) * PARALLAX_STRENGTH;

      gsap.to(videoWrap, {
        x: offsetX,
        y: offsetY,
        duration: 1.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);

    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handlePointer(t.clientX, t.clientY);
    };

    const updateVideoFrame = () => {
      const now = performance.now();
      if (now - lastSeekTime > throttleMs && Math.abs(video.currentTime - state.currentTime) > 0.01) {
        video.currentTime = state.currentTime;
        lastSeekTime = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    gsap.ticker.add(updateVideoFrame);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      gsap.ticker.remove(updateVideoFrame);
      gsap.killTweensOf(state);
      gsap.killTweensOf(videoWrap);
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white">

      {/* DotGrid background layer */}
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

      {/* Video on top — mix-blend-multiply makes white bg transparent, silhouette stays opaque */}
      {/* w-[75vw] on mobile → w-[38vw] on md+ desktops */}
      <div ref={videoWrapRef} className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[75vw] md:w-[38vw] z-10 overflow-visible pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
        <video
          ref={videoRef}
          src="/lbm.mp4"
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
        />
      </div>

    </div>
  );
}

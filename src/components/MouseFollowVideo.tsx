"use client";

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DotGrid from './ui/DotGrid/DotGrid';

gsap.registerPlugin(useGSAP);

export default function MouseFollowVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const video = videoRef.current;
    if (!video) return;

    // We'll use a proxy object to smooth out the targetTime
    const state = { currentTime: 0 };
    let lastSeekTime = 0;
    const throttleMs = 33; // Limit seeking to ~30fps to avoid overloading the decoder while remaining fluid

    const handleMouseMove = (e: MouseEvent) => {
      if (!video.duration) return;

      // 1. Scrubbing progress (0 to 1) based on X coordinate
      const progress = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
      const targetTime = progress * video.duration;

      // Tween the proxy currentTime smoothly
      gsap.to(state, {
        currentTime: targetTime,
        duration: 0.6,
        ease: "power1.out",
        overwrite: "auto"
      });
    };

    const updateVideoFrame = () => {
      const now = performance.now();
      // Only set currentTime if enough time has passed since the last seek
      // AND there's a meaningful change, bypassing the blocking video.seeking check.
      if (now - lastSeekTime > throttleMs && Math.abs(video.currentTime - state.currentTime) > 0.01) {
        video.currentTime = state.currentTime;
        lastSeekTime = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    gsap.ticker.add(updateVideoFrame);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      gsap.ticker.remove(updateVideoFrame);
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white">

      {/* DotGrid background layer */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={16}
          gap={32}
          baseColor="#ffffff"
          activeColor="#000000"
          proximity={150}
          speedTrigger={100}
          shockRadius={250}
          shockStrength={5}
          maxSpeed={5000}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* Video on top — mix-blend-multiply makes white bg transparent, silhouette stays opaque */}
      <div className="relative z-10 w-[50vw] aspect-[1920/1072] overflow-hidden pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
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

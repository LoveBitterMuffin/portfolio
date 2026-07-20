"use client";

import { useRef, useState, useEffect } from 'react';
import DotGrid from './ui/DotGrid/DotGrid';
import { VideoInteractionService } from '../services/VideoInteractionService';

export default function MouseFollowVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const videoWrap = videoWrapRef.current;
    if (!video || !videoWrap) return;

    const service = new VideoInteractionService(video, videoWrap, () => {
      setUseFallback(true);
    });

    const handlePointer = (clientX: number, clientY: number) => {
      service.updatePointer(clientX, clientY);
    };

    const handleMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);

    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handlePointer(t.clientX, t.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      service.destroy();
    };
  }, []);

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
        {useFallback ? (
          <img src="/lbm_fallback.png" alt="Silhouette Fallback" className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            src="/lbm.mp4"
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
          />
        )}
      </div>

    </div>
  );
}

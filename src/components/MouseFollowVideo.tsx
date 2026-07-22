"use client";

import { useRef, useState, useEffect } from 'react';
import DotGrid from './ui/DotGrid/DotGrid';
import { VideoInteractionService } from '../services/VideoInteractionService';
import { useTheme } from '../contexts/ThemeContext';

export default function MouseFollowVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<VideoInteractionService | null>(null);
  
  const [useFallback, setUseFallback] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const video = videoRef.current;
    const videoWrap = videoWrapRef.current;
    if (!video || !videoWrap) return;

    const service = new VideoInteractionService(video, videoWrap, () => {
      setUseFallback(true);
    });
    serviceRef.current = service;

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

  // Обновление видео при смене темы
  useEffect(() => {
    if (serviceRef.current) {
      serviceRef.current.updateVideoSource(theme);
    }
  }, [theme]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* DotGrid background layer */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          key={theme}
          dotSize={4}
          gap={8}
          baseColor="var(--color-background)"
          activeColor="var(--color-secondary)"
          proximity={70}
          speedTrigger={100}
          shockRadius={80}
          shockStrength={5}
          maxSpeed={5000}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* Video on top — mix-blend-mode зависит от темы */}
      <div 
        ref={videoWrapRef} 
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[75vw] md:w-[38vw] z-10 overflow-visible pointer-events-none" 
        style={{ mixBlendMode: theme === 'light' ? 'multiply' : 'screen' }}
      >
        {useFallback ? (
          <img 
            src={theme === 'light' ? '/lbm_fallback.png' : '/lbm_dark_fallback.png'} 
            alt="Silhouette Fallback" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <video
            ref={videoRef}
            src={theme === 'light' ? '/lbm.mp4' : '/lbm_dark.mp4'}
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

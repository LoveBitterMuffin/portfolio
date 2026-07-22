'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { BackgroundGraphicsService } from '../services/BackgroundGraphicsService';
import { useTheme } from '../contexts/ThemeContext';

export interface BackgroundCanvasRef {
  resize: (width: number, height: number) => void;
  updatePointer: (clientX: number, clientY: number) => void;
  morphTo: (sectionIndex: number, progress?: number) => void;
  morphToGeometry: (type: string | number, progress?: number) => void;
  setReducedMotion: (reduced: boolean) => void;
  overrideColor: (hex: number) => void;
  clearColorOverride: () => void;
  setPillMode: (active: boolean) => void;
  morphAboutTrack: (progress: number) => void;
}

const BackgroundCanvas = forwardRef<BackgroundCanvasRef>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<BackgroundGraphicsService | null>(null);
  const { theme } = useTheme();

  useImperativeHandle(ref, () => ({
    resize: (width: number, height: number) => {
      serviceRef.current?.resize(width, height);
    },
    updatePointer: (clientX: number, clientY: number) => {
      serviceRef.current?.updatePointer(clientX, clientY);
    },
    morphTo: (sectionIndex: number, progress?: number) => {
      serviceRef.current?.morphTo(sectionIndex, progress);
    },
    morphToGeometry: (type: string | number, progress?: number) => {
      serviceRef.current?.morphToGeometry(type, progress);
    },
    setReducedMotion: (reduced: boolean) => {
      serviceRef.current?.setReducedMotion(reduced);
    },
    overrideColor: (hex: number) => {
      serviceRef.current?.overrideColor(hex);
    },
    clearColorOverride: () => {
      serviceRef.current?.clearColorOverride();
    },
    setPillMode: (active: boolean) => {
      serviceRef.current?.setPillMode(active);
    },
    morphAboutTrack: (progress: number) => {
      serviceRef.current?.morphAboutTrack(progress);
    }
  }));

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const service = new BackgroundGraphicsService(containerRef.current, canvasRef.current);
    serviceRef.current = service;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          service.resize(width, height);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      service.destroy();
      serviceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (serviceRef.current) {
      serviceRef.current.updateParticleColor(theme);
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      role="presentation"
      aria-hidden="true"
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full outline-none" />
    </div>
  );
});

BackgroundCanvas.displayName = 'BackgroundCanvas';

export default BackgroundCanvas;

'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { BackgroundGraphicsService } from '../services/BackgroundGraphicsService';

export interface BackgroundCanvasRef {
  updatePointer: (x: number, y: number) => void;
  resize: (width: number, height: number) => void;
  morphTo: (sectionIndex: number, progress?: number) => void;
}

const BackgroundCanvas = forwardRef<BackgroundCanvasRef>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<BackgroundGraphicsService | null>(null);

  useImperativeHandle(ref, () => ({
    updatePointer: (x: number, y: number) => {
      serviceRef.current?.updatePointer(x, y);
    },
    resize: (width: number, height: number) => {
      serviceRef.current?.resize(width, height);
    },
    morphTo: (sectionIndex: number, progress?: number) => {
      serviceRef.current?.morphTo(sectionIndex, progress);
    },
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full outline-none" />
    </div>
  );
});

BackgroundCanvas.displayName = 'BackgroundCanvas';

export default BackgroundCanvas;

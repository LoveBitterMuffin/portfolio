'use client';

import { useRef, useEffect, useCallback, useMemo, CSSProperties } from 'react';
import { gsap } from 'gsap';

import './DotGrid.css';

interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  _animating: boolean;
}

interface PointerState {
  x: number;
  y: number;
  speed: number;
  lastTime: number;
  lastX: number;
  lastY: number;
}

interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
  style?: CSSProperties;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

const DotGrid = ({
  dotSize = 16,
  gap = 32,
  baseColor = '#5227FF',
  activeColor = '#5227FF',
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className = '',
  style,
}: DotGridProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Cached 2D context — avoids getContext() on every RAF frame
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef<PointerState>({
    x: 0,
    y: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined' || !window.Path2D) return null;
    const p = new window.Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    // Kill any in-flight tweens before replacing dots array
    for (const dot of dotsRef.current) {
      gsap.killTweensOf(dot);
    }

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Cache the context
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    if (ctx) {
      // Reset transform before scaling — prevents cumulative dpr multiplication on resize/zoom
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          xOffset: 0,
          yOffset: 0,
          _animating: false,
        });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  // Draw loop — uses cached ctx, pre-computed proxSq, and shared rgb values
  useEffect(() => {
    if (!circlePath) return;

    let rafId: number;
    const proxSq = proximity * proximity;
    // Pre-compute delta components for interpolation
    const dr = activeRgb.r - baseRgb.r;
    const dg = activeRgb.g - baseRgb.g;
    const db = activeRgb.b - baseRgb.b;
    const baseColorStr = `rgb(${baseRgb.r},${baseRgb.g},${baseRgb.b})`;

    const draw = () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: px, y: py } = pointerRef.current;

      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const ddx = dot.cx - px;
        const ddy = dot.cy - py;
        const dsq = ddx * ddx + ddy * ddy;

        ctx.save();
        ctx.translate(ox, oy);

        if (dsq <= proxSq) {
          const t = 1 - Math.sqrt(dsq) / proximity;
          ctx.fillStyle = `rgb(${Math.round(baseRgb.r + dr * t)},${Math.round(baseRgb.g + dg * t)},${Math.round(baseRgb.b + db * t)})`;
        } else {
          ctx.fillStyle = baseColorStr;
        }

        ctx.fill(circlePath);
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [proximity, activeRgb, baseRgb, circlePath]);

  // Build grid + ResizeObserver + window resize (catches browser zoom / dpr changes)
  useEffect(() => {
    buildGrid();
    const wrap = wrapperRef.current;
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && wrap) {
      ro = new ResizeObserver(buildGrid);
      ro.observe(wrap);
    }
    // Always listen to window resize to catch zoom-level changes that alter devicePixelRatio
    window.addEventListener('resize', buildGrid);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', buildGrid);
    };
  }, [buildGrid]);

  // Mouse move + click / touch interactions (shared logic for mouse & touch)
  useEffect(() => {
    const onPointerMove = (clientX: number, clientY: number) => {
      const now = performance.now();
      const pr = pointerRef.current;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      const ddx = e.clientX - pr.lastX;
      const ddy = e.clientY - pr.lastY;
      let vx = (ddx / dt) * 1000;
      let vy = (ddy / dt) * 1000;
      let speed = Math.hypot(vx, vy);

      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }

      pr.lastTime = now;
      pr.lastX = clientX;
      pr.lastY = clientY;
      pr.speed = speed;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pr.x = clientX - rect.left;
      pr.y = clientY - rect.top;

      if (speed > speedTrigger) {
        const resistanceFactor = Math.max(0.1, 1 - resistance / 5000);
        const pushMag = Math.min(speed * 0.02 * resistanceFactor, dotSize * 4);

        for (const dot of dotsRef.current) {
          const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
          if (dist < proximity && !dot._animating) {
            dot._animating = true;
            gsap.killTweensOf(dot);
            const angle = Math.atan2(dot.cy - pr.y, dot.cx - pr.x);
            gsap.to(dot, {
              xOffset: Math.cos(angle) * pushMag,
              yOffset: Math.sin(angle) * pushMag,
              duration: 0.15,
              ease: 'power3.out',
              onComplete: () => {
                // Reset flag BEFORE starting return so the dot can be
                // re-triggered by a new interaction without getting stuck
                dot._animating = false;
                gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: returnDuration,
                  ease: 'elastic.out(1, 0.75)',
                  overwrite: 'auto',
                });
              },
            });
          }
        }
      }
    };

    const onShock = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius) {
          gsap.killTweensOf(dot);
          dot._animating = true;
          const falloff = Math.max(0, 1 - dist / shockRadius);
          gsap.to(dot, {
            xOffset: (dot.cx - cx) * shockStrength * falloff * 0.5,
            yOffset: (dot.cy - cy) * shockStrength * falloff * 0.5,
            duration: 0.2,
            ease: 'power4.out',
            onComplete: () => {
              // Reset flag BEFORE return so dot can receive new interactions
              // while elastic is still playing (safe because overwrite:'auto'
              // lets GSAP handle any conflict gracefully)
              dot._animating = false;
              gsap.to(dot, {
                xOffset: 0,
                yOffset: 0,
                duration: returnDuration,
                ease: 'elastic.out(1, 0.75)',
                overwrite: 'auto',
                // no onComplete needed — flag already reset above
              });
            },
          });
        }
      }
    };

    // Throttle to ~60fps
    let lastCall = 0;
    const throttledMove = (clientX: number, clientY: number) => {
      const now = performance.now();
      if (now - lastCall >= 16) { lastCall = now; onPointerMove(clientX, clientY); }
    };

    const onMouseMove  = (e: MouseEvent) => throttledMove(e.clientX, e.clientY);
    const onClick      = (e: MouseEvent) => onShock(e.clientX, e.clientY);
    const onTouchMove  = (e: TouchEvent) => { const t = e.touches[0]; if (t) throttledMove(t.clientX, t.clientY); };
    const onTouchStart = (e: TouchEvent) => { const t = e.touches[0]; if (t) onShock(t.clientX, t.clientY); };

    window.addEventListener('mousemove',  onMouseMove,  { passive: true });
    window.addEventListener('click',      onClick);
    window.addEventListener('touchmove',  onTouchMove,  { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    return () => {
      for (const dot of dotsRef.current) gsap.killTweensOf(dot);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('click',      onClick);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, [maxSpeed, speedTrigger, proximity, resistance, returnDuration, shockRadius, shockStrength, dotSize]);

  return (
    <section className={`dot-grid ${className}`} style={style}>
      <div ref={wrapperRef} className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </section>
  );
};

export default DotGrid;

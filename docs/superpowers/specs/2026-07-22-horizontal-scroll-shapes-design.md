# Design Spec: GSAP Horizontal Scroll 3D Shape Morphing (Sphere → Cube → Torus)

## Overview
In the **About** section of the portfolio, horizontal scroll is driven by `ScrollInterfaceService` and GSAP `ScrollTrigger`. This specification defines how the 3D particle system in `BackgroundGraphicsService` dynamically morphs between 3D geometric shapes (**Sphere → Cube → Torus**) based on real-time scroll progress scrubbing ($0\% \to 50\% \to 100\%$).

---

## Architecture & Data Flow

```
[User Scroll Scrubbing in About Section]
                   │
                   ▼
       [ScrollInterfaceService]
                   │  (onScrollUpdate: progress 0..1)
                   ▼
            [src/app/page.tsx]
                   │
                   ▼
        [BackgroundCanvas Ref]
                   │  (morphAboutTrack: progress 0..1)
                   ▼
     [BackgroundGraphicsService]
                   │
                   ▼
    ┌──────────────────────────────┐
    │  Dual-Stage Buffer Swapping  │
    └──────────────────────────────┘
       │                          │
       ▼ (0.0 - 0.5)              ▼ (0.5 - 1.0)
[Sphere → Cube Morph]      [Cube → Torus Morph]
(uMorphProgress: 0..1)     (uMorphProgress: 0..1)
```

---

## Detailed Components

### 1. Geometric Shapes Generation (`BackgroundGraphicsService.ts`)
Three mathematical particle coordinate sets are generated for the active particle count ($N = 4500$ or low-end $N = 1200$):

1. **Sphere (`spherePositions`)**:
   - Uniform distribution over sphere surface ($R \approx 2.2$) using Fibonacci spiral algorithm + random depth variance for volume.
2. **Cube (`cubePositions`)**:
   - 6-face box distribution ($Side \approx 3.6$), placing particles evenly across faces and along sharp outer edges.
3. **Torus (`torusPositions`)**:
   - Ring donut geometry with major radius $R_{major} \approx 2.4$ and tube radius $r_{minor} \approx 0.8$.

### 2. Dual-Stage Scrub Morphing (`BackgroundGraphicsService.ts`)
Method `morphAboutTrack(progress: number)` handles continuous real-time interpolation:

- **Stage 1 ($0.0 \le progress \le 0.5$)**:
  - Source: `spherePositions`
  - Target: `cubePositions`
  - Shader progress: `uMorphProgress = progress * 2.0`
- **Stage 2 ($0.5 < progress \le 1.0$)**:
  - Source: `cubePositions`
  - Target: `torusPositions`
  - Shader progress: `uMorphProgress = (progress - 0.5) * 2.0`

Target buffers are assigned efficiently when transitioning stages to ensure smooth 60fps GPU rendering without thrashing CPU memory.

### 3. Canvas & Page Wiring (`BackgroundCanvas.tsx` & `page.tsx`)
- `BackgroundCanvasRef` exposes `morphAboutTrack(progress: number)`.
- `ScrollInterfaceService` in `page.tsx` passes `progress` directly to `backgroundCanvasRef.current?.morphAboutTrack(progress)` during horizontal track scroll.

---

## Verification Plan

### Manual Verification
1. Run `npm run dev`.
2. Scroll to Section 4 ([STEP.04/06] — About).
3. Verify horizontal scrolling:
   - At start of About track (0%): Particles form a **Sphere**.
   - Mid-track (50%): Particles smoothly morph into a **Cube**.
   - End of track (100%): Particles smoothly morph into a **Torus**.
4. Test reverse scrolling (scrubbing backwards) to confirm smooth bi-directional morphing.
5. Verify 60fps performance without frame drops.

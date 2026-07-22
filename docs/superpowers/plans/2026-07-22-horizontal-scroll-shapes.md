# GSAP Horizontal Scroll 3D Shape Morphing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement continuous real-time morphing of 3D geometry (Sphere → Cube → Torus) synchronized with GSAP horizontal scroll scrubbing in the About section.

**Architecture:** Use dual-stage array buffer assignments inside `BackgroundGraphicsService.ts` via a new `morphAboutTrack(progress)` method to feed dynamic target positions into the GLSL WebGL shader without requiring memory allocations during scrub rendering. `page.tsx` will pass the GSAP scrub progress to the canvas component.

**Tech Stack:** Three.js, GSAP, React, TypeScript

## Global Constraints

- Code must maintain existing visual Void-aesthetic and high-performance WebGL loop (60fps target).
- Do not add external math/geometry dependencies (implement custom mathematical shape generators using pure JS/Three.js primitives).
- Use proper TS types.
- Format all source modifications elegantly.

---

### Task 1: Generate 3D Geometries in `BackgroundGraphicsService`

**Files:**
- Modify: `c:/mp/portfolio/src/services/BackgroundGraphicsService.ts`

**Interfaces:**
- Produces: `namedGeometries['sphere']`, `namedGeometries['cube']`, `namedGeometries['torus']` with Float32Array length = `particlesCount * 3`.

- [ ] **Step 1: Write geometry generator for Sphere**

Add logic inside `generatePositions()` to compute the Sphere geometry using Fibonacci spiral.
```typescript
    // Inside generatePositions()
    const spherePositions = new Float32Array(count * 3);
    const sphereR = 2.2;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      
      const px = Math.cos(theta) * Math.sin(phi) * sphereR;
      const py = Math.sin(theta) * Math.sin(phi) * sphereR;
      const pz = Math.cos(phi) * sphereR;
      
      spherePositions[i * 3 + 0] = px;
      spherePositions[i * 3 + 1] = py;
      spherePositions[i * 3 + 2] = pz;
    }
```

- [ ] **Step 2: Write geometry generator for Cube**

Add logic inside `generatePositions()` to compute the Cube geometry.
```typescript
    const cubePositions = new Float32Array(count * 3);
    const L = 3.6;
    for (let i = 0; i < count; i++) {
      const face = Math.floor(Math.random() * 6);
      const u = (Math.random() - 0.5) * L;
      const v = (Math.random() - 0.5) * L;
      let px = 0, py = 0, pz = 0;
      if (face === 0) { px = L/2; py = u; pz = v; }
      else if (face === 1) { px = -L/2; py = u; pz = v; }
      else if (face === 2) { px = u; py = L/2; pz = v; }
      else if (face === 3) { px = u; py = -L/2; pz = v; }
      else if (face === 4) { px = u; py = v; pz = L/2; }
      else { px = u; py = v; pz = -L/2; }
      
      let rot = rotateY(px, py, pz, 45 * Math.PI / 180);
      rot = rotateX(rot[0], rot[1], rot[2], 35 * Math.PI / 180);
      cubePositions[i * 3 + 0] = rot[0];
      cubePositions[i * 3 + 1] = rot[1];
      cubePositions[i * 3 + 2] = rot[2];
    }
```

- [ ] **Step 3: Write geometry generator for Torus**

Add logic inside `generatePositions()` to compute the Torus geometry.
```typescript
    const torusPositions = new Float32Array(count * 3);
    const R_maj = 2.4;
    const r_min = 0.8;
    for (let i = 0; i < count; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const px = (R_maj + r_min * Math.cos(v)) * Math.cos(u);
      const py = (R_maj + r_min * Math.cos(v)) * Math.sin(u);
      const pz = r_min * Math.sin(v);
      
      let rot = rotateX(px, py, pz, 70 * Math.PI / 180);
      torusPositions[i * 3 + 0] = rot[0];
      torusPositions[i * 3 + 1] = rot[1];
      torusPositions[i * 3 + 2] = rot[2];
    }
```

- [ ] **Step 4: Register Geometries**

Add them to the `namedGeometries` registry.
```typescript
    this.namedGeometries = {
      // existing...
      'sphere': spherePositions,
      'cube': cubePositions,
      'torus': torusPositions,
    };
```

- [ ] **Step 5: Verify build**
Run: `npm run build`
Expected: Build succeeds without TypeScript errors.

- [ ] **Step 6: Commit**
```bash
git add src/services/BackgroundGraphicsService.ts
git commit -m "feat(webgl): add sphere, cube, and torus shape geometries"
```

---

### Task 2: Implement `morphAboutTrack` in `BackgroundGraphicsService`

**Files:**
- Modify: `c:/mp/portfolio/src/services/BackgroundGraphicsService.ts`

**Interfaces:**
- Consumes: The `sphere`, `cube`, `torus` Float32Arrays defined in Task 1.
- Produces: Public method `morphAboutTrack(progress: number)`.

- [ ] **Step 1: Add `morphAboutTrack` class method**

```typescript
  public morphAboutTrack(progress: number): void {
    if (!this.particleGeometry || !this.particleMaterial) return;
    this.currentSectionIndex = 3;
    
    // Kill conflicting tweens
    if (this.morphTween) {
      this.morphTween.kill();
      this.morphTween = null;
    }
    
    const posAttr = this.particleGeometry.attributes.position as THREE.BufferAttribute;
    const targetAttr = this.particleGeometry.attributes.aTargetPosition as THREE.BufferAttribute;
    
    const stage = progress <= 0.5 ? 1 : 2;
    
    if (stage === 1) {
      const p = progress * 2.0; // 0..1
      const source = this.namedGeometries['sphere'];
      const target = this.namedGeometries['cube'];
      
      (posAttr.array as Float32Array).set(source);
      (targetAttr.array as Float32Array).set(target);
      this.particleMaterial.uniforms.uMorphProgress.value = p;
    } else {
      const p = (progress - 0.5) * 2.0; // 0..1
      const source = this.namedGeometries['cube'];
      const target = this.namedGeometries['torus'];
      
      (posAttr.array as Float32Array).set(source);
      (targetAttr.array as Float32Array).set(target);
      this.particleMaterial.uniforms.uMorphProgress.value = p;
    }
    
    posAttr.needsUpdate = true;
    targetAttr.needsUpdate = true;
    
    this.syncSectionColor(3);
    
    const targetOffset = this.getTargetOffset(3);
    if (this.offsetTween) this.offsetTween.kill();
    this.offsetTween = gsap.to(this.particleMaterial.uniforms.uShapeOffset.value, {
      x: targetOffset.x,
      y: targetOffset.y,
      duration: 0.1,
      ease: 'none',
    });
  }
```

- [ ] **Step 2: Verify build**
Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**
```bash
git add src/services/BackgroundGraphicsService.ts
git commit -m "feat(webgl): implement continuous morphAboutTrack logic"
```

---

### Task 3: Expose and Connect Scroll Trigger in React UI

**Files:**
- Modify: `c:/mp/portfolio/src/components/BackgroundCanvas.tsx`
- Modify: `c:/mp/portfolio/src/app/page.tsx`

**Interfaces:**
- Consumes: `BackgroundGraphicsService.morphAboutTrack(progress: number)` from Task 2.
- Produces: Updates `BackgroundCanvasRef` API and connects it to `ScrollInterfaceService`.

- [ ] **Step 1: Update `BackgroundCanvas.tsx` interface**

Add method to `BackgroundCanvasRef` and `useImperativeHandle`.
```tsx
export interface BackgroundCanvasRef {
  // ...existing
  morphAboutTrack: (progress: number) => void;
}
```
```tsx
    morphAboutTrack: (progress: number) => {
      serviceRef.current?.morphAboutTrack(progress);
    },
```

- [ ] **Step 2: Connect GSAP update loop in `page.tsx`**

Locate `aboutScrollServiceRef` setup inside `useGSAP` in `page.tsx` and change the callback:
```tsx
          (progress) => {
            backgroundCanvasRef.current?.morphAboutTrack(progress);
          }
```
*(Ensure to replace the previous callback which was `morphTo(3, progress)`).*

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: Typechecks and builds cleanly.

- [ ] **Step 4: Commit**
```bash
git add src/components/BackgroundCanvas.tsx src/app/page.tsx
git commit -m "feat(ui): bind horizontal scroll GSAP scrubber to 3D morphing"
```

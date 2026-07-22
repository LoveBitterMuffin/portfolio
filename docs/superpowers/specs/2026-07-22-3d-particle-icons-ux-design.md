# 3D Particle Shapes, Placement, & Scroll Transitions UX Spec

This document details the visual and functional improvements for the 3D particle background icons, their viewport placement, and scroll-linked transition logic in the portfolio.

## 1. Goals & UX Problems Addressed

1. **Shape Realism & Quality**: 
   - The Matrix pills on the Intro section previously looked flat, hollow, and amorphous (referred to as "two puddles in space"). We will replace them with slender, volumetric, and dynamically rotated capsule shapes.
   - Other shapes (mortarboard cap, briefcase, laptop, paper airplane) were oriented flatly, making it difficult to perceive their 3D depth. We will apply custom Euler rotations to all shapes to emphasize their 3D structure.
2. **Visual Clutter & Readability (Overlap)**:
   - Shapes were centered (`X = 0`) and directly behind the left-aligned text, causing text-readability issues and obscuring the shapes. 
   - We will shift shapes dynamically to the empty right side of the screen on desktop, and down below the text on mobile, ensuring clean readability and visual balance.
3. **Transition Animation Glitches**:
   - Toggling the pill mode and colors snapped instantly, causing jarring visual jumps.
   - Scrolling rapidly caused shapes to jump because active GSAP tweens on `uMorphProgress` were not killed and intermediate particle coordinates were not preserved.
   - We will implement smooth color fading and continuous morphing from the particles' current interpolated coordinates.

---

## 2. Technical Architecture & Shader Updates

### 2.1 GPU-Based Viewport Positioning
We introduce a new `uniform vec2 uShapeOffset` in the WebGL Vertex Shader to offset the particle field on the GPU.

**Vertex Shader changes:**
```glsl
uniform float uTime;
uniform float uMorphProgress;
uniform vec2 uPointer;
uniform vec2 uShapeOffset; // New offset uniform

attribute vec3 aTargetPosition;
attribute float aSize;
attribute float aIsDust;

varying float vIsDust;
varying vec3 vTargetPos;

void main() {
    vIsDust = aIsDust;
    vTargetPos = aTargetPosition;

    // Morph interpolation
    vec3 mixedPosition = mix(position, aTargetPosition, uMorphProgress);

    // Apply offset only during morphs (intro grid remains centered)
    mixedPosition.xy += uShapeOffset;

    // Organic wave flow
    float waveX = sin(mixedPosition.y * 1.5 + uTime * 1.2) * cos(mixedPosition.z * 1.0 + uTime * 0.8) * 0.15;
    ...
```

### 2.2 Smooth Color Fading (Pill Mode)
We modify `uPillMode` from a binary toggle to a continuous float (`0.0` to `1.0`) and animate it using GSAP.

**Fragment Shader changes:**
```glsl
uniform vec3 uColor;
uniform float uMorphProgress;
uniform float uPillMode; // Continuous blend weight (0.0 to 1.0)
varying float vIsDust;
varying vec3 vTargetPos;

void main() {
    ...
    vec3 finalColor = uColor;
    if (uPillMode > 0.001) {
        vec3 blue = vec3(0.23, 0.51, 0.96); // #3B82F6
        vec3 red = vec3(0.93, 0.26, 0.26);  // #EF4444
        vec3 pillColor = vTargetPos.x < 0.0 ? blue : red;
        vec3 mixedPillColor = mix(uColor, pillColor, uMorphProgress);
        finalColor = mix(uColor, mixedPillColor, uPillMode); // Smoothly fade colors
    }
    ...
```

---

## 3. Shape Geometry & 3D Euler Rotations

Standard Euler rotation matrices will be applied to points in `generatePositions()` to tilt the shapes:

```typescript
const rotateX = (x: number, y: number, z: number, angle: number) => {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [x, y * c - z * s, y * s + z * c];
};

const rotateY = (x: number, y: number, z: number, angle: number) => {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [x * c + z * s, y, -x * s + z * c];
};

const rotateZ = (x: number, y: number, z: number, angle: number) => {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [x * c - y * s, x * s + y * c, z];
};
```

### 3.1 Matrix Pills (Intro)
- **slender dimensions**: radius `r = 0.85`, cylinder half-height `1.5`.
- **volume-filled**: 30% of points distributed inside the cylinder/capsule volume.
- **tilt rotations**:
  - Left pill: rotated by $Z = -25^\circ$ (`-0.44` rad), $X = 15^\circ$ (`0.26` rad).
  - Right pill: rotated by $Z = 30^\circ$ (`0.52` rad), $Y = 20^\circ$ (`0.35` rad).
- **offsets**: Left pill offset at $X = -4.2$, Right pill offset at $X = 4.2$.

### 3.2 Mortarboard Cap (Education)
- **tilted view**: Rotate around $X$ by $20^\circ$ (`0.35` rad), $Y$ by $-25^\circ$ (`-0.44` rad).

### 3.3 Briefcase (Experience)
- **tilted view**: Rotate around $Y$ by $25^\circ$ (`0.44` rad), $X$ by $10^\circ$ (`0.17` rad).
- **detail enhancement**: Add two distinct square lock latches on the front body using 10% of the particles:
  - Latches centered at $X = \pm 1.2$, $Y = 0.5$, $Z = 0.65$.

### 3.4 Human Bust (About)
- **sculpture rotation**: Rotate around $Y$ by $20^\circ$ (`0.35` rad) for a 3/4 dynamic profile.

### 3.5 Laptop (Services)
- **perspective view**: Rotate around $Y$ by $-30^\circ$ (`-0.52` rad), $X$ by $12^\circ$ (`0.21` rad).

### 3.6 Paper Plane (Contacts)
- **mid-flight bank**: Rotate around $Z$ by $-15^\circ$ (`-0.26` rad), $Y$ by $-40^\circ$ (`-0.70` rad), $X$ by $15^\circ$ (`0.26` rad).

---

## 4. Layout Responsiveness & Transitions

### 4.1 Offsets Mapping
The target coordinates for `uShapeOffset` will be dynamically calculated during window resizing and section changes:

| Screen Mode | Intro (0) | Education (1) | Experience (2) | About (3) | Services (4) | Contacts (5) |
|---|---|---|---|---|---|---|
| **Desktop (aspect $\ge 1.0$)** | `(0, 0)` | `(3.8, 0.0)` | `(3.8, 0.0)` | `(3.8, 0.0)` | `(3.8, 0.0)` | `(0, 0)` |
| **Mobile (aspect $< 1.0$)** | `(0, 0)` | `(0.0, -1.2)` | `(0.0, -1.2)` | `(0.0, -1.2)` | `(0.0, -1.2)` | `(0, 0)` |

### 4.2 Tweening Offsets
Whenever `morphTo()` or `morphToGeometry()` is triggered, we animate `uShapeOffset` using GSAP:
```typescript
const targetOffset = this.getTargetOffset(sectionIndex);
if (this.offsetTween) this.offsetTween.kill();
this.offsetTween = gsap.to(this.particleMaterial.uniforms.uShapeOffset.value, {
  x: targetOffset.x,
  y: targetOffset.y,
  duration: this.prefersReducedMotion ? 0 : 1.4,
  ease: 'power2.inOut',
});
```

---

## 5. Glitch-Free Morphing Algorithm

To prevent snapping and glitches during rapid navigation:
1. When starting a morph, if `uMorphProgress` is in progress ($0 < progress < 1.0$), capture the interpolated position of each vertex:
   $$\vec{p}_{current} = \vec{p}_{position} + (\vec{p}_{target} - \vec{p}_{position}) \times progress$$
2. Overwrite the `position` BufferAttribute array with these interpolated coordinates and call `needsUpdate = true`.
3. Kill any active morph GSAP tween.
4. Set the `aTargetPosition` BufferAttribute to the new shape's positions.
5. Reset `uMorphProgress` back to `0.0`.
6. Start a new GSAP tween on `uMorphProgress` to animate it to `1.0`.

This guarantees that particle animations are continuous and smooth in all directions.

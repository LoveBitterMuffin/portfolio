import * as THREE from 'three';
import { gsap } from 'gsap';
import { detectLowEndDevice } from '../utils/detectLowEndDevice';

const vertexShader = `
uniform float uTime;
uniform float uMorphProgress;
uniform vec2 uPointer; // world space XY
uniform vec2 uShapeOffset; // New shape offset uniform

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

    // Offset applied only during morphs (intro grid is centered)
    mixedPosition.xy += uShapeOffset;

    // Organic fluid wave flow (high-performance 60fps)
    float waveX = sin(mixedPosition.y * 1.5 + uTime * 1.2) * cos(mixedPosition.z * 1.0 + uTime * 0.8) * 0.15;
    float waveY = cos(mixedPosition.x * 1.5 + uTime * 1.0) * sin(mixedPosition.z * 1.2 + uTime * 0.9) * 0.15;
    float waveZ = sin(mixedPosition.x * 1.0 + mixedPosition.y * 1.0 + uTime * 1.5) * 0.15;
    mixedPosition += vec3(waveX, waveY, waveZ);

    // Cursor repulsion
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    float dist = distance(modelPosition.xy, uPointer);
    if (dist < 2.5) {
        float force = (2.5 - dist) / 2.5;
        modelPosition.xy += normalize(modelPosition.xy - uPointer) * force * 0.5;
    }

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    
    // Size based on distance and whether it's dust
    gl_PointSize = aSize * (10.0 / -viewPosition.z);
}
`;

const fragmentShader = `
uniform vec3 uColor;
uniform float uMorphProgress;
uniform float uPillMode; // continuous blend weight
varying float vIsDust;
varying vec3 vTargetPos;

void main() {
    // Perfect smooth circle (Dala aesthetic)
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    if (distanceToCenter > 0.5) {
        discard;
    }
    
    // Soft anti-aliased edges
    float strength = 1.0 - smoothstep(0.4, 0.5, distanceToCenter);

    vec3 finalColor = uColor;
    if (uPillMode > 0.001) {
        vec3 blue = vec3(0.23, 0.51, 0.96); // #3B82F6
        vec3 red = vec3(0.93, 0.26, 0.26);  // #EF4444
        vec3 pillColor = vTargetPos.x < 0.0 ? blue : red;
        vec3 mixedPillColor = mix(uColor, pillColor, uMorphProgress);
        finalColor = mix(uColor, mixedPillColor, uPillMode);
    }

    if (vIsDust > 0.5) {
        // Dust: softer and more transparent
        gl_FragColor = vec4(finalColor, strength * 0.18);
    } else {
        // Primary particle
        gl_FragColor = vec4(finalColor, strength * 0.85);
    }
}
`;

// Section Accent Color Palettes (Light & Dark Theme Hexes)
const SECTION_COLORS_LIGHT = [
  0xDCDCDC, // 0: Intro (Platinum Grey)
  0x6366F1, // 1: Education (Royal Indigo)
  0x10B981, // 2: Experience (Emerald Green)
  0xF59E0B, // 3: About (Golden Amber)
  0x06B6D4, // 4: Services (Electric Cyan)
  0x8B5CF6, // 5: Contacts (Violet Purple)
];

const SECTION_COLORS_DARK = [
  0x52525B, // 0: Intro (Zinc Grey)
  0x818CF8, // 1: Education (Bright Indigo)
  0x34D399, // 2: Experience (Bright Emerald)
  0xFBBF24, // 3: About (Bright Amber)
  0x22D3EE, // 4: Services (Bright Cyan)
  0xA78BFA, // 5: Contacts (Bright Violet)
];

export class BackgroundGraphicsService {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  public readonly particlesCount: number;
  private targetPointer = { x: 0, y: 0 };
  private currentPointer = { x: 0, y: 0 };
  
  private prefersReducedMotion: boolean;
  private currentTheme: 'light' | 'dark' = 'light';

  private particleGeometry!: THREE.BufferGeometry;
  private particleMaterial!: THREE.ShaderMaterial;
  private particlePoints!: THREE.Points;

  private readonly SECTIONS_COUNT = 6;
  private positions: Float32Array[];
  private namedGeometries: Record<string, Float32Array> = {};
  private currentSectionIndex: number = 0;
  private currentGeometryKey: string | number = 0;

  private overrideColorHex: number | null = null;
  private colorTween: gsap.core.Tween | null = null;
  private morphTween: gsap.core.Tween | null = null;
  private pillModeTween: gsap.core.Tween | null = null;
  private offsetTween: gsap.core.Tween | null = null;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.particlesCount = detectLowEndDevice() ? 1200 : 4500;
    this.positions = new Array(this.SECTIONS_COUNT);

    const webglSupported = this.init();
    
    if (webglSupported) {
      if (this.prefersReducedMotion) {
        this.renderStaticFrame();
      } else {
        this.startLoop();
      }

      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  private init(): boolean {
    try {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
      this.camera.position.z = 5;

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.initParticles();
      return true;
    } catch (e) {
      console.warn('[BGService] WebGL not supported, using static fallback');
      this.canvas.style.display = 'none';
      this.container.style.background = 'var(--color-background)';
      return false;
    }
  }

  private initParticles() {
    this.generatePositions();

    this.particleGeometry = new THREE.BufferGeometry();
    
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(this.positions[0]), 3)
    );
    this.particleGeometry.setAttribute(
      'aTargetPosition',
      new THREE.BufferAttribute(new Float32Array(this.positions[0]), 3)
    );

    const sizes = new Float32Array(this.particlesCount);
    const isDust = new Float32Array(this.particlesCount);
    
    for (let i = 0; i < this.particlesCount; i++) {
        const dust = Math.random() > 0.25 ? 1.0 : 0.0;
        isDust[i] = dust;
        sizes[i] = dust > 0.5 ? Math.random() * 1.5 + 1.0 : Math.random() * 2.0 + 2.0; 
    }

    this.particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.setAttribute('aIsDust', new THREE.BufferAttribute(isDust, 1));

    const initialColor = SECTION_COLORS_LIGHT[0];

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: 0 },
        uPillMode: { value: 0 },
        uShapeOffset: { value: new THREE.Vector2(0, 0) },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Color(initialColor) }
      }
    });

    this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene!.add(this.particlePoints);
  }

  private generatePositions() {
    const count = this.particlesCount;

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

    // 0. Intro: Fullscreen Wave Grid (Expanded bounds [-12, 12] x [-7, 7] for 100% viewport coverage)
    const gridPositions = new Float32Array(count * 3);
    const cols = Math.ceil(Math.sqrt(count * 1.8));
    const rows = Math.ceil(count / cols);
    const stepX = 24.0 / cols;
    const stepY = 14.0 / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * stepX - 12.0 + (Math.random() - 0.5) * 0.1;
      const y = row * stepY - 7.0 + (Math.random() - 0.5) * 0.1;
      gridPositions[i * 3 + 0] = x;
      gridPositions[i * 3 + 1] = y;
      gridPositions[i * 3 + 2] = Math.sin(x * 0.8) * Math.cos(y * 0.8) * 0.4;
    }

    // 1. Education: Academic Mortarboard Cap (Diamond top, dome cap, tassel drop - rotated)
    const mortarboardPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let px = 0, py = 0, pz = 0;
      const part = Math.random();
      if (part < 0.65) {
        const u = (Math.random() - 0.5) * 4.2;
        const v = (Math.random() - 0.5) * 4.2;
        px = (u - v) * 0.7071;
        pz = (u + v) * 0.7071 * 0.5;
        py = 1.0 + (Math.random() - 0.5) * 0.15;
      } else if (part < 0.90) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * (Math.PI / 2.5);
        const capR = 1.6;
        px = Math.sin(phi) * Math.cos(theta) * capR;
        py = Math.cos(phi) * 0.9 + 0.1;
        pz = Math.sin(phi) * Math.sin(theta) * capR * 0.7;
      } else {
        const t = Math.random();
        const startX = 2.0;
        const startY = 1.0;
        const endX = 2.4;
        const endY = -1.2;
        px = startX + (endX - startX) * t + (Math.random() - 0.5) * 0.1;
        py = startY + (endY - startY) * t;
        pz = 0.5 + (Math.random() - 0.5) * 0.1;
      }
      let rot = rotateX(px, py, pz, 20 * Math.PI / 180);
      rot = rotateY(rot[0], rot[1], rot[2], -25 * Math.PI / 180);
      mortarboardPositions[i * 3 + 0] = rot[0];
      mortarboardPositions[i * 3 + 1] = rot[1];
      mortarboardPositions[i * 3 + 2] = rot[2];
    }

    // 2. Experience: Professional Briefcase (Rectangular body, handle arc, latches - rotated)
    const briefcasePositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let px = 0, py = 0, pz = 0;
      const part = Math.random();
      if (part < 0.65) {
        const edgeOnly = Math.random() > 0.3;
        if (edgeOnly) {
          const face = Math.floor(Math.random() * 6);
          const u = (Math.random() - 0.5) * 5.6;
          const v = (Math.random() - 0.5) * 3.0;
          if (face === 0) { px = u; py = v - 0.5; pz = 0.6; }
          else if (face === 1) { px = u; py = v - 0.5; pz = -0.6; }
          else if (face === 2) { px = 2.8; py = v - 0.5; pz = (Math.random() - 0.5) * 1.2; }
          else if (face === 3) { px = -2.8; py = v - 0.5; pz = (Math.random() - 0.5) * 1.2; }
          else if (face === 4) { px = u; py = 1.0; pz = (Math.random() - 0.5) * 1.2; }
          else { px = u; py = -2.0; pz = (Math.random() - 0.5) * 1.2; }
        } else {
          px = (Math.random() - 0.5) * 5.6;
          py = (Math.random() - 0.5) * 3.0 - 0.5;
          pz = (Math.random() - 0.5) * 1.2;
        }
      } else if (part < 0.85) {
        const theta = Math.PI * (0.2 + Math.random() * 0.6);
        const handleR = 1.1;
        px = Math.cos(theta) * handleR;
        py = 1.0 + Math.sin(theta) * 0.8;
        pz = (Math.random() - 0.5) * 0.2;
      } else {
        const isLeftLatch = Math.random() > 0.5;
        const lX = isLeftLatch ? -1.2 : 1.2;
        px = lX + (Math.random() - 0.5) * 0.3;
        py = 0.5 + (Math.random() - 0.5) * 0.3;
        pz = 0.65 + (Math.random() - 0.5) * 0.05;
      }
      let rot = rotateY(px, py, pz, 25 * Math.PI / 180);
      rot = rotateX(rot[0], rot[1], rot[2], 10 * Math.PI / 180);
      briefcasePositions[i * 3 + 0] = rot[0];
      briefcasePositions[i * 3 + 1] = rot[1];
      briefcasePositions[i * 3 + 2] = rot[2];
    }

    // 3. About: Human Silhouette Bust (Head sphere, neck, shoulders & torso profile - rotated)
    const humanBustPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let px = 0, py = 0, pz = 0;
      const part = Math.random();
      if (part < 0.35) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const bustR = 1.2;
        px = Math.sin(phi) * Math.cos(theta) * bustR;
        py = 1.8 + Math.cos(phi) * bustR * 1.2;
        pz = Math.sin(phi) * Math.sin(theta) * bustR * 0.9;
      } else if (part < 0.45) {
        const yVal = 0.3 + Math.random() * 0.5;
        const theta = Math.random() * Math.PI * 2;
        const neckR = 0.55;
        px = Math.cos(theta) * neckR;
        py = yVal;
        pz = Math.sin(theta) * neckR;
      } else {
        const t = Math.random();
        const yVal = 0.3 - t * 2.2;
        const width = 0.7 + Math.sin(t * Math.PI * 0.8) * 2.2;
        const theta = Math.random() * Math.PI * 2;
        px = Math.cos(theta) * width;
        py = yVal;
        pz = Math.sin(theta) * (width * 0.4);
      }
      const rot = rotateY(px, py, pz, 20 * Math.PI / 180);
      humanBustPositions[i * 3 + 0] = rot[0];
      humanBustPositions[i * 3 + 1] = rot[1];
      humanBustPositions[i * 3 + 2] = rot[2];
    }

    // 4. Services: Open Laptop & Code Terminal (Base plate, angled screen, code lines - rotated)
    const laptopPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let px = 0, py = 0, pz = 0;
      const part = Math.random();
      if (part < 0.40) {
        px = (Math.random() - 0.5) * 6.0;
        py = -1.2;
        pz = Math.random() * 2.5;
      } else if (part < 0.85) {
        const yVal = Math.random() * 3.2;
        px = (Math.random() - 0.5) * 5.6;
        py = -1.2 + yVal;
        pz = -yVal * 0.25;
      } else {
        const line = Math.floor(Math.random() * 5);
        px = (Math.random() - 0.5) * 4.8;
        py = -0.5 + line * 0.5;
        pz = -(line * 0.5) * 0.25 + 0.05;
      }
      let rot = rotateY(px, py, pz, -30 * Math.PI / 180);
      rot = rotateX(rot[0], rot[1], rot[2], 12 * Math.PI / 180);
      laptopPositions[i * 3 + 0] = rot[0];
      laptopPositions[i * 3 + 1] = rot[1];
      laptopPositions[i * 3 + 2] = rot[2];
    }

    // 5. Contacts: Paper Airplane / Mail (Folded 3D paper plane pointing up - rotated)
    const paperPlanePositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let px = 0, py = 0, pz = 0;
      const t = Math.random();
      const side = Math.random() > 0.5 ? 1 : -1;
      const part = Math.random();

      if (part < 0.70) {
        px = side * (t * 3.2);
        py = 2.5 - t * 4.5;
        pz = side * (t * 0.8);
        px += (Math.random() - 0.5) * 0.1;
        pz += (Math.random() - 0.5) * 0.1;
      } else {
        py = 2.5 - t * 4.5;
        pz = -t * 1.2;
        px = (Math.random() - 0.5) * 0.2;
      }
      let rot = rotateZ(px, py, pz, -15 * Math.PI / 180);
      rot = rotateY(rot[0], rot[1], rot[2], -40 * Math.PI / 180);
      rot = rotateX(rot[0], rot[1], rot[2], 15 * Math.PI / 180);
      paperPlanePositions[i * 3 + 0] = rot[0];
      paperPlanePositions[i * 3 + 1] = rot[1];
      paperPlanePositions[i * 3 + 2] = rot[2];
    }

    // Matrix Pill ('pill') - Two Capsules for Intro (volumetric, rotated)
    const pillPositions = new Float32Array(count * 3);
    const r = 0.85;
    const halfHeight = 1.5;
    for (let i = 0; i < count; i++) {
      const isLeft = i % 2 === 0;
      const xOffset = isLeft ? -4.2 : 4.2;
      
      const isVolume = Math.random() < 0.3;
      const currentR = r * (isVolume ? Math.pow(Math.random(), 0.5) : 1.0);
      
      let px = 0, py = 0, pz = 0;
      
      const isCyl = Math.random() > 0.4;
      if (isCyl) {
        py = (Math.random() * 2 - 1) * halfHeight;
        const theta = Math.random() * Math.PI * 2;
        px = Math.cos(theta) * currentR;
        pz = Math.sin(theta) * currentR;
      } else {
        const isTop = Math.random() > 0.5;
        const phi = Math.random() * Math.PI * 2;
        const u = Math.random();
        const theta = Math.acos(2 * u - 1) / 2;
        const sign = isTop ? 1 : -1;
        px = Math.sin(theta) * Math.cos(phi) * currentR;
        py = (isTop ? halfHeight : -halfHeight) + Math.cos(theta) * currentR * sign;
        pz = Math.sin(theta) * Math.sin(phi) * currentR;
      }

      let rot: number[];
      if (isLeft) {
        rot = rotateZ(px, py, pz, -25 * Math.PI / 180);
        rot = rotateX(rot[0], rot[1], rot[2], 15 * Math.PI / 180);
      } else {
        rot = rotateZ(px, py, pz, 30 * Math.PI / 180);
        rot = rotateY(rot[0], rot[1], rot[2], 20 * Math.PI / 180);
      }
      
      pillPositions[i * 3 + 0] = rot[0] + xOffset;
      pillPositions[i * 3 + 1] = rot[1];
      pillPositions[i * 3 + 2] = rot[2];
    }

    this.positions = [
      gridPositions,          // 0: Intro
      mortarboardPositions,   // 1: Education
      briefcasePositions,      // 2: Experience
      humanBustPositions,      // 3: About
      laptopPositions,         // 4: Services
      paperPlanePositions,     // 5: Contacts
    ];

    this.namedGeometries = {
      'grid': gridPositions,
      'mortarboard': mortarboardPositions,
      'briefcase': briefcasePositions,
      'human': humanBustPositions,
      'laptop': laptopPositions,
      'plane': paperPlanePositions,
      'pill': pillPositions,
    };
  }

  private getTargetOffset(sectionIndex: number): THREE.Vector2 {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (sectionIndex === 0 || sectionIndex === 5) {
      return new THREE.Vector2(0, 0);
    }
    return isMobile ? new THREE.Vector2(0, -1.2) : new THREE.Vector2(3.8, 0);
  }

  public morphTo(sectionIndex: number, progress?: number): void {
    if (sectionIndex < 0 || sectionIndex >= this.SECTIONS_COUNT) return;
    this.currentSectionIndex = sectionIndex;
    this.currentGeometryKey = sectionIndex;
    
    if (!this.particleGeometry || !this.particleMaterial) return;
    const target = this.positions[sectionIndex];
    if (!target) return;
    
    this.applyMorphTarget(target, progress);
    this.syncSectionColor(sectionIndex);

    // Dynamic shape offset positioning
    const targetOffset = this.getTargetOffset(sectionIndex);
    if (this.offsetTween) this.offsetTween.kill();
    this.offsetTween = gsap.to(this.particleMaterial.uniforms.uShapeOffset.value, {
      x: targetOffset.x,
      y: targetOffset.y,
      duration: this.prefersReducedMotion ? 0 : 1.4,
      ease: 'power2.inOut',
    });
  }
  
  public morphToGeometry(type: string | number, progress?: number): void {
    if (typeof type === 'number') {
        this.morphTo(type, progress);
        return;
    }
    
    if (this.currentGeometryKey === type) return;
    this.currentGeometryKey = type;
    
    if (!this.particleGeometry || !this.particleMaterial) return;
    const target = this.namedGeometries[type];
    if (!target) return;
    
    this.applyMorphTarget(target, progress);

    // Reset offset to center for special geometries (pills, grid)
    if (this.offsetTween) this.offsetTween.kill();
    this.offsetTween = gsap.to(this.particleMaterial.uniforms.uShapeOffset.value, {
      x: 0,
      y: 0,
      duration: this.prefersReducedMotion ? 0 : 1.4,
      ease: 'power2.inOut',
    });
  }

  private applyMorphTarget(target: Float32Array, progress?: number): void {
    if (this.morphTween) {
      this.morphTween.kill();
      this.morphTween = null;
    }

    const posAttr = this.particleGeometry.attributes.position as THREE.BufferAttribute;
    const targetAttr = this.particleGeometry.attributes.aTargetPosition as THREE.BufferAttribute;
    const currentProgress = this.particleMaterial.uniforms.uMorphProgress.value;

    // Capture and write intermediate coordinates if we were mid-morph
    if (currentProgress > 0.001 && currentProgress < 0.999) {
      const posArray = posAttr.array as Float32Array;
      const targetArray = targetAttr.array as Float32Array;
      for (let i = 0; i < posArray.length; i++) {
        posArray[i] = posArray[i] + (targetArray[i] - posArray[i]) * currentProgress;
      }
      posAttr.needsUpdate = true;
    } else if (currentProgress >= 0.999) {
      const targetArray = targetAttr.array as Float32Array;
      (posAttr.array as Float32Array).set(targetArray);
      posAttr.needsUpdate = true;
    }

    this.particleMaterial.uniforms.uMorphProgress.value = 0;
    (this.particleGeometry.attributes.aTargetPosition as THREE.BufferAttribute).set(target);
    this.particleGeometry.attributes.aTargetPosition.needsUpdate = true;

    if (progress !== undefined) {
      this.particleMaterial.uniforms.uMorphProgress.value = progress;
      if (progress >= 1.0) {
        this.swapBuffers();
      }
    } else {
      this.morphTween = gsap.to(this.particleMaterial.uniforms.uMorphProgress, {
        value: 1,
        duration: this.prefersReducedMotion ? 0 : 1.4,
        ease: 'power2.inOut',
        onComplete: () => {
          this.swapBuffers();
          this.morphTween = null;
        },
      });
    }
  }

  private swapBuffers(): void {
    if (!this.particleGeometry || !this.particleMaterial) return;
    const src = this.particleGeometry.attributes.aTargetPosition.array;
    (this.particleGeometry.attributes.position.array as Float32Array).set(src as ArrayLike<number>);
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleMaterial.uniforms.uMorphProgress.value = 0;
  }

  private syncSectionColor(sectionIndex: number): void {
    if (this.overrideColorHex !== null) return;
    const colors = this.currentTheme === 'light' ? SECTION_COLORS_LIGHT : SECTION_COLORS_DARK;
    const targetHex = colors[sectionIndex] ?? colors[0];
    this.transitionColorTo(targetHex);
  }

  public overrideColor(hex: number): void {
    if (this.overrideColorHex === hex) return;
    this.overrideColorHex = hex;
    this.transitionColorTo(hex);
  }

  public setPillMode(active: boolean): void {
    if (!this.particleMaterial) return;
    if (this.pillModeTween) this.pillModeTween.kill();
    
    this.pillModeTween = gsap.to(this.particleMaterial.uniforms.uPillMode, {
      value: active ? 1.0 : 0.0,
      duration: this.prefersReducedMotion ? 0 : 1.4,
      ease: 'power2.inOut',
      onComplete: () => {
        this.pillModeTween = null;
      }
    });
  }

  public clearColorOverride(): void {
    if (this.overrideColorHex === null) return;
    this.overrideColorHex = null;
    this.syncSectionColor(this.currentSectionIndex);
  }

  public updateParticleColor(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;
    if (this.overrideColorHex === null) {
      this.syncSectionColor(this.currentSectionIndex);
    }
  }

  private transitionColorTo(hex: number): void {
    if (!this.particleMaterial) return;
    if (this.colorTween) this.colorTween.kill();
    
    const targetColor = new THREE.Color(hex);
    this.colorTween = gsap.to(this.particleMaterial.uniforms.uColor.value, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: this.prefersReducedMotion ? 0 : 1.2,
      ease: 'power2.out',
    });
  }

  private renderStaticFrame = () => {
    if (this.isDestroyed || !this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  };

  private startLoop = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private stopLoop = () => {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.stopLoop();
    } else if (!this.prefersReducedMotion) {
      this.startLoop();
    }
  };

  private animate = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    this.currentPointer.x += (this.targetPointer.x - this.currentPointer.x) * 0.1;
    this.currentPointer.y += (this.targetPointer.y - this.currentPointer.y) * 0.1;

    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uPointer.value.set(this.currentPointer.x, this.currentPointer.y);
      this.particleMaterial.uniforms.uTime.value = performance.now() / 1000;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  public updatePointer(clientX: number, clientY: number): void {
    if (!this.camera) return;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    this.targetPointer.x = intersection.x;
    this.targetPointer.y = intersection.y;
  }

  public resize(width: number, height: number) {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.particleMaterial) {
      const currentOffset = this.getTargetOffset(this.currentSectionIndex);
      this.particleMaterial.uniforms.uShapeOffset.value.copy(currentOffset);
    }
  }

  public setReducedMotion(reduced: boolean): void {
    if (this.prefersReducedMotion === reduced) return;
    
    this.prefersReducedMotion = reduced;
    
    if (reduced) {
      this.stopLoop();
      this.renderStaticFrame();
    } else {
      this.startLoop();
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.stopLoop();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    // Kill active tweens
    if (this.morphTween) this.morphTween.kill();
    if (this.pillModeTween) this.pillModeTween.kill();
    if (this.offsetTween) this.offsetTween.kill();
    if (this.colorTween) this.colorTween.kill();

    this.scene?.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
      
      if (object.geometry) {
        object.geometry.dispose();
      }

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}

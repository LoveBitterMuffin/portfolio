import * as THREE from 'three';
import { gsap } from 'gsap';
import { detectLowEndDevice } from '../utils/detectLowEndDevice';

const vertexShader = `
uniform float uTime;
uniform float uMorphProgress;
uniform vec2 uPointer; // world space XY

attribute vec3 aTargetPosition;

void main() {
    // Интерполяция позиций для морфинга
    vec3 mixedPosition = mix(position, aTargetPosition, uMorphProgress);

    // Эффект отталкивания от курсора
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    float dist = distance(modelPosition.xy, uPointer);
    if (dist < 2.0) {
        float force = (2.0 - dist) / 2.0;
        modelPosition.xy += normalize(modelPosition.xy - uPointer) * force * 0.5;
    }

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    gl_PointSize = 2.0 * (300.0 / -viewPosition.z);
}
`;

const fragmentShader = `
uniform vec3 uColor;

void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    if (distanceToCenter > 0.5) {
        discard;
    }

    float strength = 1.0 - smoothstep(0.4, 0.5, distanceToCenter);
    gl_FragColor = vec4(uColor, strength * 0.8);
}
`;

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

  private particleGeometry!: THREE.BufferGeometry;
  private particleMaterial!: THREE.ShaderMaterial;
  private particlePoints!: THREE.Points;

  private readonly SECTIONS_COUNT = 5;
  private positions: Float32Array[];

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.particlesCount = detectLowEndDevice() ? 300 : 1000;
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
      // Set canvas to hidden and use CSS fallback
      this.canvas.style.display = 'none';
      this.container.style.background = 'var(--color-background)';
      return false;
    }
  }

  private initParticles() {
    this.generatePositions();

    this.particleGeometry = new THREE.BufferGeometry();
    
    // Set initial position (Section 0)
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(this.positions[0]), 3)
    );
    // Set target position (initially same as Section 0, will be morphed)
    this.particleGeometry.setAttribute(
      'aTargetPosition',
      new THREE.BufferAttribute(new Float32Array(this.positions[0]), 3)
    );

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Color(0xDCDCDC) }
      }
    });

    this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene!.add(this.particlePoints);
  }

  private generatePositions() {
    const count = this.particlesCount;

    // 0: Intro (Grid)
    const gridPositions = new Float32Array(count * 3);
    const gridSize = Math.ceil(Math.sqrt(count));
    const step = 6 / gridSize;
    for (let i = 0; i < count; i++) {
      const x = (i % gridSize) * step - 3;
      const y = Math.floor(i / gridSize) * step - 3;
      gridPositions[i * 3 + 0] = x;
      gridPositions[i * 3 + 1] = y;
      gridPositions[i * 3 + 2] = Math.sin(x * 2.0) * Math.cos(y * 2.0) * 0.2; // slight z-noise
    }
    this.positions[0] = gridPositions;

    // 1: Education (Rings)
    const ringPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 1 + Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      ringPositions[i * 3 + 0] = Math.cos(angle) * radius;
      ringPositions[i * 3 + 1] = Math.sin(angle) * radius;
      ringPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    this.positions[1] = ringPositions;

    // 2: Experience (Timeline Axis)
    const timelinePositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const isTick = Math.random() > 0.9;
      const x = (Math.random() - 0.5) * 8; // wide line
      timelinePositions[i * 3 + 0] = x;
      timelinePositions[i * 3 + 1] = isTick ? (Math.random() - 0.5) * 0.5 : (Math.random() - 0.5) * 0.1;
      timelinePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    this.positions[2] = timelinePositions;

    // 3: About (Sphere - Fibonacci)
    const spherePositions = new Float32Array(count * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      spherePositions[i * 3 + 0] = Math.cos(theta) * radius * 1.5;
      spherePositions[i * 3 + 1] = y * 1.5;
      spherePositions[i * 3 + 2] = Math.sin(theta) * radius * 1.5;
    }
    this.positions[3] = spherePositions;

    // 4: Contacts (Cloud)
    const cloudPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      cloudPositions[i * 3 + 0] = (Math.random() - 0.5) * 10;
      cloudPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      cloudPositions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    this.positions[4] = cloudPositions;
  }

  public morphTo(sectionIndex: number, progress?: number): void {
    if (!this.particleGeometry || !this.particleMaterial) return;

    const target = this.positions[sectionIndex];
    if (!target) return;

    (this.particleGeometry.attributes.aTargetPosition as THREE.BufferAttribute).set(target);
    this.particleGeometry.attributes.aTargetPosition.needsUpdate = true;

    if (progress !== undefined) {
      // Скролл-скруббинг
      this.particleMaterial.uniforms.uMorphProgress.value = progress;
      if (progress >= 1.0) {
        this.swapBuffers();
      }
    } else {
      // Триггерный морфинг
      gsap.to(this.particleMaterial.uniforms.uMorphProgress, {
        value: 1,
        duration: this.prefersReducedMotion ? 0 : 1.5,
        ease: 'power2.inOut',
        onComplete: () => this.swapBuffers(),
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
    
    // Сглаживание координат курсора
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

  public updateParticleColor(theme: 'light' | 'dark'): void {
    const colorHex = theme === 'light' ? 0xDCDCDC : 0x52525B;
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uColor.value.setHex(colorHex);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.stopLoop();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

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

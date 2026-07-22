# Background Graphics Service: Design Document

Этот сервис отвечает за рендеринг GPU-ускоренного интерактивного фона на базе **Three.js** (Vanilla JS). Фоновое сопровождение представляет собой минималистичную систему частиц на чистом белом фоне, которая реагирует на движение курсора и плавно перестраивается (морфинг) при горизонтальном скролле секций.

---

## 1. Архитектура и структуры данных

Класс `BackgroundGraphicsService` инкапсулирует всю работу с WebGL, Three.js сценой, камерой ортографического или перспективного типа, буферами геометрии частиц и шейдерами.

### Класс `BackgroundGraphicsService`

```typescript
import * as THREE from 'three';
import { gsap } from 'gsap';

export class BackgroundGraphicsService {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Частицы
  // На мобильных устройствах и слабых GPU используется 300 вместо 1000
  private particlesCount: number;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private particlePoints: THREE.Points;

  // Фиксированный массив состояний частиц для морфинга (по числу секций)
  private readonly SECTIONS_COUNT = 5;
  private positions: Float32Array[]; // length === SECTIONS_COUNT

  // Текущее состояние интерактива
  private targetPointer = { x: 0, y: 0 };
  private currentPointer = { x: 0, y: 0 };

  // RAF handle
  private animFrameId: number | null = null;

  // Флаг доступности анимации
  private readonly prefersReducedMotion: boolean;

  constructor(container: HTMLDivElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;

    // Определяем предпочтение пользователя по анимации
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Деградация: снижаем нагрузку на слабых GPU / мобильных
    this.particlesCount = this.detectLowEndDevice() ? 300 : 1000;

    this.positions = new Array(this.SECTIONS_COUNT);

    this.initThree();
    this.initParticles();

    // Запускаем RAF только если анимация разрешена
    if (this.prefersReducedMotion) {
      this.renderStaticFrame(); // единственный кадр для статичного состояния
    } else {
      this.startLoop();
    }

    // Пауза при скрытии вкладки — экономия батареи
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  // Публичное API
  // ВАЖНО: resize вызывается извне (желательно через ResizeObserver оркестратором),
  // а не читает размеры DOM внутри requestAnimationFrame (предотвращает layout thrash)
  public resize(width: number, height: number): void;
  public updatePointer(clientX: number, clientY: number): void;
  public morphTo(sectionIndex: number, progress?: number): void;
  public destroy(): void;

  // Приватные хелперы
  private detectLowEndDevice(): boolean;
  private renderStaticFrame(): void;
  private startLoop(): void;
  private stopLoop(): void;
  private onVisibilityChange = (): void => {
    if (document.hidden) this.stopLoop();
    else if (!this.prefersReducedMotion) this.startLoop();
  };
}
```

#### Деградация по мощности устройства

```typescript
private detectLowEndDevice(): boolean {
  // Мобильное устройство или ограниченная память
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const lowMemory = (navigator as any).deviceMemory !== undefined
    && (navigator as any).deviceMemory < 4;
  return isMobile || lowMemory;
}
```

#### Очистка ресурсов в `destroy()`

```typescript
public destroy(): void {
  this.stopLoop();
  document.removeEventListener('visibilitychange', this.onVisibilityChange);
  // Примечание: если в оркестраторе использовался ResizeObserver или слушатель на window.resize,
  // их также нужно отключать (observer.disconnect() или removeEventListener).

  // Обязательно: освобождаем GPU-память
  this.particleGeometry.dispose();
  this.particleMaterial.dispose();
  this.renderer.dispose();
}
```

---

## 2. Спецификация морфинга частиц

Для каждой секции портфолио рассчитывается целевой массив координат `Float32Array` размером `particlesCount * 3`. Массив `positions` инициализируется в конструкторе фиксированной длиной `SECTIONS_COUNT = 5`.

### Состояния геометрии и цветовой гаммы частиц (Смысловой дизайн)
1.  **Секция 0: Intro (Genesis & Digital Void)**
    *   *Смысловая форма*: Полноэкранная колышущаяся сетка (Wave Grid $[-12, 12] \times [-7, 7]$) + Интерактивные Двойные Матричные Таблетки (Blue/Red Pill).
    *   *Цвет*: Серый платиновый (`#DCDCDC` / `#52525B`).При наведении мыши образуются синяя (`#3B82F6`) и красная (`#EF4444`) 3D-капсулы.
2.  **Секция 1: Education (Академический фундамент)**
    *   *Смысловая форма*: 3D Академическая шляпка выпускника (Mortarboard Cap) — с плоским наклоненным ромбом, куполом и кисточкой.
    *   *Цвет*: Королевский индиго (`#6366F1` Light / `#818CF8` Dark).
3.  **Секция 2: Experience (Карьерный опыт и решения)**
    *   *Смысловая форма*: 3D Деловой портфель (Briefcase) — с четким прямоугольным корпусом, защелками и выгнутой дугообразной ручкой.
    *   *Цвет*: Изумрудно-зеленый (`#10B981` Light / `#34D399` Dark).
4.  **Секция 3: About (Портрет и личность)**
    *   *Смысловая форма*: 3D Силуэт / Бюст человека (Human Bust Profile) — с контуром головы, шеи и плечевого пояса.
    *   *Цвет*: Янтарно-золотой (`#F59E0B` Light / `#FBBF24` Dark).
5.  **Секция 4: Services (Инженерные решения)**
    *   *Смысловая форма*: 3D Открытый ноутбук и Кодовый терминал (Laptop & Code Terminal) — с подставкой, экраном и строками кода.
    *   *Цвет*: Электрический циан (`#06B6D4` Light / `#22D3EE` Dark).
6.  **Секция 5: Contacts (Связь и глобальный охват)**
    *   *Смысловая форма*: 3D Бумажный самолетик / Конверт (Paper Airplane) — устремленная вверх трехмерная структура.
    *   *Цвет*: Фиолетовый / Пурпурный (`#8B5CF6` Light / `#A78BFA` Dark).

### Реализация морфинга через GSAP

Морфинг реализован через буфер `aTargetPosition` в `BufferGeometry`. В шейдере интерполируется положение вершины между `position` (исходное) и `aTargetPosition` (целевое) с помощью юниформы `uMorphProgress` (от 0 до 1).

GSAP анимирует эту юниформу при триггерном морфинге, либо значение устанавливается напрямую при скролл-скруббинге. При `prefers-reduced-motion` используется мгновенный переход (`duration: 0`):

```typescript
public morphTo(sectionIndex: number, progress?: number): void {
  // Записать целевые позиции в атрибут геометрии
  const target = this.positions[sectionIndex];
  this.particleGeometry.attributes.aTargetPosition.set(target);
  this.particleGeometry.attributes.aTargetPosition.needsUpdate = true;

  if (progress !== undefined) {
    // 1. Скролл-скруббинг (L1: Scroll-driven morphing)
    // Значение uMorphProgress привязано непосредственно к прогрессу скролла
    this.particleMaterial.uniforms.uMorphProgress.value = progress;

    // Своп буферов при достижении полной прокрутки (100% перехода)
    if (progress >= 1.0) {
      this.swapBuffers();
    }
  } else {
    // 2. Триггерный морфинг (L5: Morph transition)
    // Мгновенный переход при reduced-motion, плавный 1.5s — по умолчанию
    gsap.to(this.particleMaterial.uniforms.uMorphProgress, {
      value: 1,
      duration: this.prefersReducedMotion ? 0 : 1.5,
      ease: 'power2.inOut',
      onComplete: () => this.swapBuffers(),
    });
  }
}

private swapBuffers(): void {
  // SWAP: aTargetPosition → position, чтобы следующий морфинг
  // стартовал с правильных координат
  const src = this.particleGeometry.attributes.aTargetPosition.array;
  this.particleGeometry.attributes.position.array.set(src);
  this.particleGeometry.attributes.position.needsUpdate = true;

  // Сброс прогресса для подготовки к следующему переходу
  this.particleMaterial.uniforms.uMorphProgress.value = 0;
}
```

---

## 3. GPU Шейдеры (GLSL)

Для отрисовки частиц используется `THREE.ShaderMaterial` с кастомными вершинным и фрагментным шейдерами для максимальной производительности: круглые точки со сглаживанием без текстур.

### Система координат `uPointer`

**`uPointer` передаётся в world space (XY-плоскость сцены).**

Конвертация из экранных координат выполняется на CPU через плоскость пересечения:

```typescript
public updatePointer(clientX: number, clientY: number): void {
  const rect = this.canvas.getBoundingClientRect();
  // Нормализованные координаты устройства [-1, 1]
  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );

  // Пересечение луча с плоскостью Z=0 (world space)
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, this.camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersection);

  // targetPointer — в world space, lerp происходит в RAF
  this.targetPointer.x = intersection.x;
  this.targetPointer.y = intersection.y;
}
```

В RAF выполняется сглаживание и обновление юниформы:
```typescript
this.currentPointer.x += (this.targetPointer.x - this.currentPointer.x) * 0.1;
this.currentPointer.y += (this.targetPointer.y - this.currentPointer.y) * 0.1;
this.particleMaterial.uniforms.uPointer.value.set(
  this.currentPointer.x,
  this.currentPointer.y,
);
```

### Vertex Shader

```glsl
uniform float uTime;
uniform float uMorphProgress;
uniform vec2 uPointer; // world space XY

attribute vec3 aTargetPosition;

void main() {
    // Интерполяция позиций для морфинга
    vec3 mixedPosition = mix(position, aTargetPosition, uMorphProgress);

    // Эффект отталкивания от курсора (оба в world space — координаты совпадают)
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    float dist = distance(modelPosition.xy, uPointer);
    if (dist < 2.0) {
        float force = (2.0 - dist) / 2.0;
        modelPosition.xy += normalize(modelPosition.xy - uPointer) * force * 0.5;
    }

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    // Размер точки с учётом перспективного деления
    gl_PointSize = 2.0 * (300.0 / -viewPosition.z);
}
```

### Fragment Shader

```glsl
uniform vec3 uColor; // Цвет частиц (задаётся из JS)

void main() {
    // Идеальный сглаженный круг вместо квадратной точки
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    if (distanceToCenter > 0.5) {
        discard;
    }

    // Мягкое сглаживание краёв
    float strength = 1.0 - smoothstep(0.4, 0.5, distanceToCenter);

    // Цвет частиц из юниформы (Light: #DCDCDC, Dark: #52525B)
    gl_FragColor = vec4(uColor, strength * 0.8);
}
```

### Поддержка тёмной темы

Для поддержки переключения тем добавьте метод в `BackgroundGraphicsService`:

```typescript
public updateParticleColor(theme: 'light' | 'dark'): void {
  const color = theme === 'light' ? new THREE.Color(0xDCDCDC) : new THREE.Color(0x52525B);
  this.particleMaterial.uniforms.uColor.value.copy(color);
}
```

Инициализация юниформы цвета в конструкторе:

```typescript
this.particleMaterial = new THREE.ShaderMaterial({
  // ... другие параметры
  uniforms: {
    uTime: { value: 0 },
    uMorphProgress: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uColor: { value: new THREE.Color(0xDCDCDC) }, // Light theme по умолчанию
  },
});
```

> **Примечание:** `vDistanceToPointer` (varying) исключён из шейдеров — он не использовался. Если в будущем потребуется tinting частиц вблизи курсора, его нужно добавить обратно.

---

## 4. Оптимизации производительности (GSAP + GPU)

1.  **Instanced/Buffer Geometry**: Все частицы рендерятся за один вызов отрисовки (`draw call`) с использованием `THREE.Points`.
2.  **Шейдерная анимация**: Вычисления интерактива мыши и морфинга перенесены в вершинный шейдер на GPU. CPU выполняет только обновление юниформ.
3.  **Throttling мыши**: Координаты сглаживаются в RAF через lerp, снижая частоту отправки данных на GPU:
    `currentPointer.x += (targetPointer.x - currentPointer.x) * 0.1;`
4.  **Пауза при hidden tab**: RAF останавливается при `document.visibilitychange`, возобновляется при возврате. Экономит батарею на мобильных.
5.  **Деградация по мощности**: На мобильных и слабых GPU `particlesCount` снижается до 300.

---

## 5. Accessibility

| Требование | Реализация |
|---|---|
| `prefers-reduced-motion` | RAF не запускается; морфинг использует `duration: 0` |
| Низкая мощность GPU | `particlesCount = 300`, опционально — CSS-fallback |
| Скрытая вкладка | `visibilitychange` → `stopLoop()` / `startLoop()` |
| Очистка памяти | `geometry.dispose()`, `material.dispose()`, `renderer.dispose()` в `destroy()` |

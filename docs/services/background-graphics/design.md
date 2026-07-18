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
  private particlesCount: number = 1000;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private particlePoints: THREE.Points;
  
  // Координаты состояний частиц для морфинга
  private positions: { [key: number]: Float32Array } = {};
  
  // Текущее состояние интерактива
  private targetPointer = { x: 0, y: 0 };
  private currentPointer = { x: 0, y: 0 };

  constructor(container: HTMLDivElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;
    this.initThree();
    this.initParticles();
    this.startLoop();
  }
  
  // Публичное API
  public resize(width: number, height: number): void;
  public updatePointer(x: number, y: number): void;
  public morphTo(sectionIndex: number, progress: number): void;
  public destroy(): void;
}
```

---

## 2. Спецификация морфинга частиц

Для каждой секции портфолио рассчитывается целевой массив координат `Float32Array` размером `particlesCount * 3`.

### Состояния геометрии частиц
1.  **Секция 0: Intro**
    *   *Форма*: Горизонтальная разреженная плоскость (grid) с легким шумом высоты по оси Z.
    *   *Поведение*: Частицы мягко колышутся. Оставляют "пустоту" в радиусе 150px вокруг курсора мыши.
2.  **Секция 1: Education**
    *   *Форма*: Кольца или концентрические круги (Detroit style).
    *   *Поведение*: Вращаются с медленной скоростью вокруг своей оси.
3.  **Секция 2: Experience**
    *   *Форма*: Горизонтальная прямая линия (ось времени) по центру экрана, возможно с небольшими вертикальными ответвлениями в точках дат.
    *   *Поведение*: Частицы пульсируют вдоль линии.
4.  **Секция 3: About / Tech Stack**
    *   *Форма*: Идеальная 3D-сфера из точек.
    *   *Поведение*: Вращается при движении мыши (эффект трекбола).
5.  **Секция 4: Contacts**
    *   *Форма*: Хаотичное облако с градиентом прозрачности к краям экрана.
    *   *Поведение*: Эффект медленного броуновского движения, частицы улетают за пределы видимости.

### Реализация морфинга через GSAP
Для выполнения морфинга мы создаем буфер атрибутов в `BufferGeometry` под названием `aTargetPosition`. В шейдере мы интерполируем положение вершины между `position` (исходное) и `aTargetPosition` (целевое) с помощью униформы `uMorphProgress` (от 0 до 1).

GSAP анимирует эту униформу:
```typescript
gsap.to(this.particleMaterial.uniforms.uMorphProgress, {
  value: 1,
  duration: 1.5,
  ease: 'power2.inOut',
  onComplete: () => {
    // После завершения переносим целевые координаты в исходные
    // и сбрасываем uMorphProgress в 0 для подготовки к следующему морфингу
  }
});
```

---

## 3. GPU Шейдеры (GLSL)

Для отрисовки частиц используется `THREE.ShaderMaterial` с кастомными вершинным и фрагментным шейдерами для обеспечения максимальной производительности отрисовки точек круглой формы со сглаживанием без текстур.

### Vertex Shader
```glsl
uniform float uTime;
uniform float uMorphProgress;
uniform vec2 uPointer;
attribute vec3 aTargetPosition;
varying float vDistanceToPointer;

void main() {
    // Интерполяция позиций для морфинга
    vec3 mixedPosition = mix(position, aTargetPosition, uMorphProgress);
    
    // Эффект отталкивания от курсора (в пространстве сцены)
    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.0);
    float dist = distance(modelPosition.xy, uPointer);
    if (dist < 2.0) {
        float force = (2.0 - dist) / 2.0;
        modelPosition.xy += normalize(modelPosition.xy - uPointer) * force * 0.5;
    }
    
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
    
    // Задание размера точки с учетом перспективного деления
    gl_PointSize = 2.0 * (300.0 / -viewPosition.z);
}
```

### Fragment Shader
```glsl
void main() {
    // Отрисовка идеального сглаженного круга вместо квадратной точки
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    if (distanceToCenter > 0.5) {
        discard;
    }
    
    // Мягкое сглаживание краев
    float strength = 1.0 - smoothstep(0.4, 0.5, distanceToCenter);
    
    // Минималистичный платиновый цвет (#dcdcdc)
    vec3 color = vec3(0.86, 0.86, 0.86);
    
    gl_FragColor = vec4(color, strength * 0.8);
}
```

---

## 4. Оптимизации производительности (GSAP + GPU)

1.  **Instanced/Buffer Geometry**: Все частицы рендерятся за один вызов отрисовки (`draw call`) с использованием `THREE.Points`.
2.  **Шейдерная анимация**: Вычисления интерактива мыши и морфинга перенесены в вершинный шейдер на GPU. CPU выполняет только обновление униформ.
3.  **Throttling**: Координаты мыши сглаживаются в цикле рендеринга (RAF) через линейную интерполяцию (lerp) на CPU, снижая частоту отправки данных на GPU:
    `currentPointer.x += (targetPointer.x - currentPointer.x) * 0.1;`

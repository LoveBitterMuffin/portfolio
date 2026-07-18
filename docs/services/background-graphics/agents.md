# Background Graphics Service: Agent Rules & Guidelines

Этот файл содержит строгие правила, ограничения и примеры реализации для ИИ-агентов, работающих с сервисом фоновой графики на Three.js.

---

## 1. Критические ограничения

> [!IMPORTANT]
> **Никогда** не подключайте библиотеку `@react-three/fiber` или `@react-three/drei`. Данный сервис должен быть написан на чистом (Vanilla) Three.js с прямой инициализацией контекста canvas для обеспечения максимальной производительности.

> [!WARNING]
> Избегайте использования стейта React (`useState`, `useContext`) для проброса координат мыши или прогресса скролла в Three.js. Передача данных должна происходить строго через прямой вызов методов инстанса сервиса:
> `bgServiceRef.current.updatePointer(x, y)`

---

## 2. Лучшие практики производительности (Performance)

*   **Очистка памяти (Memory Cleanup)**: При размонтировании компонента (эффект очистки в `useEffect`) обязательно вызывайте метод `destroy()`. Внутри метода `destroy()` вы **должны**:
    1.  Остановить цикл `requestAnimationFrame`.
    2.  Вызвать `.dispose()` для всех геометрий (`BufferGeometry`) и материалов (`ShaderMaterial`, `PointsMaterial`).
    3.  Очистить текстуры, если они использовались.
    4.  Удалить canvas из DOM-дерева и занулить ссылки на Three.js объекты для сборщика мусора (GC).
*   **Снижение нагрузки на CPU**: Все расчеты позиций частиц во время анимации морфинга должны производиться на GPU в Vertex Shader. Не изменяйте буферы атрибутов на CPU в каждом кадре, если это не вызвано крайней необходимостью.
*   **Избегайте Layout Thrashing**: Не считывайте размеры контейнера (`getBoundingClientRect`) в цикле рендеринга. Размеры должны считываться только в методе `resize()`, который вызывается по событию изменения размера окна или через `ResizeObserver`.

---

## 3. Шаблон реализации сервиса

Используйте следующий шаблон кода при реализации или модификации класса:

```typescript
import * as THREE from 'three';

export class BackgroundGraphicsService {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;
    this.init();
  }

  private init() {
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

    this.animate();
  }

  private animate = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Вызов рендера
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  public resize(width: number, height: number) {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Рекурсивный обход сцены и очистка ресурсов
    this.scene?.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
      
      object.geometry.dispose();

      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else {
        object.material.dispose();
      }
    });

    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}
```

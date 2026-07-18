# Video & Core Interaction Service: Design Document

Этот сервис управляет воспроизведением интерактивного видео (силуэта человека) и параллакс-эффектами. Видео огибается точками фона и реагирует на движения пользователя.

---

## 1. Архитектура и структура взаимодействия

Сервис `VideoInteractionService` работает напрямую с HTML5 Video элементом и его контейнером.

### Спецификация класса `VideoInteractionService`

```typescript
import { gsap } from 'gsap';

export class VideoInteractionService {
  private video: HTMLVideoElement;
  private container: HTMLElement;
  
  // Состояние сглаживания GSAP
  private playheadState = { currentTime: 0 };
  private parallaxState = { x: 0, y: 0 };
  
  // Константы
  private PARALLAX_STRENGTH = 24;
  private throttleMs = 33; // ~30fps для скруббинга видео для снижения нагрузки

  constructor(video: HTMLVideoElement, container: HTMLElement) {
    this.video = video;
    this.container = container;
    this.init();
  }

  private init(): void;
  public updatePointer(clientX: number, clientY: number): void;
  public updateScrollProgress(progress: number): void;
  public destroy(): void;
}
```

---

## 2. Логика скруббинга и параллакса

### Скруббинг (Интерактивное прокручивание)
На главном экране (Intro) воспроизведение видео привязано к горизонтальной координате курсора мыши:
*   При движении мыши слева направо (`clientX / window.innerWidth`) рассчитывается нормализованный прогресс от 0 до 1.
*   Данный прогресс проецируется на длительность видео (`progress * video.duration`).
*   GSAP сглаживает переход текущего времени воспроизведения для плавности смены кадров:
    ```typescript
    gsap.to(this.playheadState, {
      currentTime: targetTime,
      duration: 0.6,
      ease: 'power1.out',
      overwrite: 'auto',
      onUpdate: () => {
        this.video.currentTime = this.playheadState.currentTime;
      }
    });
    ```

### Параллакс-эффект
Для придания сцене ощущения глубины контейнер видео слегка смещается в противоположную сторону от движения курсора мыши:
```typescript
const offsetX = (clientX / window.innerWidth - 0.5) * this.PARALLAX_STRENGTH;
const offsetY = (clientY / window.innerHeight - 0.5) * this.PARALLAX_STRENGTH;

gsap.to(this.container, {
  x: offsetX,
  y: offsetY,
  duration: 1.2,
  ease: 'power2.out',
  overwrite: 'auto',
});
```

---

## 3. Интеграция с фоном (Маскирование)

Для достижения эффекта прохождения силуэта поверх фона мы используем свойство смешивания слоев:
*   **Условие**: Видео должно быть записано на чисто белом фоне (`#ffffff`), а силуэт человека должен быть темным.
*   **Стиль контейнера**: `mix-blend-mode: multiply` в сочетании с фоном страницы `background-color: white`.
*   **Результат**: Белый цвет видео полностью исчезает, делая фон видимым, а темный силуэт сохраняется, перекрывая точки Three.js сцены.

---

## 4. Оптимизация видео-скруббинга

Скруббинг видео (`video.currentTime = target`) — ресурсоемкая операция для браузера, так как декодер должен перерисовать ключевой кадр.
1.  **Сжатие видео**: Видео должно быть закодировано с высокой частотой ключевых кадров (keyframe-interval / gop-size не более 5-10 кадров).
2.  **Троттлинг апдейтов**: Смена `video.currentTime` должна происходить не чаще 30 раз в секунду, даже если мышь движется с частотой 144 Гц. Для этого используется сравнение по времени:
    ```typescript
    const now = performance.now();
    if (now - lastSeekTime > throttleMs) {
       video.currentTime = target;
       lastSeekTime = now;
    }
    ```
3.  **Атрибуты**: Видео должно быть объявлено с атрибутами `preload="auto"`, `muted`, `playsInline` для исключения блокировок автоплея и оптимизации буферизации.

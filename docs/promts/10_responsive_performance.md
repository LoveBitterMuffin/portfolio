# Промт 10: Адаптивность и Performance-оптимизация

## Задача
Привести верстку портфолио к полной адаптивности на всех целевых брейкпоинтах (375px–1440px+), реализовать ленивую загрузку тяжелых модулей и выполнить проверку производительности по всем метрикам из [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Раздел 10).

## Контекст и файлы
*   **Performance-требования**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Разделы 10 и 12)
*   **Сборочная конфигурация**: [SPECIFICATION.md](file:///c:/mp/portfolio/docs/SPECIFICATION.md) (Раздел 5)
*   **Файлы конфигурации проекта**:
    *   [next.config.ts](file:///c:/mp/portfolio/next.config.ts)
    *   [tsconfig.json](file:///c:/mp/portfolio/tsconfig.json)

## Инструкции по реализации

### 1. Адаптивная верстка (Responsive Layout)

Проверьте и адаптируйте все секции для следующих брейкпоинтов:

| Брейкпоинт | Ширина | Ключевые изменения |
|---|---|---|
| Mobile S | 375px | Hero name: `clamp(3rem, 8vw, 5rem)`, панели вертикально |
| Tablet | 768px | Переключение с вертикального на горизонтальный скролл |
| Laptop | 1024px | Полный горизонтальный трек, видео `w-[38vw]` |
| Desktop | 1440px+ | Максимальная типографическая шкала, широкие отступы |

**Правила адаптивности**:
*   **Горизонтальный трек**: На мобильных (<768px) рассмотрите возможность вертикального стека секций вместо горизонтального скролла (для usability). ScrollInterfaceService должен `destroy()` и не инициализироваться на мобайл, если принято такое решение.
*   **Hero Name** (`ДМИТРИЙ ВОЛКОВ`): Используйте `clamp(3rem, 8vw, 10rem)` вместо фиксированного `--text-hero`.
*   **Видео-контейнер**: `width: 75vw` на мобайл → `width: 38vw` на `md:` (≥768px).
*   **Отступы панелей**: `padding: var(--space-8)` на мобайл → `padding: var(--space-12)` на десктоп.
*   **Навигация**: На мобайл хедер скрывает nav-links, показывает иконку-гамбургер (опционально).

### 2. Lazy Loading тяжелых модулей (Code Splitting)

Инициализация Three.js, GSAP и сервисов должна происходить только на клиенте:

```typescript
// src/app/page.tsx
'use client';

// Динамический импорт сервисов только в браузере
useEffect(() => {
  // Все тяжелые импорты внутри useEffect — не блокируют SSR
  const { BackgroundGraphicsService } = await import('@/services/BackgroundGraphicsService');
  const { VideoInteractionService }   = await import('@/services/VideoInteractionService');
  const { ScrollInterfaceService }    = await import('@/services/ScrollInterfaceService');
  
  // инициализация...
}, []);
```

Альтернативно — использовать `next/dynamic` с `{ ssr: false }` для компонентов-обёрток Three.js.

### 3. Оптимизация частиц и GPU

*   **Функция определения мощности устройства** (`src/utils/detectLowEndDevice.ts`):
```typescript
export function detectLowEndDevice(): boolean {
  // Мобильное устройство
  if (/Mobi|Android/i.test(navigator.userAgent)) return true;
  // Ограниченная память
  if ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4) return true;
  // Медленное соединение
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn?.effectiveType === '2g' || conn?.saveData) return true;
  }
  return false;
}
```
*   В `BackgroundGraphicsService`: `const count = detectLowEndDevice() ? 300 : 1000`.
*   Ограничить `devicePixelRatio`: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
*   `will-change: transform` — **только** на `#horizontal-track` и видео-контейнере. Не применять глобально.

### 4. Оптимизация событий мыши (Event Throttling)

В оркестраторе `page.tsx` дросселируйте обработчик `pointermove` чтобы не перегружать RAF:
```typescript
let lastPointerUpdateTime = 0;
const POINTER_THROTTLE_MS = 16; // ~60fps

const handlePointerMove = (e: PointerEvent) => {
  const now = performance.now();
  if (now - lastPointerUpdateTime < POINTER_THROTTLE_MS) return;
  lastPointerUpdateTime = now;
  bgServiceRef.current?.updatePointer(e.clientX, e.clientY);
  videoServiceRef.current?.updatePointer(e.clientX, e.clientY);
};
```

### 5. ResizeObserver (без Layout Thrashing)

```typescript
const resizeObserver = new ResizeObserver((entries) => {
  const { width, height } = entries[0].contentRect;
  bgServiceRef.current?.resize(width, height);
});
resizeObserver.observe(document.documentElement);

// В cleanup:
resizeObserver.disconnect();
```

*   **Запрещено**: Читать `getBoundingClientRect()`, `offsetWidth`, `scrollTop` внутри RAF-callback.

### 6. Видимость вкладки (Visibility API)

Убедитесь, что в `BackgroundGraphicsService` реализован слушатель:
```typescript
private handleVisibilityChange = () => {
  if (document.hidden) this.stopLoop();
  else this.startLoop();
};

constructor(...) {
  document.addEventListener('visibilitychange', this.handleVisibilityChange);
}

destroy() {
  document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  // ...остальная очистка
}
```

### 7. Производительность шрифтов

В `globals.css` добавьте `font-display: swap` для предотвращения FOIT (Flash Of Invisible Text):
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap');
```
Параметр `display=swap` уже включён в URL Google Fonts.

В `next.config.ts` убедитесь, что `optimizeFonts: true` (включён по умолчанию в Next.js 14+).

## Критерии приемки
1. Проект проходит Lighthouse-аудит с Performance ≥ 80 на мобайл, ≥ 90 на десктоп.
2. Верстка корректно отображается на 375px, 768px, 1024px и 1440px без горизонтального переполнения.
3. Three.js Canvas не инициализируется на сервере (нет SSR-ошибок в логах).
4. `devicePixelRatio` ограничен до `2`, `particlesCount` = 300 на слабых устройствах.
5. При переключении вкладки RAF останавливается (проверяется по останову счётчика FPS в DevTools → Performance).
6. Нет читающих DOM-запросов (`getBoundingClientRect`, `offsetWidth`) внутри RAF-loop (проверяется в DevTools → Performance → Layout).

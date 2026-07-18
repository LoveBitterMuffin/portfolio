# Scroll & Interface Service: Agent Rules & Guidelines

Этот файл содержит правила для ИИ-агентов по разработке горизонтального скролла и интерфейсных компонентов.

---

## 1. Критические требования к скроллу

> [!IMPORTANT]
> **Никогда** не перехватывайте колесо мыши (`wheel` / `mousewheel`) напрямую для ручного смещения панелей. Это ломает нативное поведение тачпадов на ноутбуках (macOS/Windows Precision) и ухудшает доступность (accessibility). Горизонтальный скролл должен работать строго через связку вертикального скролла страницы и плагина **GSAP ScrollTrigger** с параметром `pin: true`.

> [!WARNING]
> Для горизонтального контейнера (`horizontal-track`) обязательно задайте CSS-свойство `will-change: transform`. Это заставит браузер вынести сдвиг панелей на композитный GPU-слой, предотвращая дергание и задержки контента во время быстрой прокрутки.

---

## 2. Оптимизация верстки и производительности

*   **Изоляция верстки панелей**: Каждая секция (`.panel`) должна иметь фиксированную ширину `w-screen` и высоту `h-screen`, а также `flex-shrink: 0` (класс `flex-none` в Tailwind), чтобы лента не сжимала панели.
*   **Сброс ScrollTrigger**: При любых изменениях высоты/размеров страницы или при изменении контента в `content.md` вызывайте `ScrollTrigger.refresh()`, чтобы пересчитать высоту прокрутки и точки останова.
*   **Предотвращение мерцания (Flash of Unstyled Content)**: Применяйте стили для сокрытия контента или фиксирования начального состояния до полной загрузки GSAP скриптов, чтобы избежать прыжков разметки при инициализации.

---

## 3. Рекомендуемый шаблон интеграции ScrollTrigger в React

Используйте хук `useGSAP` для инициализации скролла. Коллбэк обновления прогресса скролла отправляет данные наверх, где оркестратор перенаправляет их в Three.js:

```typescript
"use client";

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ScrollLayoutProps {
  onScrollUpdate: (sectionIndex: number, progress: number) => void;
  children: React.ReactNode;
}

export default function ScrollLayout({ onScrollUpdate, children }: ScrollLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const panels = gsap.utils.toArray<HTMLElement>('.scroll-panel');
    const totalPanels = panels.length;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${window.innerHeight * (totalPanels - 1)}`,
        pin: true,
        scrub: 1, // Сглаживание прокрутки на 1 сек
        invalidateOnRefresh: true, // Пересчет при ресайзе
        onUpdate: (self) => {
          const globalProgress = self.progress;
          const activeIndex = Math.min(
            Math.floor(globalProgress * totalPanels),
            totalPanels - 1
          );
          const localProgress = (globalProgress * totalPanels) % 1;

          onScrollUpdate(activeIndex, localProgress);
        }
      }
    });

    // Анимация горизонтального движения
    tl.to(track, {
      xPercent: -100 * (totalPanels - 1),
      ease: "none"
    });

    return () => {
      // useGSAP делает автоочистку таймлайнов, созданных внутри него,
      // но явное удаление ScrollTrigger инстансов гарантирует отсутствие утечек
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full overflow-visible">
      <div className="sticky top-0 left-0 w-screen h-screen overflow-hidden bg-white">
        <div ref={trackRef} className="flex h-full w-[500vw] will-change-transform">
          {children}
        </div>
      </div>
    </div>
  );
}
```

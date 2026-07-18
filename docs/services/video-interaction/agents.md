# Video & Core Interaction Service: Agent Rules & Guidelines

Этот файл содержит правила для ИИ-агентов по разработке и доработке компонента интерактивного видео.

---

## 1. Ограничения разметки и интерактивности

> [!IMPORTANT]
> Контейнер видео **обязан** иметь CSS-класс `pointer-events-none`. Пользователь должен иметь возможность кликать сквозь видео на фоновую Three.js-сцену (чтобы точки взрывались от кликов) и на элементы интерфейса.

> [!WARNING]
> Для правильного смешивания силуэта видео с белым фоном всегда добавляйте к контейнеру стиль `mix-blend-mode: multiply` (или класс Tailwind `mix-blend-multiply`). Белый фон видео-исходника должен быть идеально белым (`#ffffff`), без серого шума или сжатия цвета, иначе на экране будут видны грязные границы контейнера.

---

## 2. Оптимизация скруббинга (Seek Performance)

Попытка установить `video.currentTime` на каждый чих мыши приведет к зависанию браузера.
*   **Используйте сглаживание через GSAP**: Анимируйте промежуточный объект `{ currentTime: 0 }` и обновляйте реальное видео в коллбэке `onUpdate` с шагом троттлинга.
*   **Не перегружайте декодер**: Следите, чтобы разница между текущим кадром видео и целевым кадром была больше минимального порога (`> 0.01с`), прежде чем делать физический seek.

---

## 3. Рекомендуемый шаблон интеграции в React

При написании React-компонента используйте хук `useGSAP` для автоматического уничтожения анимаций при размонтировании:

```typescript
"use client";

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function InteractiveVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useGSAP(() => {
    const video = videoRef.current;
    const wrap = videoWrapRef.current;
    if (!video || !wrap) return;

    const playhead = { time: 0 };
    let lastSeek = 0;
    const throttle = 33; // ~30 fps limit

    const onPointerMove = (e: MouseEvent) => {
      if (!video.duration) return;
      
      const progress = e.clientX / window.innerWidth;
      const targetTime = progress * video.duration;

      // Плавный скруббинг
      gsap.to(playhead, {
        time: targetTime,
        duration: 0.6,
        ease: 'power1.out',
        overwrite: 'auto',
        onUpdate: () => {
          const now = performance.now();
          if (now - lastSeek > throttle && Math.abs(video.currentTime - playhead.time) > 0.01) {
            video.currentTime = playhead.time;
            lastSeek = now;
          }
        }
      });

      // Параллакс
      const dx = (e.clientX / window.innerWidth - 0.5) * 20;
      const dy = (e.clientY / window.innerHeight - 0.5) * 20;
      
      gsap.to(wrap, {
        x: dx,
        y: dy,
        duration: 1,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    window.addEventListener('mousemove', onPointerMove);
    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      gsap.killTweensOf(playhead);
      gsap.killTweensOf(wrap);
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div ref={videoWrapRef} className="absolute pointer-events-none mix-blend-multiply">
        <video 
          ref={videoRef} 
          src="/lbm.mp4" 
          muted 
          playsInline 
          preload="auto" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
```

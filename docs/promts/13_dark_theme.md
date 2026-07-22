# Промт 13: Тёмная тема и переключатель тем

## Задача
Реализовать систему тёмной темы с переключателем в header, поддержкой двух видео-ассетов для разных тем и сохранением предпочтений пользователя.

## Контекст и файлы
*   **Спецификация дизайна**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) — раздел 2 (цветовая палитра), раздел 6.3 (VideoInteractionService), раздел 8.1 (Header)
*   **Текущая реализация видео**: [MouseFollowVideo.tsx](file:///c:/mp/portfolio/src/components/MouseFollowVideo.tsx)
*   **Текущий сервис видео**: [VideoInteractionService.ts](file:///c:/mp/portfolio/src/services/VideoInteractionService.ts)

## Инструкции по реализации

### 1. CSS-токены для тёмной темы
Добавьте в глобальный CSS файл (например, `src/app/globals.css` или `src/styles/globals.css`) токены для тёмной темы:

```css
:root {
  /* Light theme токены (уже существуют) */
  --color-background: #FAFAFA;
  --color-foreground: #09090B;
  --color-primary: #18181B;
  --color-on-primary: #FFFFFF;
  --color-secondary: #3F3F46;
  --color-muted: #E8ECF0;
  --color-border: #E4E4E7;
  --color-accent: #2563EB;
  --color-accent-hover: #1D4ED8;
  --color-particle: #DCDCDC;
  --color-grid-line: rgba(0, 0, 0, 0.04);
  --color-destructive: #DC2626;
  --color-ring: #18181B;
}

:root.dark {
  /* Dark theme токены */
  --color-background: #09090B;
  --color-foreground: #FAFAFA;
  --color-primary: #FAFAFA;
  --color-on-primary: #09090B;
  --color-secondary: #A1A1AA;
  --color-muted: #27272A;
  --color-border: #27272A;
  --color-accent: #3B82F6;
  --color-accent-hover: #60A5FA;
  --color-particle: #52525B;
  --color-grid-line: rgba(255, 255, 255, 0.04);
  --color-destructive: #EF4444;
  --color-ring: #FAFAFA;
}
```

### 2. ThemeProvider и хук useTheme
Создайте файл `src/contexts/ThemeContext.tsx`:

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Чтение из localStorage или system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    // Применение класса к html
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!mounted) {
    return null; // Предотвращение hydration mismatch
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

Оберните приложение в `src/app/layout.tsx`:

```typescript
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 3. Переключатель тем в Header
Добавьте компонент переключателя тем в `src/components/Header.tsx` (или создайте):

```typescript
"use client";

import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        // Moon icon (Lucide)
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      ) : (
        // Sun icon (Lucide)
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/>
          <path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/>
          <path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/>
          <path d="m19.07 4.93-1.41 1.41"/>
        </svg>
      )}
    </button>
  );
}
```

Интегрируйте в Header компонент с обновлённым фоном:

```typescript
className="fixed top-0 z-50 w-full h-[60px] flex justify-between items-center px-12 backdrop-blur(12px) border-b 0.5px solid var(--color-border)"
style={{ backgroundColor: theme === 'light' ? 'rgba(250, 250, 250, 0.85)' : 'rgba(9, 9, 11, 0.85)' }}
```

### 4. Обновление VideoInteractionService для двух ассетов
Модифицируйте `src/services/VideoInteractionService.ts`:

```typescript
export class VideoInteractionService {
  private video: HTMLVideoElement;
  private container: HTMLElement;
  private onLowFpsFallback?: () => void;
  
  // Добавьте метод для смены видео-источника
  public updateVideoSource(theme: 'light' | 'dark'): void {
    const currentTime = this.video.currentTime;
    const wasPlaying = !this.video.paused;
    
    this.video.src = theme === 'light' ? '/lbm.mp4' : '/lbm_dark.mp4';
    this.video.load();
    
    // Восстановление позиции после загрузки
    this.video.currentTime = currentTime;
    if (wasPlaying) {
      this.video.play().catch(() => {});
    }
  }
  
  // ... остальной код без изменений
}
```

### 5. Обновление MouseFollowVideo для темы
Модифицируйте `src/components/MouseFollowVideo.tsx`:

```typescript
"use client";

import { useRef, useState, useEffect } from 'react';
import DotGrid from './ui/DotGrid/DotGrid';
import { VideoInteractionService } from '../services/VideoInteractionService';
import { useTheme } from '../contexts/ThemeContext';

export default function MouseFollowVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<VideoInteractionService | null>(null);
  
  const [useFallback, setUseFallback] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const video = videoRef.current;
    const videoWrap = videoWrapRef.current;
    if (!video || !videoWrap) return;

    const service = new VideoInteractionService(video, videoWrap, () => {
      setUseFallback(true);
    });
    serviceRef.current = service;

    const handlePointer = (clientX: number, clientY: number) => {
      service.updatePointer(clientX, clientY);
    };

    const handleMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handlePointer(t.clientX, t.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      service.destroy();
    };
  }, []);

  // Обновление видео при смене темы
  useEffect(() => {
    if (serviceRef.current) {
      serviceRef.current.updateVideoSource(theme);
    }
  }, [theme]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* DotGrid background layer */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={4}
          gap={8}
          baseColor="var(--color-background)"
          activeColor="var(--color-secondary)"
          proximity={70}
          speedTrigger={100}
          shockRadius={80}
          shockStrength={5}
          maxSpeed={5000}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* Video on top — mix-blend-mode зависит от темы */}
      <div 
        ref={videoWrapRef} 
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[75vw] md:w-[38vw] z-10 overflow-visible pointer-events-none" 
        style={{ mixBlendMode: theme === 'light' ? 'multiply' : 'screen' }}
      >
        {useFallback ? (
          <img 
            src={theme === 'light' ? '/lbm_fallback.png' : '/lbm_dark_fallback.png'} 
            alt="Silhouette Fallback" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <video
            ref={videoRef}
            src={theme === 'light' ? '/lbm.mp4' : '/lbm_dark.mp4'}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
          />
        )}
      </div>

    </div>
  );
}
```

### 6. Обновление DotGrid для темы
Модифицируйте `src/components/ui/DotGrid/DotGrid.tsx` для поддержки CSS-переменных:

```typescript
// Замените хардкоды на CSS-переменные
baseColor={baseColor || 'var(--color-background)'}
activeColor={activeColor || 'var(--color-secondary)'}
```

### 7. Обновление BackgroundGraphicsService для темы
В `src/services/BackgroundGraphicsService.ts` добавьте метод для обновления цвета частиц:

```typescript
public updateParticleColor(theme: 'light' | 'dark'): void {
  const color = theme === 'light' ? 0xDCDCDC : 0x52525B;
  this.material.uniforms.uColor.value.setHex(color);
}
```

Вызывайте этот метод при смене темы в компоненте-оркестраторе.

## Требования к видео-ассетам
Для тёмной темы необходим новый видео-файл:
- **Путь**: `/public/lbm_dark.mp4`
- **Фон**: Чёрный (`#000000`)
- **Силуэт**: Тот же, что в `lbm.mp4`
- **Формат**: MP4, те же параметры кодирования что и оригинал

Опционально: создайте fallback-изображение `/public/lbm_dark_fallback.png` для тёмной темы.

## Критерии приемки
1. Переключатель тем в header работает корректно, иконки sun/moon меняются
2. При переключении темы все CSS-токены обновляются (фон, текст, границы, частицы)
3. В светлой теме используется `lbm.mp4` с `mix-blend-mode: multiply`
4. В тёмной теме используется `lbm_dark.mp4` с `mix-blend-mode: screen`
5. Видео перезагружается при смене темы без потери позиции воспроизведения
6. Предпочтение темы сохраняется в localStorage и восстанавливается при перезагрузке
7. При первой загрузке используется системное предпочтение (prefers-color-scheme)
8. Нет hydration mismatch при серверном рендеринге
9. Three.js частицы обновляют цвет при смене темы
10. DotGrid использует CSS-переменные для цветов

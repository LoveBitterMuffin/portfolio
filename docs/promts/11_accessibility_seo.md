# Промт 11: Доступность, SEO и Reduced Motion

## Задача
Привести портфолио к соответствию WCAG AA, реализовать полную поддержку `prefers-reduced-motion`, добавить атрибуты доступности к интерактивным элементам и настроить SEO-метаданные через Next.js Metadata API.

## Контекст и файлы
*   **Требования доступности**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Разделы 7.4 и 11)
*   **Чеклист приемки**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Раздел 12)
*   **Метаданные и SEO**: [CONTENT.md](file:///c:/mp/portfolio/docs/CONTENT.md)
*   **Layout**: [src/app/layout.tsx](file:///c:/mp/portfolio/src/app/layout.tsx)

## Инструкции по реализации

### 1. SEO и метаданные (`src/app/layout.tsx`)

Используйте Next.js Metadata API для настройки SEO:
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Дмитрий Волков — Full-Stack Developer & DevSecOps Engineer',
  description: 'Интерактивное портфолио: архитектура безопасности, эстетика кода, педагогика будущего. Разработка на Next.js, Three.js, GSAP.',
  keywords: ['Full-Stack Developer', 'DevSecOps', 'React', 'Next.js', 'Three.js', 'GSAP', 'портфолио'],
  authors: [{ name: 'Dmitry Volkov', url: 'https://github.com/LoveBitterMuffin' }],
  openGraph: {
    title: 'Дмитрий Волков — Full-Stack Developer & DevSecOps',
    description: 'Архитектура безопасности. Эстетика кода. Педагогика будущего.',
    type: 'website',
    locale: 'ru_RU',
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### 2. Семантическая разметка HTML

Убедитесь, что следующие семантические элементы использованы корректно:

*   **Один `<h1>` на страницу** — имя `ДМИТРИЙ ВОЛКОВ` в Intro-секции.
*   **Заголовки секций** — `<h2>` для каждой секции (`ОБРАЗОВАНИЕ`, `ОПЫТ` и т.д.).
*   **Навигация** — `<nav aria-label="Основная навигация">` в Header.
*   **Three.js Canvas** — `<canvas role="presentation" aria-hidden="true">` (декоративный элемент, скрыт от скринридеров).
*   **Видео-контейнер** — `aria-hidden="true"` на декоративном видео-силуэте.
*   **Иконки соцсетей** — `<a href="..." aria-label="Перейти в GitHub">`, иконка `aria-hidden="true"`.
*   **Форма контактов** — явные `<label for="...">` для всех полей ввода.
*   **Кнопка CTA** — содержательный текст (не `"Click here"`).

Пример для соцсетей:
```tsx
<a
  href={link.href}
  aria-label={`Перейти в ${link.label}`}
  target="_blank"
  rel="noopener noreferrer"
>
  <Icon name={link.icon} aria-hidden="true" size={20} />
</a>
```

### 3. Keyboard Navigation

*   Проверьте, что `Tab`-порядок следует визуальному порядку секций: Header → Intro CTA → Education → Experience → About → Contacts.
*   На горизонтальном скролл-треке добавьте `tabIndex={0}` на `<main>` и реализуйте навигацию клавишами стрелок через `onKeyDown`:
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowRight') scrollService.scrollToSection(activeSection + 1);
  if (e.key === 'ArrowLeft')  scrollService.scrollToSection(activeSection - 1);
};
```
*   Все интерактивные элементы (кнопки, ссылки, поля форм) — минимум `44×44px` по размеру touch-зоны.
*   `focus-visible` стиль: `outline: 2px solid var(--color-ring); outline-offset: 2px` — применён ко всем фокусируемым элементам.

### 4. Контрастность цветов (WCAG AA)

Проверьте контрастные пары:

| Текст | Фон | Соотношение | Статус |
|---|---|---|---|
| `#09090B` основной текст | `#FAFAFA` фон | 19.6:1 | ✅ AAA |
| `#3F3F46` вторичный текст | `#FAFAFA` фон | 7.0:1 | ✅ AA |
| `#2563EB` ссылки/CTA | `#FAFAFA` фон | 4.7:1 | ✅ AA |
| `#18181B` заголовки | `#FAFAFA` фон | 18.1:1 | ✅ AAA |

*   Используйте инструмент **axe DevTools** или **Lighthouse** для автоматической проверки.

### 5. Полная реализация `prefers-reduced-motion`

#### CSS-слой (`globals.css`)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### JS-слой — утилита (`src/utils/prefersReducedMotion.ts`)
```typescript
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Реактивная подписка (для изменения настроек на лету)
export function watchReducedMotion(callback: (reduced: boolean) => void): () => void {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
```

#### Применение по компонентам

| Компонент | Поведение при reduced motion |
|---|---|
| `BackgroundGraphicsService` | RAF не запускается; рендерится один статичный кадр |
| Морфинг частиц (L5) | `duration: prefersReducedMotion() ? 0 : 1.5` |
| Entrance-анимации текста (L3) | Пропускаются (`gsap.set()` вместо `gsap.from()`) |
| Параллакс видео (L2) | `PARALLAX_STRENGTH = 0` |
| Скруббинг видео (L2) | Остаётся активным (прямое действие пользователя) |
| Scroll-driven трек (L1) | Остаётся (реагирует только на скролл) |

В оркестраторе `page.tsx` при монтировании:
```typescript
const reduced = prefersReducedMotion();

// Передать в сервис
bgService.setReducedMotion(reduced);

// Подписаться на изменения (пользователь может менять системные настройки)
const unwatch = watchReducedMotion((isReduced) => {
  bgService.setReducedMotion(isReduced);
});
// В cleanup: unwatch();
```

### 6. ARIA-роли для Three.js сцены

Добавьте описание Three.js-сцены для скринридеров через `aria-describedby`:
```tsx
<div
  id="canvas-container"
  role="presentation"
  aria-hidden="true"
  style={{ position: 'fixed', inset: 0, zIndex: 0 }}
>
  <canvas ref={canvasRef} />
</div>
```

### 7. Описание пропуска навигации (Skip Link)

Добавьте skip-ссылку в начало `layout.tsx` для клавиатурных пользователей:
```tsx
<a
  href="#main-content"
  className="skip-link"
  style={{
    position: 'absolute',
    top: '-40px',
    left: 0,
    padding: '8px',
    background: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    zIndex: 100,
    transition: 'top 0.2s',
  }}
  onFocus={(e) => (e.currentTarget.style.top = '0')}
  onBlur={(e) => (e.currentTarget.style.top = '-40px')}
>
  Перейти к основному содержимому
</a>
<main id="main-content">...</main>
```

## Критерии приемки
1. Lighthouse Accessibility Score ≥ 95.
2. Нет ни одной ошибки в axe DevTools при проверке главной страницы.
3. Tab-навигация охватывает все интерактивные элементы в логичном порядке.
4. При активации `prefers-reduced-motion` в ОС: Three.js RAF останавливается, морфинг мгновенный, параллакс отключается.
5. Все иконки соцсетей имеют `aria-label`, канвас скрыт от скринридеров (`aria-hidden`).
6. Skip-ссылка появляется при фокусировке через Tab и корректно переводит фокус к `#main-content`.

# Промт 8: UI-компоненты (Header, Индикатор прогресса, CTA, Timeline, Skill-теги)

## Задача
Реализовать набор переиспользуемых UI-компонентов портфолио: фиксированный хедер с навигацией, нижний индикатор прогресса скролла, кнопку CTA, элементы таймлайна и skill-теги — строго в соответствии с дизайн-системой из [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md).

## Контекст и файлы
*   **Спецификация компонентов**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Раздел 8)
*   **Цвета и типографика**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Разделы 2 и 3)
*   **CSS-переменные**: [globals.css](file:///c:/mp/portfolio/src/app/globals.css)
*   **Оркестратор**: [page.tsx](file:///c:/mp/portfolio/src/app/page.tsx)

## Инструкции по реализации

### 1. Компонент `Header` (`src/components/ui/Header/Header.tsx`)
*   **Позиция**: `position: fixed; top: 0; z-index: 50`.
*   **Фон**: `rgba(250, 250, 250, 0.85)` с `backdrop-filter: blur(12px)` для glassmorphism-эффекта.
*   **Граница**: `border-bottom: 0.5px solid var(--color-border)`.
*   **Высота**: `60px`; внутри — `display: flex; justify-content: space-between; align-items: center; padding: 0 var(--space-12)`.
*   **Логотип**: текст `DV.SYS`, шрифт `var(--font-mono)`, размер `var(--text-xs)`, `letter-spacing: 0.15em`, `text-transform: uppercase`.
*   **Навигационные ссылки**: `font-family: var(--font-display); font-size: var(--text-sm); font-weight: 500; letter-spacing: 0.05em`.
    *   Имена ссылок: `INTRO`, `EDUCATION`, `EXPERIENCE`, `ABOUT`, `CONTACTS`.
    *   **Hover**: `color: var(--color-accent)`, переход `transition: color 200ms ease`.
    *   **Active (текущая секция)**: `border-bottom: 1px solid var(--color-accent)`.
    *   При клике — вызывайте `scrollService.scrollToSection(index)` через `ref` оркестратора.
*   Принимает `prop`: `activeSectionIndex: number` — для выделения активной ссылки.

### 2. Компонент `ScrollProgressIndicator` (`src/components/ui/ScrollProgressIndicator/ScrollProgressIndicator.tsx`)
*   **Позиция**: `position: fixed; bottom: 0; left: 0; right: 0; z-index: 50`.
*   **Прогресс-линия (горизонтальная)**:
    *   Высота `1px`, фон `var(--color-border)`.
    *   Внутренний элемент `::after` или дочерний `div`: фон `var(--color-primary)`, ширина `{progress * 100}%`, `transition: width 0.1s linear`.
*   **Лейбл секции** (правый нижний угол):
    *   Формат: `[STEP.0{n}/05]` — где `n` — индекс текущей секции + 1.
    *   Шрифт: `var(--font-mono)`, размер `var(--text-xs)`, цвет `var(--color-secondary)`.
    *   Отступы: `padding: 12px 16px`.
*   Принимает `props`: `progress: number` (0–1), `activeSection: number` (0–4).

### 3. Компонент `CtaButton` (`src/components/ui/CtaButton/CtaButton.tsx`)
*   Стиль: outlined — `border: 1px solid var(--color-primary)`.
*   Шрифт: `var(--font-display) text-sm font-500; letter-spacing: 0.08em; text-transform: uppercase`.
*   `padding: 12px 32px`.
*   **Hover**: `background-color: var(--color-primary); color: var(--color-on-primary); transition: all 250ms ease-out`.
*   **Focus-visible**: `outline: 2px solid var(--color-ring); outline-offset: 2px`.
*   Принимает `prop`: `children: ReactNode`, `onClick?: () => void`.

### 4. Компонент `TimelineItem` (`src/components/ui/TimelineItem/TimelineItem.tsx`)
*   **Layout**: `display: grid; grid-template-columns: auto 1fr; gap: 0 var(--space-8)`.
*   **Маркер**: `width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); margin-top: 6px`.
    *   Снизу от маркера — вертикальная линия: `border-left: 1px dashed var(--color-border); height: calc(100% - 14px); margin-left: 3.5px`.
*   **Контент колонка**:
    *   `period` (дата): `font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-secondary)`.
    *   `role` (должность): `font-family: var(--font-display); font-size: var(--text-body); font-weight: 600`.
    *   `place` (место): `font-family: var(--font-display); font-size: var(--text-sm); font-weight: 400; color: var(--color-secondary)`.
    *   `details` (список): `font-family: var(--font-body); font-size: var(--text-sm); color: var(--color-foreground)`.
*   Принимает `props`: `period: string`, `role: string`, `place: string`, `details?: string[]`.

### 5. Компонент `SkillTag` (`src/components/ui/SkillTag/SkillTag.tsx`)
*   Стиль: `display: inline-flex; border: 0.5px solid var(--color-border)`.
*   Шрифт: `font-family: var(--font-mono); font-size: var(--text-xs)`.
*   `padding: 4px 10px; background: transparent`.
*   **Hover**: `border-color: var(--color-accent); transition: border-color 150ms ease`.
*   Принимает `prop`: `children: ReactNode`.

### 6. Анимация появления компонентов (Entrance Animations)
Для секций `Education`, `Experience`, `About`, `Contacts` добавьте GSAP-анимацию появления элементов при входе в видимость:
```typescript
// В useEffect оркестратора, или через атрибут data-animate на компонентах
gsap.from(el.children, {
  opacity: 0,
  y: 24,
  duration: 0.5,
  stagger: 0.08,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: el,
    start: 'left 85%',
    horizontal: true, // для горизонтального скролла
    containerAnimation: horizontalTrackAnimation, // ссылка на ScrollTrigger трека
  }
});
```
*   В режиме `prefers-reduced-motion: reduce` — пропускайте анимацию (`duration: 0` или полный пропуск `gsap.from`).

## Критерии приемки
1. Header фиксирован в верхней части, glassmorphism-фон корректно перекрывает Three.js-фон и контент.
2. Ссылка активной секции в навигации выделяется при скролле.
3. Нижний индикатор прогресса обновляется в реальном времени синхронно со скроллом.
4. CTA-кнопка имеет корректный hover и focus-visible стиль (2px outline).
5. Компоненты `TimelineItem` и `SkillTag` визуально соответствуют дизайну из DESIGN.md.
6. Элементы секций появляются с stagger-анимацией при горизонтальном входе в viewport.
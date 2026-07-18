# Промт 1: Стилизация, шрифты и CSS-переменные (Дизайн-система)

## Задача
Настроить глобальную дизайн-систему проекта в файле `src/app/globals.css` в соответствии со спецификацией из [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md).

## Контекст и файлы
*   **Дизайн-система**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Разделы 2, 3 и 4)
*   **Глобальный CSS**: [globals.css](file:///c:/mp/portfolio/src/app/globals.css)

## Инструкции по реализации

### 1. Подключение шрифтов
Импортируйте шрифты Google Fonts в начале `globals.css`:
*   `Space Grotesk` (weights: 300, 400, 500, 600, 700) для заголовков и обычного текста.
*   `JetBrains Mono` (weights: 400, 500) для технических надписей, цифр и статусов.

### 2. Определение CSS-переменных (`:root`)
Задайте следующие токены дизайн-системы в селекторе `:root`:
*   **Цвета**:
    *   `--color-background`: `#FAFAFA` (стерильный белый фон страницы)
    *   `--color-foreground`: `#09090B` (основной текст)
    *   `--color-primary`: `#18181B` (заголовки)
    *   `--color-secondary`: `#3F3F46` (вторичный текст, даты)
    *   `--color-muted`: `#E8ECF0` (разделители)
    *   `--color-border`: `#E4E4E7` (тонкие линии)
    *   `--color-accent`: `#2563EB` (акцентный голубой для CTA)
    *   `--color-accent-hover`: `#1D4ED8`
    *   `--color-particle`: `#DCDCDC` (цвет частиц Three.js)
    *   `--color-grid-line`: `rgba(0, 0, 0, 0.04)` (тонкая сетка фона)
*   **Шрифтовые семейства**:
    *   `--font-display`: `'Space Grotesk', system-ui, sans-serif`
    *   `--font-body`: `'Space Grotesk', system-ui, sans-serif`
    *   `--font-mono`: `'JetBrains Mono', monospace`
*   **Типографическая шкала (с использованием clamp для отзывчивости)**:
    *   `--text-hero`: `clamp(4rem, 10vw, 10rem)`
    *   `--text-h1`: `clamp(2.5rem, 5vw, 5rem)`
    *   `--text-h2`: `clamp(1.5rem, 3vw, 2.5rem)`
    *   `--text-h3`: `clamp(1.125rem, 2vw, 1.5rem)`
    *   `--text-body`: `1rem`
    *   `--text-sm`: `0.875rem`
    *   `--text-xs`: `0.75rem`
*   **Spacing Scale (система отступов)**:
    *   Переменные `--space-1` (4px) до `--space-32` (128px), как описано в разделе 4 `DESIGN.md`.

### 3. Базовые стили (`body`)
*   Установите фон `background-color: var(--color-background)`.
*   Задайте цвет текста `color: var(--color-foreground)`.
*   Установите шрифт `font-family: var(--font-body)`.
*   Скройте дефолтный скроллбар: `overflow: hidden`.

## Критерии приемки
1. Проект собирается без ошибок CSS.
2. В браузере применяется строго белый фон `#FAFAFA` вместо темного.
3. Шрифты корректно загружаются из Google Fonts и применяются к текстовым элементам.

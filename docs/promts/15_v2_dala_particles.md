# Задача 15: Движок частиц Dala-style (Three.js)

Мы полностью отказываемся от компонента DotGrid и переводим весь сайт на `BackgroundGraphicsService`.

**Шаги выполнения:**
1. Открой `src/services/BackgroundGraphicsService.ts`.
2. Напиши логику генерации органического поля из тысяч контурных треугольников (1-2px) и рассеянной (ambient) пыли для объема, как в Dala.
3. Реализуй физическое реактивное отталкивание частиц от курсора с использованием `uPointer` (uniform).
4. Добавь метод `morphToGeometry(type)`, который плавно трансформирует текущее состояние частиц в целевые 3D-геометрии (Cube, Sphere, Torus) с использованием GSAP.
5. Обеспечь автоматическое снижение количества частиц на мобильных устройствах (используй fallback `prefers-reduced-motion`).
6. Удали файлы DotGrid (`src/components/ui/DotGrid/*`), так как они больше не нужны.
7. Удали вызовы DotGrid из `src/components/IntroPanel.tsx`.
8. Сделай коммит: `git commit -am "feat: implement Dala-style particles and morph targets"`.

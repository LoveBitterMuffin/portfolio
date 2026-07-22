# Задача 17: Горизонтальный скролл и 3D-геометрия (Сфера -> Куб -> Тор)

В разделе About используется `ScrollInterfaceService` для горизонтального скролла. Необходимо завязать GSAP ScrollTrigger на 3D-движок для морфинга геометрических фигур.

**Шаги выполнения:**
1. Открой `src/app/page.tsx` и `src/services/ScrollInterfaceService.ts`.
2. В функции `onScrollUpdate(progress)` внутри `page.tsx` добавь логику интерполяции прогресса.
3. По мере прохождения трека (0% -> 50% -> 100%) частицы Three.js должны плавно менять форму.
4. Раздели прогресс на этапы: начало (Сфера), середина (Куб), конец (Тор).
5. Вызывай соответствующие методы из `BackgroundGraphicsService` (например, `BgService.morphToGeometry('cube', localProgress)`).
6. Проверь производительность на GSAP-scrubbing.
7. Сделай коммит: `git commit -am "feat: horizontal scroll GSAP shape morphing"`.

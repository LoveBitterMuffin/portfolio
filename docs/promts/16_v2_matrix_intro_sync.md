# Задача 16: Матрица в Intro (Интерактив с видео)

Требуется интегрировать поведение 3D-частиц с направлением взгляда на видео в `IntroPanel`.

**Шаги выполнения:**
1. Открой `src/services/VideoInteractionService.ts` и `src/components/IntroPanel.tsx`.
2. Проанализируй логику параллакса и `currentTime` видео (от мыши).
3. При смещении курсора/головы влево (например, `progress < 0.3`): отправляй событие или вызывай `BgService.morphToGeometry('matrix_blue_pill')`. Синяя таблетка символизирует "Классический Web / Система".
4. При смещении вправо (например, `progress > 0.7`): вызывай `BgService.morphToGeometry('matrix_red_pill')`. Красная таблетка символизирует "Cyber DevSecOps".
5. Настрой плавную пульсацию и цвет частиц вокруг активированной таблетки.
6. Сделай коммит: `git commit -am "feat: matrix red/blue pill sync with intro video"`.

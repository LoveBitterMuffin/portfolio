# Промт 4: Базовый сервис 3D-графики (Three.js WebGL Canvas)

## Задача
Инициализировать WebGL-контекст на базе библиотеки Three.js (Vanilla TS) и создать основу класса `BackgroundGraphicsService` для управления трехмерной сценой частиц.

## Контекст и файлы
*   **Архитектурный дизайн 3D**: [design.md](file:///c:/mp/portfolio/docs/services/background-graphics/design.md) (Разделы 1 и 4)
*   **Правила разработки (Three.js)**: [agents.md](file:///c:/mp/portfolio/docs/services/background-graphics/agents.md)
*   **Главная спецификация**: [specification.md](file:///c:/mp/portfolio/docs/specification.md) (Разделы 2 и 4)

## Инструкции по реализации

### 1. Инфраструктура Canvas
Создайте выделенный HTML-контейнер и элемент `<canvas>` на заднем плане (под скролл-треком, `z-index: 0` или абсолютное позиционирование на фоне).

### 2. Реализация класса `BackgroundGraphicsService`
Создайте файл `src/services/BackgroundGraphicsService.ts` на чистом TypeScript:
*   **Инициализация Three.js**:
    *   Создайте WebGLRenderer со свойствами `canvas`, `alpha: true` (для прозрачности фона), `antialias: true`, и `powerPreference: "high-performance"`.
    *   Инициализируйте `Scene` и `PerspectiveCamera`. Установите камеру на `z = 5`.
*   **Метод `resize(width, height)`**:
    *   Обновляет соотношение сторон камеры (`camera.aspect`), матрицу проекции камеры и размеры рендерера (`renderer.setSize`).
    *   *Важно*: Метод должен вызываться извне оркестратором (через ResizeObserver), считывание размеров DOM внутри цикла `requestAnimationFrame` запрещено во избежание layout thrashing.
*   **Конвертация координат курсора мыши (World Space)**:
    *   Реализуйте метод `updatePointer(clientX, clientY)`.
    *   Считывайте NDC (Normalized Device Coordinates) курсора в диапазоне `[-1, 1]`.
    *   Используйте `THREE.Raycaster` для нахождения точки пересечения луча из камеры с плоскостью `Z = 0` (мировая XY-плоскость).
    *   Сохраняйте координаты пересечения в `targetPointer`.
*   **Цикл рендеринга (RAF)**:
    *   Реализуйте метод `animate()`, запускаемый через `requestAnimationFrame`.
    *   Внутри цикла выполняйте сглаживание координат мыши (`currentPointer += (targetPointer - currentPointer) * 0.1`) для плавного интерактивного эффекта.
    *   Вызывайте рендеринг сцены.
*   **Очистка ресурсов (`destroy`)**:
    *   Остановите цикл RAF.
    *   Освободите ресурсы GPU: вызовите `.dispose()` для всех геометрий, материалов и самого рендерера. Занулите ссылки для GC.
*   **Деградация производительности**:
    *   Определяйте тип устройства (мобильные / слабые GPU по `navigator.userAgent` или `deviceMemory < 4`).
    *   Установите лимит частиц `particlesCount = 300` для слабых устройств и `1000` для производительных десктопов.
*   **Доступность (Reduced Motion & Visibility)**:
    *   Если `prefers-reduced-motion` включен, отмените запуск бесконечного цикла RAF и отрендерите только один статичный кадр сцены (`renderStaticFrame()`).
    *   Добавьте слушатель `visibilitychange` на `document`. При переключении вкладки браузера на неактивную останавливайте RAF (`stopLoop()`), при возвращении — возобновляйте (`startLoop()`).

## Критерии приемки
1. Three.js Canvas инициализируется поверх белого фона без ошибок в консоли.
2. При изменении размеров окна размеры Canvas адаптируются без искажений пропорций.
3. Логика `destroy` очищает WebGL контекст, предотвращая утечки памяти (проверяется во вкладке Memory в DevTools).
4. На мобильных устройствах количество частиц ограничивается до 300.

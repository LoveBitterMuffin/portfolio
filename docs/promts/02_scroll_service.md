# Промт 2: Каркас скролла и ScrollInterfaceService (GSAP)

## Задача
Создать DOM-структуру горизонтального скролла в Next.js и реализовать класс `ScrollInterfaceService` на базе GSAP ScrollTrigger для преобразования вертикальной прокрутки в горизонтальное смещение трека.

## Контекст и файлы
*   **Спецификация горизонтального скролла**: [design.md](file:///c:/mp/portfolio/docs/services/scroll-interface/design.md) (Разделы 1 и 2)
*   **Главная спецификация**: [specification.md](file:///c:/mp/portfolio/docs/specification.md) (Разделы 2 и 3)
*   **Правила для агентов (Scroll)**: [agents.md](file:///c:/mp/portfolio/docs/services/scroll-interface/agents.md)

## Инструкции по реализации

### 1. Верстка каркаса скролла
Создайте DOM-структуру в React (в `src/app/page.tsx` или в отдельном клиентском компоненте):
*   Родительский контейнер `#scroll-wrapper` с высотой `h-[500vh]` (для 5 панелей).
*   Липкий контейнер `#viewport` с классами `sticky top-0 left-0 w-screen h-screen overflow-hidden`.
*   Горизонтальная лента `#horizontal-track` с классами `flex h-full w-[500vw] will-change-transform`.
*   Внутри трека разместите 5 секций (панелей) `<section class="panel w-screen h-full flex-none">` с ID: `intro`, `education`, `experience`, `about`, `contacts`.

### 2. Реализация класса `ScrollInterfaceService`
Создайте файл `src/services/ScrollInterfaceService.ts` со следующей логикой:
*   Подключите `gsap` и `ScrollTrigger`, зарегистрируйте плагин.
*   Реализуйте конструктор, принимающий `wrapper`, `track`, `panels` и коллбэк `onSectionChange(index, progress)`.
*   В методе `init()` создайте инстанс `ScrollTrigger` с параметрами:
    *   `trigger: this.wrapper`
    *   `start: "top top"`, `end: "bottom bottom"`
    *   `pin: true`, `scrub: 1`
    *   `invalidateOnRefresh: true`
    *   `animation: gsap.to(this.track, { xPercent: -100 * (panels.length - 1), ease: "none" })`
    *   `onUpdate: (self) => { ... }` — рассчитывает текущую активную секцию (индекс от 0 до 4) и относительный прогресс внутри секции (от 0 до 1), а затем вызывает коллбэк `onSectionChange`.
*   Реализуйте метод `destroy()`, который корректно уничтожает триггер и освобождает ресурсы при размонтировании React-компонента.

### 3. Доступность (Reduced Motion)
*   В соответствии с требованиями Accessibility, физический скролл горизонтального трека управляется пользователем напрямую, поэтому он должен оставаться включенным при `prefers-reduced-motion: reduce`.

## Критерии приемки
1. Вертикальный скролл страницы блокируется браузером, и страница плавно прокручивается горизонтально (сдвиг на 100vw для каждой из 5 панелей).
2. Событие обновления скролла корректно передает в консоль или оркестратор индекс текущей секции и прогресс.
3. При изменении размера окна (resize) ScrollTrigger автоматически пересчитывает координаты и размеры.
4. Размонтирование компонента корректно очищает все триггеры ScrollTrigger (метод `destroy()`).

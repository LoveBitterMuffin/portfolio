# Scroll & Interface Service: Design Document

Этот сервис отвечает за создание горизонтальной структуры скролла портфолио, управление переключением секций с помощью **GSAP ScrollTrigger** и анимацию интерфейсных элементов (меню, индикаторы прогресса).

---

## 1. Архитектура горизонтального скролла

Для реализации горизонтального скролла используется метод «пиннинга» (pinning) вертикального скролла. Вся страница фиксируется, а длинный горизонтальный контейнер сдвигается влево по мере прокрутки страницы пользователем.

### Структура DOM-элементов
```html
<!-- Контейнер скролла (высота задает длину прокрутки, например, h-[500vh]) -->
<div id="scroll-wrapper" class="relative w-full h-[500vh]">
  
  <!-- Фиксированное окно просмотра (w-screen h-screen, fixed или sticky) -->
  <div id="viewport" class="sticky top-0 left-0 w-screen h-screen overflow-hidden">
    
    <!-- Горизонтальная лента (ширина равна количеству секций, например, 500%) -->
    <!-- ВАЖНО: Класс will-change-transform явно добавляет CSS-свойство will-change: transform для оптимизации рендеринга -->
    <div id="horizontal-track" class="flex h-full w-[500vw] will-change-transform">
      <section class="panel w-screen h-full flex-none">Intro</section>
      <section class="panel w-screen h-full flex-none">Education</section>
      <section class="panel w-screen h-full flex-none">Experience</section>
      <section class="panel w-screen h-full flex-none">About</section>
      <section class="panel w-screen h-full flex-none">Contacts</section>
    </div>

  </div>
</div>
```

---

## 2. Реализация на GSAP ScrollTrigger

Класс `ScrollInterfaceService` настраивает анимацию сдвига трека на основе прокрутки родительского контейнера.

```typescript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ScrollInterfaceService {
  private wrapper: HTMLElement;
  private track: HTMLElement;
  private panels: HTMLElement[];
  private onSectionChangeCallback: (index: number, progress: number) => void;
  
  private triggerInstance: ScrollTrigger | null = null;

  constructor(
    wrapper: HTMLElement, 
    track: HTMLElement, 
    panels: HTMLElement[],
    onSectionChange: (index: number, progress: number) => void
  ) {
    this.wrapper = wrapper;
    this.track = track;
    this.panels = panels;
    this.onSectionChangeCallback = onSectionChange;
    this.init();
  }

  private init() {
    const totalPanels = this.panels.length;
    
    this.triggerInstance = ScrollTrigger.create({
      trigger: this.wrapper,
      start: "top top",
      end: "bottom bottom",
      pin: true,
      scrub: 1, // Сглаживание прокрутки (1 секунда задержки для плавности)
      invalidateOnRefresh: true, // Обязательно для пересчета значений скролла при ресайзе экрана
      animation: gsap.to(this.track, {
        xPercent: -100 * (totalPanels - 1),
        ease: "none" // Линейный сдвиг обязателен для синхронизации
      }),
      onUpdate: (self) => {
        const globalProgress = self.progress;
        // Расчет текущей активной секции
        const activeSection = Math.min(
          Math.floor(globalProgress * totalPanels),
          totalPanels - 1
        );
        const sectionProgress = (globalProgress * totalPanels) % 1;

        // Передача данных в оркестратор
        this.onSectionChangeCallback(activeSection, sectionProgress);
      }
    });
  }

  public destroy() {
    this.triggerInstance?.kill();
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}

> **Обновление при ресайзе**: Если контент внутри панелей меняется динамически или происходит ресайз окна, необходимо вызывать `ScrollTrigger.refresh()` для пересчета высоты скролл-контейнера и позиций триггера.
```

---

## 3. UI-интерфейс и минималистичный дизайн

Интерфейс должен быть зафиксирован поверх горизонтально движущихся панелей и иметь минималистичные интерактивные элементы:

*   **Верхняя панель навигации (Header)**:
    *   Логотип и ссылки на секции (`Intro`, `Edu`, `Exp`, `About`, `Contact`).
    *   При клике на ссылки должен происходить плавный скролл к соответствующей высоте страницы (через `gsap.to(window, { scrollTo: targetHeight })`).
*   **Индикатор прокрутки (Scroll Indicator)**:
    *   Тонкая линия внизу экрана, отображающая текущий прогресс скролла (от 0% до 100% ширины экрана).
    *   Индикатор активной секции: текстовое обозначение текущего шага в углу экрана (например, `[STEP.02/05]`).
*   **Сетки контента**:
    *   Контент на панелях размещается в виде колонок с большими отступами.
    *   Использование легкого эффекта параллакса для текстовых блоков внутри панелей (блоки сдвигаются с разной скоростью относительно движения фона, задается через `data-speed` атрибуты и GSAP).

---

## 4. Оптимизация производительности

1.  **will-change**: Свойство `will-change: transform` применяется строго и только к горизонтальному треку (`#horizontal-track`). Не следует навешивать его на все элементы внутри секций.
2.  **Запрет ручного перехвата событий**: Запрещено перехватывать события `wheel` / `mousewheel` / `touchmove` вручную для симуляции скролла. Вся физика скролла делегируется браузеру и GSAP ScrollTrigger.
3.  **Параметры ScrollTrigger**:
    *   `scrub: 1` обеспечивает плавное дотягивание скролла.
    *   `invalidateOnRefresh: true` гарантирует корректный пересчет размеров при изменении размеров экрана без необходимости перезапуска страницы.
4.  **Разделение логики скролла и UI**: UI-элементы (например, индикатор шагов `[STEP.02/05]`) обновляются по событию `onUpdate` скролл-триггера через оркестратор, не вызывая перерендеров тяжелых DOM-деревьев.

---

## 5. Доступность (Accessibility & Reduced Motion)

1.  **Физический скролл (L1)**: Прокрутка трека (`Scroll-driven track`) остаётся активной даже при включенном `prefers-reduced-motion: reduce`, поскольку она напрямую привязана к физическому скроллу пользователя и не вызывает неожиданных вестибулярных эффектов.
2.  **Программная прокрутка**: При переходе по ссылкам меню (клик на секции навигации) при `prefers-reduced-motion: reduce`:
    *   Вместо плавной прокрутки через `gsap.to(window, { scrollTo: targetHeight })` с длительностью, выполняется мгновенный переход к нужной координате (jump/duration: 0).
3.  **Фокус-переходы**: Порядок табации (`tabindex`) должен следовать логическому порядку панелей слева направо. При фокусе на скрытых элементах за пределами текущего экрана ScrollTrigger должен плавно (или мгновенно при reduced motion) прокручивать viewport к соответствующей секции.


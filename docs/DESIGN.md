# DESIGN.md — Дизайн-система портфолио

> **Источники**: ui-ux-pro-max design system · SPECIFICATION.md · services/*/design.md · CONTENT.md
> **Стиль**: Белый цифровой минимализм / Digital Blueprint
> **Стек**: Next.js 14 · TypeScript · Three.js (Vanilla) · GSAP · Tailwind CSS

---

## 1. Концепция и визуальная идентичность

### Философия

Портфолио — это не галерея работ, это **живой интерфейс системы**. Визуальный язык вдохновлён эстетикой технической документации, интерфейсов Detroit: Become Human и Matrix white room. Ощущение: стерильная чистота, бесконечное пространство, скрытая под поверхностью жизнь данных.

> **Ключевое ощущение**: пользователь не листает сайт — он исследует систему.

### Стиль: Exaggerated Minimalism (Белый Цифровой Минимализм)

| Параметр | Значение |
|---|---|
| **ui-ux-pro-max Style** | Exaggerated Minimalism |
| **Mode** | Light + Dark (переключатель тем) |
| **Keywords** | Bold minimalism · oversized typography · high contrast · negative space · statement design |
| **Best For** | Architecture · portfolio · agency · luxury · editorial |
| **Performance** | ⚡ Excellent |
| **Accessibility** | ✓ WCAG AA |
| **Anti-patterns** | AI purple/pink gradients · 2D-only layouts · low quality assets |

---

## 2. Цветовая палитра

Монохромная схема с единственным голубым акцентом. Цвет намеренно вынесен из «белого шума» и используется точечно — только для CTA и интерактивных состояний.

### Глобальные токены (Light Theme)

```css
:root {
  /* Структурные */
  --color-background:   #FAFAFA;  /* Фон страницы — чисто белый, не серый */
  --color-foreground:   #09090B;  /* Основной текст */
  --color-primary:      #18181B;  /* Заголовки, иконки */
  --color-on-primary:   #FFFFFF;  /* Текст на тёмных поверхностях */
  --color-secondary:    #3F3F46;  /* Вторичный текст, подписи */
  --color-muted:        #E8ECF0;  /* Разделители, placeholder-области */
  --color-border:       #E4E4E7;  /* Тонкие линии (0.5px) сетки, рамки */

  /* Акцент — используется ТОЛЬКО для CTA и focus-states */
  --color-accent:       #2563EB;
  --color-accent-hover: #1D4ED8;

  /* Специфика Three.js сцены */
  --color-particle:     #DCDCDC;  /* Цвет частиц (#dcdcdc, платиновый) */
  --color-grid-line:    rgba(0, 0, 0, 0.04); /* Тонкая сетка фона */

  /* Состояния */
  --color-destructive:  #DC2626;
  --color-ring:         #18181B;  /* Outline при фокусе */
}
```

### Глобальные токены (Dark Theme)

```css
:root.dark {
  /* Структурные */
  --color-background:   #09090B;  /* Фон страницы — глубокий чёрный */
  --color-foreground:   #FAFAFA;  /* Основной текст */
  --color-primary:      #FAFAFA;  /* Заголовки, иконки */
  --color-on-primary:   #09090B;  /* Текст на светлых поверхностях */
  --color-secondary:    #A1A1AA;  /* Вторичный текст, подписи */
  --color-muted:        #27272A;  /* Разделители, placeholder-области */
  --color-border:       #27272A;  /* Тонкие линии (0.5px) сетки, рамки */

  /* Акцент — используется ТОЛЬКО для CTA и focus-states */
  --color-accent:       #3B82F6;
  --color-accent-hover: #60A5FA;

  /* Специфика Three.js сцены */
  --color-particle:     #52525B;  /* Цвет частиц (тёмно-серый) */
  --color-grid-line:    rgba(255, 255, 255, 0.04); /* Тонкая сетка фона */

  /* Состояния */
  --color-destructive:  #EF4444;
  --color-ring:         #FAFAFA;  /* Outline при фокусе */
}
```

### Применение цвета по элементам

| Элемент | Light Theme | Dark Theme | Токен |
|---|---|---|---|
| Фон страницы | `#FAFAFA` | `#09090B` | `--color-background` |
| Основной текст | `#09090B` | `#FAFAFA` | `--color-foreground` |
| Заголовки H1–H2 | `#18181B` | `#FAFAFA` | `--color-primary` |
| Вторичный текст, даты | `#3F3F46` | `#A1A1AA` | `--color-secondary` |
| Частицы Three.js | `#DCDCDC` | `#52525B` | `--color-particle` |
| Разделители, линии | `#E4E4E7` | `#27272A` | `--color-border` |
| Кнопки, ссылки (hover) | `#2563EB` | `#3B82F6` | `--color-accent` |
| Технические теги/статусы | `#3F3F46` mono | `#A1A1AA` mono | `--color-secondary` |

---

## 3. Типографика

Двухуровневая шрифтовая система: **гуманистический гротеск для смыслового текста** + **монопространственный шрифт для технических данных**.

### Шрифтовые стеки

```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap');

:root {
  --font-display: 'Archivo', system-ui, sans-serif;           /* Заголовки */
  --font-body:    'Space Grotesk', system-ui, sans-serif;     /* Тело текста */
  --font-mono:    'JetBrains Mono', 'Courier New', monospace; /* Технические данные */
}
```

> **Почему Archivo & Space Grotesk**: Archivo создает сильный акцент для Oversized типографики (Hero, H1), а Space Grotesk обеспечивает отличную читаемость основного текста, сохраняя футуристическую геометрию.
> **Почему JetBrains Mono**: идеален для технических статусов (`[STEP.02/05]`), временных меток, лейблов секций — создаёт ощущение терминала внутри белого пространства.

### Типографическая шкала

```css
:root {
  /* Масштаб (5:1 ratio H1:Body — mandatory) */
  --text-hero:    clamp(4rem, 10vw, 10rem);   /* Имя, главный заголовок */
  --text-h1:      clamp(2.5rem, 5vw, 5rem);   /* Заголовки секций */
  --text-h2:      clamp(1.5rem, 3vw, 2.5rem);
  --text-h3:      clamp(1.125rem, 2vw, 1.5rem);
  --text-body:    1rem;                         /* 16px */
  --text-sm:      0.875rem;                     /* 14px — вторичные данные */
  --text-xs:      0.75rem;                      /* 12px — лейблы, статусы */

  /* Параметры текста */
  --tracking-hero: -0.05em;   /* letter-spacing для огромных заголовков */
  --tracking-ui:   0.05em;    /* tracking для монопространственных лейблов */
  --leading-tight: 1.1;       /* Для hero и H1 */
  --leading-body:  1.6;       /* Для основного текста */
}
```

### Применение по контексту

| Контекст | Шрифт | Размер | Вес | Характеристики |
|---|---|---|---|---|
| Имя-заголовок (Hero) | `--font-display` | `--text-hero` | 900 | `letter-spacing: -0.05em` |
| Заголовок секции | `--font-display` | `--text-h1` | 700 | `text-transform: uppercase` |
| Подзаголовок / роль | `--font-display` | `--text-h3` | 500 | `letter-spacing: 0.1em` UPPERCASE |
| Тело текста | `--font-body` | `--text-body` | 400 | `line-height: 1.6` |
| Технические лейблы | `--font-mono` | `--text-xs` | 400 | `letter-spacing: 0.05em`, `color: --color-secondary` |
| Индикатор прогресса | `--font-mono` | `--text-xs` | 500 | `[STEP.02/05]` формат |
| Даты, временные метки | `--font-mono` | `--text-sm` | 400 | `202X – Наст.` |
| CTA кнопка | `--font-display` | `--text-sm` | 500 | `letter-spacing: 0.08em` |

---

## 4. Система отступов и сетка

### Spacing scale (Spacious — density dial 3/10)

```css
:root {
  --space-1:    4px;
  --space-2:    8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-6:   24px;
  --space-8:   32px;
  --space-12:  48px;
  --space-16:  64px;
  --space-24:  96px;
  --space-32: 128px;
}
```

### Layout principles

- **Content padding**: `var(--space-12)` (48px) по горизонтали на каждой панели
- **Section header margin-bottom**: `var(--space-16)` (64px)
- **Block gap (Education, Experience items)**: `var(--space-8)` (32px)
- **Micro-elements gap (иконки, теги)**: `var(--space-2)` – `var(--space-3)` (8–12px)
- **Hero negative space (above/below H1)**: `var(--space-24)` – `var(--space-32)`

---

## 5. Структура секций

Вертикальный скролл с выборочным горизонтальным движением для конкретных секций.

### Карта секций

| Индекс | ID | Название | Частицы Three.js (Dala-style) | Ключевой UI |
|---|---|---|---|---|
| 0 | `#intro` | Intro | Векторное поле частиц. Взгляд на видео влево: формируется пульсирующая Синяя таблетка. Взгляд вправо: Красная таблетка (Матрица). | Hero name, tagline, CTA кнопка |
| 1 | `#education` | Education | Концентрические кольца (Detroit style), медленно вращаются | 3 блока образования |
| 2 | `#experience` | Experience | Вертикальная ось времени по центру, частицы пульсируют вдоль линии | Timeline с 2 позициями |
| 3 | `#about` | About & Stack | GSAP скролл-морфинг: частицы плавно трансформируются в геометрические 3D-фигуры (Сфера -> Куб -> Тор) по мере скролла карточек | Горизонтальный скролл-трек для карточек стека (Tech stack grid), bio text |
| 4 | `#services` | Services & Cost | Упорядоченная геометрическая сетка частиц | Интерактивный калькулятор сметы |
| 5 | `#contacts` | Contacts | Хаотичное облако с броуновским движением, частицы улетают к краям | Форма, соцсети |

---

## 6. Три сервиса — дизайн-контракт

### 6.1 BackgroundGraphicsService (Three.js)

Отвечает за GPU-ускоренный фон. **Изолирован от React state**.

```
Публичный API:
  .resize(width, height)
  .updatePointer(clientX, clientY)   <- пиксели экрана; конвертируются
                                         в world space внутри через Raycaster
  .morphTo(sectionIndex, progress?)  <- запускает GSAP-анимацию uMorphProgress (если progress не передан)
                                         или устанавливает значение напрямую (для scroll-scrub)
  .destroy()                         <- обязателен: .dispose() геометрии,
                                         материала, рендерера + removeEventListener
```

**Цвет частиц**: `#DCDCDC` (var: `--color-particle`), opacity `0.8`
**Размер точек**: `2px` с перспективным масштабированием (`300.0 / -viewPosition.z`)
**Фон рендерера**: `alpha: true` — сцена прозрачна, под ней страница `#FAFAFA`

**Деградация по мощности устройства**:
- Мобильные / низкая память (`deviceMemory < 4`) → `particlesCount = 300` вместо `1000`
- RAF автоматически останавливается при `document.visibilitychange` (hidden) и возобновляется при возврате
- При `prefers-reduced-motion: reduce` — RAF не запускается, рендерится один статичный кадр

> [!WARNING]
> Никогда не использовать `@react-three/fiber`. Только Vanilla Three.js.
> Никогда не читать `getBoundingClientRect` в RAF-loop.

### 6.2 ScrollInterfaceService (GSAP ScrollTrigger)

Трансформирует вертикальный скролл в горизонтальное смещение **только для секции "О себе" (Tech stack grid)**.

**DOM-структура**:
```
section.horizontal-scroll-section  (relative, min-h-[100vh])
  └─ div.horizontal-track  (flex, will-change: transform)
       └─ .scroll-item xN  (flex-none)
```

**GSAP параметры**: `scrub: 1`, `pin: true`, `ease: "none"` для трека

> [!IMPORTANT]
> Горизонтальный скролл применяется выборочно к конкретным секциям, не ко всей странице.
> Никогда не перехватывать `wheel` / `mousewheel` напрямую. Только GSAP ScrollTrigger с `pin: true`.

### 6.3 VideoInteractionService (GSAP + HTML5 Video)

Управляет видео-силуэтом на Intro-секции. Использует два видео-ассета для разных тем.

**Видео-ассеты**:
- Light theme: `/lbm.mp4` — белый фон, силуэт с белой поло-рубашкой
- Dark theme: `/lbm_dark.mp4` — чёрный фон, тот же силуэт

**Смешивание слоёв**:
- Light theme: `mix-blend-mode: multiply` — белый фон видео исчезает на белом фоне страницы
- Dark theme: `mix-blend-mode: screen` — чёрный фон видео исчезает на чёрном фоне страницы

**Обязательные атрибуты video**: `muted`, `playsInline`, `preload="auto"`
**Скруббинг throttle**: не чаще 30fps (`throttleMs = 33`)
**Параллакс strength**: `24px` смещение контейнера от центра курсора

> [!IMPORTANT]
> `pointer-events: none` на контейнере видео — клики проходят насквозь к Three.js-сцене.
> При переключении темы VideoInteractionService должен обновлять src видео-элемента и перезагружать видео.

---

## 7. Motion Design

### Уровни анимации (Motion Intensity 8/10 — Complex)

| Уровень | Элементы | GSAP инструмент | Длительность |
|---|---|---|---|
| **L1 — Scroll-driven** | Горизонтальный трек, морфинг частиц | ScrollTrigger + scrub | Tied to scroll |
| **L2 — Scrubbing** | Видео `currentTime`, параллакс видео | `gsap.to()` overwrite:auto | 0.6s / 1.2s |
| **L3 — Entrance** | Появление текста в секциях | `gsap.from()` + stagger | 300–500ms |
| **L4 — Ambient** | Покачивание частиц в секции 0 | Three.js RAF + `uTime` uniform | Continuous |
| **L5 — Morph** | Смена форм частиц между секциями | GSAP to `uMorphProgress` uniform | 1.5s |

### Стандартные easing-кривые

```js
// Входящие анимации
power2.out      // Контент появляется
power1.out      // Видео scrub

// Морфинг и переходы
power2.inOut    // Морфинг частиц (плавный вход и выход)
expo.inOut      // Переход между маршрутами (GSAP Flip)

// Линейные (только для scroll-scrub)
none / linear   // Трек горизонтального скролла
```

### GSAP Snippets — основные паттерны

```js
// Морфинг частиц (L5)
gsap.to(material.uniforms.uMorphProgress, {
  value: 1,
  duration: 1.5,
  ease: 'power2.inOut',
});

// Entrance контента внутри панели (L3)
gsap.from(el.children, {
  opacity: 0,
  y: 24,
  duration: 0.5,
  stagger: 0.08,
  ease: 'power2.out',
  scrollTrigger: { trigger: el, start: 'top 85%' }
});

// Параллакс текстовых блоков (L2, опционально)
gsap.to('.bg-layer', {
  yPercent: 10,
  ease: 'none',
  scrollTrigger: { trigger: section, scrub: true }
});
```

### Reduced Motion

При `prefers-reduced-motion: reduce` применяются следующие правила:

| Слой | Поведение |
|---|---|
| **RAF / Three.js** | Не запускается; рендерится один статичный кадр |
| **Морфинг частиц (L5)** | `duration: 0` → мгновенный переход без анимации |
| **Entrance текста (L3)** | `gsap.from()` пропускается или `duration: 0` |
| **Скруббинг видео (L2)** | Остаётся — не является вестибулярной анимацией |
| **Scroll-driven трек (L1)** | Остаётся — реагирует только на скролл пользователя |

```css
@media (prefers-reduced-motion: reduce) {
  /* CSS-анимации и transitions отключаются */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

JS-слой (GSAP + Three.js) управляет `prefers-reduced-motion` через:
```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// передаётся в BackgroundGraphicsService и все gsap.to() вызовы
```

---

## 8. UI-компоненты

### 8.1 Header / Navigation

```
Position: fixed, top-0, z-50
Background: rgba(250, 250, 250, 0.85), backdrop-blur(12px) [light]
Background: rgba(9, 9, 11, 0.85), backdrop-blur(12px) [dark]
Border-bottom: 0.5px solid var(--color-border)
Layout: flex justify-between items-center, px-4 md:px-8 lg:px-12, h-[60px]

Логотип: font-mono text-xs tracking-widest, "DV.SYS" или инициалы
Nav-links: font-display text-sm font-500, letter-spacing 0.05em
  Hover: color -> var(--color-accent), transition 200ms
  Active: border-bottom 1px solid var(--color-accent)

Theme toggle: иконка sun/moon, position right, click переключает класс .dark на <html>
```

### 8.2 Индикатор прогресса скролла

```
Position: fixed, bottom-0, left-0, right-0, z-50

Линия прогресса:
  height: 1px
  background: var(--color-border)
  ::after { background: var(--color-primary); width: {progress}% }

Лейбл секции (правый нижний угол):
  font: font-mono text-xs
  format: "[STEP.{n}/05]"
  color: var(--color-secondary)
  padding: 12px 16px
```

### 8.3 CTA кнопка (Intro)

```
Style: outlined (border 1px solid var(--color-primary))
Font: font-display text-sm font-500 tracking-widest uppercase
Padding: 12px 32px
Hover:
  background -> var(--color-primary)
  color -> var(--color-on-primary)
  transition: all 250ms ease-out
Focus-visible: outline 2px solid var(--color-ring), offset 2px
```

### 8.4 Timeline item (Experience)

```
Layout: grid grid-cols-[auto_1fr], gap-x-8
Маркер: w-2 h-2 rounded-full bg-[var(--color-primary)], mt-1.5
        + вертикальная линия border-l 1px dashed var(--color-border)
Period: font-mono text-xs, color var(--color-secondary)
Role:   font-display text-base font-600
Place:  font-display text-sm font-400, color var(--color-secondary)
```

### 8.5 Skill-тег (About / Stack)

```
Style: inline-flex, border 0.5px solid var(--color-border)
Font: font-mono text-xs
Padding: 4px 10px
Background: transparent
Hover: border-color var(--color-accent), transition 150ms
```

### 8.6 Интерактивный калькулятор сметы (Services)
Пошаговый конфигуратор (Landing / Web App / DevSecOps) с GSAP-счетчиком бюджета.

### 8.7 ИИ Чат-бот («Cyber Assistant»)
Плавающий Glassmorphic виджет в углу экрана, взаимодействующий с Next.js API (Gemini/OpenAI) для консультации клиентов.

### 8.8 Cookie & 152-ФЗ РФ
Футуристичный баннер снизу экрана для согласия на обработку персональных данных (ФЗ № 152-ФЗ).

---

## 9. Системные интерфейсы между сервисами

```typescript
// Типы из SPECIFICATION.md
interface PointerCoords {
  x: number; // -1 to 1 (нормализовано от центра экрана)
  y: number; // -1 to 1
}

interface ScrollState {
  progress:        number; // 0 to 1 (глобальный прогресс)
  activeSection:   number; // 0 to 4
  sectionProgress: number; // 0 to 1 (локальный прогресс внутри секции)
}
```

**Поток данных (Orchestrator pattern)**:

```
page.tsx (Orchestrator)
  ├─ onPointerMove -> bgServiceRef.updatePointer(clientX, clientY)
  ├─ onPointerMove -> videoServiceRef.updatePointer(clientX, clientY)
  ├─ onScrollUpdate(index, progress) -> bgServiceRef.morphTo(index, progress)
  └─ onScrollUpdate(index, progress) -> videoServiceRef.updateScrollProgress(progress)
```

---

## 10. Performance-требования

| Метрика | Цель | Метод |
|---|---|---|
| **Target FPS** | 60 FPS desktop, 30+ FPS mobile mid-tier | requestAnimationFrame + GPU offload |
| **Draw calls** | 1 draw call для всех частиц | `THREE.Points` с `BufferGeometry` |
| **Mouse sampling** | Lerp в RAF, не в event handler | `currentPointer += (target - current) * 0.1` |
| **Video seek rate** | Не чаще 30/сек | `throttleMs = 33`, `Math.abs > 0.01` порог |
| **Memory leaks** | Нет при unmount | `destroy()`: `geometry.dispose()` + `material.dispose()` + `renderer.dispose()` + `removeEventListener` |
| **Battery drain** | RAF паузится при скрытой вкладке | `visibilitychange` → `stopLoop()` / `startLoop()` |
| **Layout thrash** | Нет в RAF loop | Только `ResizeObserver` читает размеры |
| **will-change** | Только на трансформируемых элементах | `#horizontal-track`, видео-контейнер |
| **Pixel ratio** | Ограничен x2 | `Math.min(devicePixelRatio, 2)` |

---

## 11. Accessibility

| Требование | Реализация |
|---|---|
| WCAG AA contrast | `#09090B` на `#FAFAFA` = 19.6:1 ✅ |
| Focus visible | `outline: 2px solid var(--color-ring)`, offset 2px |
| prefers-reduced-motion | RAF не запускается (статичный кадр), морфинг `duration: 0`, entrance отключается, скруббинг остаётся |
| Keyboard navigation | Tab-порядок следует визуальному порядку секций |
| Screen reader | `aria-label` на иконках соцсетей, `role="presentation"` на декоративных элементах |
| Touch targets | Все интерактивные элементы >= 44x44px |

---

## 12. Чеклист перед поставкой

### Visual Quality
- [ ] Нет emoji в роли иконок (только SVG — Phosphor Icons или Heroicons)
- [ ] Light: все частицы — `#DCDCDC`, фон `#FAFAFA`
- [ ] Dark: все частицы — `#52525B`, фон `#09090B`
- [ ] Light: видео-контейнер имеет `mix-blend-mode: multiply`, src="/lbm.mp4"
- [ ] Dark: видео-контейнер имеет `mix-blend-mode: screen`, src="/lbm_dark.mp4"
- [ ] `pointer-events: none` на видео-контейнере
- [ ] Типографика: только `Space Grotesk` + `JetBrains Mono`
- [ ] Переключатель тем в header работает корректно, сохраняет состояние в localStorage

### Animation
- [ ] Все трансформации через `transform` / `opacity` (не `top/left/width`)
- [ ] `prefers-reduced-motion` реализован
- [ ] `will-change: transform` только на `#horizontal-track`
- [ ] Морфинг частиц проходит без скачков FPS

### Architecture
- [ ] Нет `useState` / `useContext` для координат мыши или прогресса скролла
- [ ] Все сервисы вызывают `destroy()` при unmount
- [ ] `ScrollTrigger.refresh()` вызывается после изменения контента
- [ ] `invalidateOnRefresh: true` на ScrollTrigger instance

### Responsive
- [ ] Проверено: 375px · 768px · 1024px · 1440px
- [ ] Видео: `w-[75vw]` мобайл → `w-[38vw]` десктоп (md+)
- [ ] Particle count: `300` на мобайл / слабый GPU, `1000` на десктоп (`detectLowEndDevice()`)

---

## 13. Связанные документы

| Документ | Описание |
|---|---|
| [SPECIFICATION.md](./SPECIFICATION.md) | Системная архитектура, схема сервисов, TypeScript интерфейсы |
| [CONTENT.md](./CONTENT.md) | Все тексты, контент секций, копирайт |
| [services/background-graphics/design.md](./services/background-graphics/design.md) | Детальный дизайн Three.js, шейдеры, морфинг |
| [services/scroll-interface/design.md](./services/scroll-interface/design.md) | ScrollTrigger, горизонтальный скролл, UI-индикаторы |
| [services/video-interaction/design.md](./services/video-interaction/design.md) | Видео-скруббинг, параллакс, mix-blend-mode |
| [services/background-graphics/agents.md](./services/background-graphics/agents.md) | Правила для агентов по Three.js сервису |
| [services/scroll-interface/agents.md](./services/scroll-interface/agents.md) | Правила для агентов по ScrollTrigger сервису |
| [services/video-interaction/agents.md](./services/video-interaction/agents.md) | Правила для агентов по Video сервису |

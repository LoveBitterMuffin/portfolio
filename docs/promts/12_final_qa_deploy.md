# Промт 12: Финальный QA, сборка и деплой

## Задача
Выполнить комплексный финальный QA-аудит по всем чеклистам из [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Раздел 12), исправить найденные дефекты, собрать продакшн-бандл и подготовить проект к деплою.

## Контекст и файлы
*   **Чеклист приемки**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Раздел 12)
*   **Performance-требования**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Раздел 10)
*   **Сборка**: [SPECIFICATION.md](file:///c:/mp/portfolio/docs/SPECIFICATION.md) (Раздел 5)
*   **Вся кодовая база**: `src/`

## Инструкции по реализации

### 1. Запуск продакшн-сборки и анализ

```bash
# Шаг 1: Продакшн-сборка
npm run build

# Шаг 2: Запуск продакшн-сервера для финального тестирования
npm run start

# Шаг 3: Анализ размера бандла (опционально)
npx next-bundle-analyzer
# или: ANALYZE=true npm run build (если настроен @next/bundle-analyzer в next.config.ts)
```

Убедитесь, что:
*   Сборка проходит **без TypeScript-ошибок** и **без ошибок ESLint**.
*   Нет предупреждений `react-dom` об ошибках гидрации (hydration mismatch).
*   Размер JS-бандла для первой страницы (`/`) не превышает **300 KB gzip**.

### 2. Полный чеклист QA по DESIGN.md

Пройдите по всем пунктам из Раздела 12 [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md):

#### Visual Quality
- [ ] Нет emoji в роли иконок (только SVG — Heroicons / Lucide)
- [ ] Все частицы — `#DCDCDC` (`--color-particle`), фон `#FAFAFA` (`--color-background`)
- [ ] Видео-контейнер имеет `mix-blend-mode: multiply`
- [ ] `pointer-events: none` на видео-контейнере
- [ ] Типографика: только `Space Grotesk` + `JetBrains Mono`
- [ ] `DotGrid` компонент удалён (заменён Three.js-сценой)

#### Animation
- [ ] Все трансформации через `transform` / `opacity` (не `top/left/width/height`)
- [ ] `prefers-reduced-motion` реализован для всех уровней анимации
- [ ] `will-change: transform` **только** на `#horizontal-track` и видео-контейнере
- [ ] Морфинг частиц проходит без скачков FPS (проверяется в DevTools Performance)
- [ ] Нет GSAP-предупреждений в консоли (`overwrite: 'auto'` везде где нужен)

#### Architecture
- [ ] Нет `useState` / `useContext` для координат мыши или прогресса скролла
- [ ] Все 3 сервиса вызывают `destroy()` при unmount (проверяется в Memory DevTools)
- [ ] `ScrollTrigger.refresh()` вызывается после изменения контента (если применяется)
- [ ] `invalidateOnRefresh: true` на ScrollTrigger instance горизонтального трека
- [ ] Нет утечек памяти после 10 route navigations (Memory tab: heap не растёт)

#### Responsive
- [ ] Проверено: **375px** · **768px** · **1024px** · **1440px**
- [ ] Видео: `w-[75vw]` мобайл → `w-[38vw]` десктоп (md+)
- [ ] `particlesCount`: 300 на мобайл / слабый GPU, 1000 на десктоп

### 3. Кросс-браузерное тестирование

Проверьте в следующих браузерах:

| Браузер | Минимальная версия | Критические проверки |
|---|---|---|
| Chrome | 110+ | WebGL2, GSAP ScrollTrigger, mix-blend-mode |
| Firefox | 110+ | WebGL, backdrop-filter поддержка |
| Safari | 16+ | `playsInline`, `mix-blend-mode: multiply`, CSS clamp |
| Edge | 110+ | Идентично Chrome |
| Mobile Chrome | Android 10+ | Touch scroll, particle count fallback |
| Mobile Safari | iOS 15+ | `playsInline`, touch events, reduced particle count |

*   **Особое внимание**: `backdrop-filter: blur()` требует `-webkit-backdrop-filter` для Safari ≤ 15.
*   **WebGL fallback**: Если `WebGLRenderingContext` не доступен, показывайте статичный CSS-фон без ошибок.

WebGL fallback (`src/services/BackgroundGraphicsService.ts`):
```typescript
private initRenderer(): boolean {
  try {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true });
    return true;
  } catch (e) {
    console.warn('[BGService] WebGL not supported, using static fallback');
    return false;
  }
}
```

### 4. Lighthouse-аудит (Целевые показатели)

Запустите Lighthouse в Chrome DevTools (режим Desktop и Mobile):

| Метрика | Desktop Target | Mobile Target |
|---|---|---|
| Performance | ≥ 90 | ≥ 80 |
| Accessibility | ≥ 95 | ≥ 95 |
| Best Practices | ≥ 95 | ≥ 90 |
| SEO | ≥ 95 | ≥ 95 |

Типичные точки роста производительности:
*   **LCP**: убедитесь, что шрифты имеют `display=swap`, hero-текст не заблокирован FOIT.
*   **CLS**: Three.js canvas имеет явные размеры (`width: 100%; height: 100%`), видео имеет `aspect-ratio`.
*   **TBT**: динамический импорт Three.js/GSAP снижает блокировку главного потока.

### 5. Финальная очистка кода

*   Удалите все `console.log`, `console.warn` отладочного характера.
*   Удалите `DotGrid` компонент и его импорты, если он был временным решением.
*   Убедитесь, что в `src/data/content.json` нет заглушечных данных (`[Учебное заведение]` → заменить на реальные данные если известны).
*   Проверьте, что все `TODO` и `FIXME` комментарии в коде решены или задокументированы.
*   Добавьте `README.md` в корень проекта с описанием стека, командами запуска и архитектурой.

### 6. Подготовка к деплою

**README.md** (корень проекта) должен содержать:
```markdown
# Dmitry Volkov — Interactive Portfolio

## Stack
- **Framework**: Next.js 14 (App Router)
- **3D Graphics**: Three.js (Vanilla TypeScript)
- **Animation**: GSAP + ScrollTrigger
- **Styling**: Tailwind CSS v4

## Commands
\`\`\`bash
npm run dev    # Development server (Turbopack)
npm run build  # Production build
npm run start  # Production server
npm run lint   # ESLint check
\`\`\`

## Architecture
Три изолированных сервиса управляются центральным оркестратором (page.tsx):
- `BackgroundGraphicsService` — Three.js WebGL частицы с морфингом
- `ScrollInterfaceService` — горизонтальный скролл через GSAP ScrollTrigger
- `VideoInteractionService` — видео-скруббинг и параллакс
```

**Деплой на Vercel** (рекомендуется для Next.js):
```bash
npx vercel --prod
```
Или настройте CI/CD через GitHub Actions → Vercel.

**Переменные окружения** (`.env.local`):
```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Критерии приемки
1. `npm run build` завершается **без ошибок** TypeScript и ESLint.
2. `npm run start` (продакшн-сервер): все анимации, скролл и видео работают идентично dev-режиму.
3. Все пункты чеклиста из Раздела 12 DESIGN.md отмечены как выполненные.
4. Lighthouse Performance ≥ 90 на Desktop, ≥ 80 на Mobile.
5. Lighthouse Accessibility ≥ 95.
6. В Chrome Memory DevTools: heap-снимок после монтирования/размонтирования компонента не показывает рост объектов Three.js/GSAP.
7. Проект задеплоен и открывается по публичному URL без ошибок консоли.

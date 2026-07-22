# OptionWheel Navigation & Services Inspection Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the `OptionWheel` component as an interactive central controller in the Services section (`src/app/page.tsx`) with 1px contour line Void aesthetic and dynamic service inspection details card.

**Architecture:** 
1. Enrich service data items in `src/data/content.json` with detailed deliverables, subtitle, and descriptions.
2. Refactor `OptionWheel.jsx` & `OptionWheel.css` for Void aesthetic (concentric 1px guide rings with `15%` opacity, pure `#000000` background, no legacy gradients/gray blocks).
3. Replace static services list in `src/app/page.tsx` with a responsive 2-column layout (OptionWheel + Dynamic Inspection Glass Card).

**Tech Stack:** Next.js (React), CSS modules / Tailwind CSS, OptionWheel controller, GSAP.

## Global Constraints
- Pure `#000000` void aesthetic background for OptionWheel.
- 1px thin contour outlines (`rgba(255, 255, 255, 0.15)`).
- Preserve accessibility (ARIA `listbox` / `option`, keyboard arrow navigation).

---

### Task 1: Update Services Content Data Structure

**Files:**
- Modify: `src/data/content.json:85-92`

**Interfaces:**
- Consumes: `contentData.services`
- Produces: `services.items` array with `id`, `title`, `subtitle`, `description`, `deliverables`, `price`

- [ ] **Step 1: Update content.json with rich services dataset**

Edit `src/data/content.json` under `"services"`:
```json
  "services": {
    "header": "УСЛУГИ // SERVICES & SOLUTIONS",
    "items": [
      {
        "id": "web-dev",
        "title": "Web Development & Web Engines",
        "subtitle": "Высоконагруженные веб-приложения & SPA",
        "description": "Проектирование и разработка современных веб-сервисов с акцентом на скорость, SEO и отзывчивость.",
        "deliverables": ["Next.js / React Architecture", "GSAP & Three.js 3D/FX", "Core Web Vitals 95+"],
        "price": "по договоренности"
      },
      {
        "id": "devsecops",
        "title": "DevSecOps & Cloud Infrastructure",
        "subtitle": "Оркестрация, безопасность & CI/CD",
        "description": "Построение надежных CI/CD пайплайнов, контейнеризация приложений и зашифрованное управление секретами.",
        "deliverables": ["Kubernetes & Docker Swarm", "GitLab CI / GitHub Actions", "Vault & Secrets Management"],
        "price": "по договоренности"
      },
      {
        "id": "security-audit",
        "title": "Security Audit & Code Review",
        "subtitle": "Аудит по OWASP Top 10",
        "description": "Комплексный анализ исходного кода, выявление уязвимостей и повышение устойчивости инфраструктуры.",
        "deliverables": ["Static/Dynamic Analysis (SAST/DAST)", "OWASP Compliance", "План ликвидации угроз"],
        "price": "по договоренности"
      },
      {
        "id": "interactive-3d",
        "title": "Interactive 3D & Canvas FX",
        "subtitle": "Three.js & WebGL рендеринг",
        "description": "Интерактивные 3D-сцены, генеративные частицы и кастомные шейдеры для премиального UX.",
        "deliverables": ["Custom WebGL Shaders", "GSAP ScrollTrigger sync", "GPU Optimization"],
        "price": "по договоренности"
      },
      {
        "id": "consulting",
        "title": "Technical Consulting & Mentorship",
        "subtitle": "Архитектурный консалтинг",
        "description": "Экспертное сопровождение команд, аудит архитектурных решений и менторство разработчиков.",
        "deliverables": ["Code Review", "Инфраструктурная карта", "Обучение команды"],
        "price": "по договоренности"
      }
    ]
  }
```

- [ ] **Step 2: Commit content update**

```bash
git add src/data/content.json
git commit -m "feat(services): expand services data structure in content.json"
```

---

### Task 2: Refactor OptionWheel & OptionWheel.css for Void Aesthetic

**Files:**
- Modify: `src/components/OptionWheel.jsx`
- Modify: `src/components/OptionWheel.css`

**Interfaces:**
- Consumes: `OptionWheel` props (`items`, `defaultSelected`, `onChange`, `side`, `fontSize`, etc.)
- Produces: `OptionWheel` component styled with 1px contour rings background and zero gray box artifacts.

- [ ] **Step 1: Add 1px contour background guide rings in `OptionWheel.jsx`**

Update `src/components/OptionWheel.jsx` render return to include concentric thin guide rings in the background:
```jsx
return (
  <div
    ref={rootRef}
    role="listbox"
    tabIndex={0}
    aria-label="Option wheel"
    className={`option-wheel${side === 'right' ? ' option-wheel--right' : ''}${isDragging ? ' option-wheel--dragging' : ''}${className ? ` ${className}` : ''}`}
    style={{
      '--ow-text-color': textColor,
      '--ow-active-color': activeColor,
      '--ow-font-size': `${fontSize}rem`,
      '--ow-inset': `${inset}px`
    }}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerEnd}
    onPointerCancel={handlePointerEnd}
    onKeyDown={handleKeyDown}
  >
    {/* 1px contour guide rings backdrop */}
    <div className="option-wheel__ring-backdrop" aria-hidden="true">
      <div className="option-wheel__ring option-wheel__ring--1" />
      <div className="option-wheel__ring option-wheel__ring--2" />
      <div className="option-wheel__ring option-wheel__ring--3" />
    </div>

    {items.map((label, index) => (
      <div
        key={`${label}-${index}`}
        ref={el => {
          itemRefs.current[index] = el;
        }}
        role="option"
        aria-selected={selectedIndex === index}
        className={`option-wheel__item${selectedIndex === index ? ' option-wheel__item--selected' : ''}`}
        onClick={() => handleItemClick(index)}
      >
        {label}
      </div>
    ))}
  </div>
);
```

- [ ] **Step 2: Update `OptionWheel.css` for 1px contour guides & Void Aesthetic**

Edit `src/components/OptionWheel.css`:
```css
.option-wheel {
  --ow-text-color: #a6a6a6;
  --ow-active-color: #ffffff;
  --ow-font-size: 2.2rem;
  --ow-inset: 40px;

  position: relative;
  width: 100%;
  height: 100%;
  min-height: 380px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: none;
  outline: none;
  background: transparent;
}

.option-wheel:focus-visible {
  outline: 1px dashed rgba(255, 255, 255, 0.4);
  outline-offset: -4px;
}

.option-wheel--dragging {
  cursor: grabbing;
}

/* Concentric thin 1px guide rings (Void aesthetic) */
.option-wheel__ring-backdrop {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.option-wheel__ring {
  position: absolute;
  top: 50%;
  left: -20%;
  transform: translateY(-50%);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.02);
}

.option-wheel__ring--1 {
  width: 280px;
  height: 280px;
}

.option-wheel__ring--2 {
  width: 440px;
  height: 440px;
  border-color: rgba(255, 255, 255, 0.07);
}

.option-wheel__ring--3 {
  width: 600px;
  height: 600px;
  border-color: rgba(255, 255, 255, 0.04);
}

/* Option Items */
.option-wheel__item {
  position: absolute;
  top: 50%;
  left: var(--ow-inset);
  white-space: nowrap;
  font-size: var(--ow-font-size);
  line-height: 1.2;
  font-weight: 300;
  transform-origin: left center;
  cursor: pointer;
  z-index: 1;
  will-change: transform, opacity, filter;
  color: color-mix(in srgb, var(--ow-active-color) calc(var(--ow-p, 0) * 100%), var(--ow-text-color));
  transition: text-shadow 0.3s ease;
}

.option-wheel--right .option-wheel__item {
  left: auto;
  right: var(--ow-inset);
  transform-origin: right center;
}

.option-wheel__item--selected {
  font-weight: 600;
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
}
```

- [ ] **Step 3: Commit OptionWheel styling updates**

```bash
git add src/components/OptionWheel.jsx src/components/OptionWheel.css
git commit -m "feat(OptionWheel): implement 1px contour guide rings and void aesthetic"
```

---

### Task 3: Integrate OptionWheel & Dynamic Detail Card into Services Section

**Files:**
- Modify: `src/app/page.tsx:455-486`

**Interfaces:**
- Consumes: `OptionWheel` component, `contentData.services`
- Produces: Interactive Services Section with central `OptionWheel` controller and dynamic detail inspection card.

- [ ] **Step 1: Import OptionWheel and setup active service state in `src/app/page.tsx`**

In `src/app/page.tsx`:
Import `OptionWheel`:
```tsx
import OptionWheel from '../components/OptionWheel';
```

In `Page()` state initialization:
```tsx
const [activeServiceIndex, setActiveServiceIndex] = useState(0);
```

- [ ] **Step 2: Replace static Services list with interactive 2-column OptionWheel layout**

In `src/app/page.tsx` under `#services`:
```tsx
{/* Section 4 — Services (Interactive OptionWheel Controller) */}
<section
  id="services"
  className="min-h-screen flex flex-col justify-center relative overflow-hidden py-16"
  style={{ background: 'transparent', paddingLeft: '10vw', paddingRight: '10vw' }}
>
  <div className="w-full max-w-6xl mx-auto">
    <p className="font-mono text-xs mb-4 tracking-widest uppercase text-secondary animate-entrance">
      [STEP.03/05] — Services & Solutions
    </p>
    <h2 className="font-display font-bold uppercase mb-12 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
      {contentData.services.header}
    </h2>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
      {/* Left Column: Interactive OptionWheel */}
      <div className="lg:col-span-5 h-[380px] sm:h-[420px] relative rounded-2xl border border-border/40 bg-surface/20 backdrop-blur-md overflow-hidden flex items-center shadow-2xl">
        <OptionWheel
          items={contentData.services.items.map((item) => item.title)}
          defaultSelected={0}
          onChange={(index) => setActiveServiceIndex(index)}
          side="left"
          fontSize={isMobile ? 1.2 : 1.5}
          curve={1.1}
          tilt={7}
          inset={isMobile ? 24 : 40}
        />
      </div>

      {/* Right Column: Dynamic Service Detail Card */}
      <div className="lg:col-span-7 flex flex-col justify-between min-h-[380px] rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 sm:p-10 shadow-2xl transition-all duration-300">
        {contentData.services.items[activeServiceIndex] && (
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
                <span className="font-mono text-xs tracking-widest uppercase text-accent font-semibold">
                  [SERVICE.0{activeServiceIndex + 1} / 0{contentData.services.items.length}]
                </span>
                <span className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded border border-border bg-surface text-secondary">
                  {contentData.services.items[activeServiceIndex].price}
                </span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-primary mb-2">
                {contentData.services.items[activeServiceIndex].title}
              </h3>
              <p className="font-mono text-xs text-accent uppercase tracking-wider mb-6">
                {contentData.services.items[activeServiceIndex].subtitle}
              </p>

              <p className="font-body text-base text-secondary leading-relaxed mb-8">
                {contentData.services.items[activeServiceIndex].description}
              </p>

              <div className="mb-8">
                <h4 className="font-mono text-xs uppercase tracking-widest text-primary/80 mb-3 font-semibold">
                  Ключевые результаты / Deliverables:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {contentData.services.items[activeServiceIndex].deliverables.map((item, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-xs px-3 py-1.5 rounded-sm border border-border/60 bg-surface/80 text-primary"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/40 flex items-center justify-between">
              <span className="font-mono text-xs text-secondary">
                CONTROLLER: OPTIONWHEEL ACTIVE
              </span>
              <a
                href="#contacts"
                className="font-mono text-xs uppercase tracking-wider px-5 py-2.5 rounded border border-accent bg-accent/10 text-primary hover:bg-accent hover:text-black transition-all duration-200 font-semibold"
              >
                Запросить расчет →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Commit Services OptionWheel integration**

```bash
git add src/app/page.tsx
git commit -m "feat(services): integrate OptionWheel interactive controller with dynamic detail card"
```

---

### Task 4: Verification & Build Check

**Files:**
- None (Build & run verification)

- [ ] **Step 1: Execute production build**

Run: `npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 2: Commit any final adjustments**

```bash
git status
```

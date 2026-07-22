# OptionWheel Navigation & Dynamic Services Inspection Card Design

## Overview
This design specification details the integration of the `OptionWheel` component as a central interactive controller within the `Services` section of the portfolio (`src/app/page.tsx`). It adheres to the **Void Aesthetic** (pure `#000000` background, 1px contour outlines, 15% opacity rings, minimal typography) and provides a dynamic side-by-side (or responsive stacked) inspection panel that updates in real time as the user rotates or clicks items on the wheel.

---

## 1. Design & Aesthetic System (Void Aesthetic)

### Visual Token & Styling Guidelines
- **Background**: Pure `#000000` void canvas.
- **Rings & Contours**: 1px thin geometric circles/rings behind the wheel rendered with `rgba(255, 255, 255, 0.15)` outline.
- **Inactive Items**: `color: #a6a6a6`, low font-weight (200), subtle spatial blur (`blur(2px)`) and fade.
- **Active / Selected Item**: `color: #ffffff`, font-weight (500), crisp zero-blur, illuminated with subtle primary accent highlight.
- **Clean UI**: Stripped of legacy gray panels, gradient backgrounds, or bulky borders.

---

## 2. Component Architecture & Data Flow

### Data Structure (`src/data/content.json`)
The services array in `src/data/content.json` is structured into detailed service offerings:

```json
{
  "services": {
    "header": "УСЛУГИ & ТЕХНОЛОГИЧЕСКИЙ СТЕК // SERVICES & SOLUTIONS",
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
}
```

---

## 3. OptionWheel Component Refactoring (`src/components/OptionWheel.jsx` & `OptionWheel.css`)

### Changes in `OptionWheel.jsx`:
1. **Background Contour Rings**: Add SVG/CSS concentric 1px guide rings centered within the wheel container with `15%` opacity.
2. **Refined Props**:
   - `textColor`: `#a6a6a6`
   - `activeColor`: `#ffffff`
   - `fontSize`: `1.8rem` (scaled for multi-line / desktop balance)
   - `spacing`: `1.5`
   - `curve`: `1.1`
   - `tilt`: `8`
   - `wheelPassthrough`: `false` (in Services section, scrolling/dragging wheel directly switches items smoothly without breaking page vertical scroll when inside the section).

### Changes in `OptionWheel.css`:
1. Use `#000000` void aesthetic styling with 1px contour guides.
2. Ensure touch-action and pointer events are handled seamlessly without layout jumps.
3. Added focus-visible accessibility outlines for keyboard navigation.

---

## 4. Services Section Integration (`src/app/page.tsx`)

### Layout (`#services` section):
- **Desktop Layout (≥ 1024px)**:
  - 2-column grid (`grid-cols-12`):
    - Left Column (`col-span-5` or `col-span-6`): `OptionWheel` container with 1px contour backdrop.
    - Right Column (`col-span-7` or `col-span-6`): Dynamic Service Inspection Card (`glassmorphism / void card` with 1px border, backdrop-blur, title, subtitle, description list, price badge, and CTA button).
- **Mobile / Tablet Layout (< 1024px)**:
  - Stacked layout: OptionWheel on top with height ~320px, followed by the selected service card below.

### Interactive State Sync:
```tsx
const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);

// Handled via OptionWheel onChange callback:
<OptionWheel
  items={servicesItems.map(s => s.title)}
  defaultSelected={0}
  onChange={(index) => setSelectedServiceIndex(index)}
  side="left"
  fontSize={isMobile ? 1.4 : 1.8}
  curve={1.2}
/>
```

---

## 5. Verification Plan

### Automated Verification:
- Build check: `npm run build` to verify Next.js TypeScript compilation and JSX component resolution.

### Manual Verification:
- Rotate wheel via mouse drag, touchpad scroll, direct item clicks, and keyboard arrow keys.
- Confirm dynamic card update with zero lag.
- Check 1px contour ring aesthetics and `#000000` void background styling on dark mode.

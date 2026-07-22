# OptionWheel Global Side HUD Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `OptionWheel` as a fixed Global Side HUD Navigation Controller ("Штурвал навигации") pinned to the right edge of the screen, with bi-directional scrolling sync between page sections and the wheel.

**Architecture:**
1. Update `OptionWheel.jsx` to support smooth controlled external updates when the `selected` prop changes (e.g. when page scroll changes `activeSection`).
2. Restore `Services` section in `src/app/page.tsx` to a clean cards layout displaying deliverables and prices.
3. Position `OptionWheel` fixed on the right side HUD container (`position: fixed`, right edge, vertically centered).
4. Bind `OptionWheel` to `SECTIONS = ['About', 'Experience', 'Services', 'Education', 'Contacts']` with bi-directional sync:
   - Page scroll updates `activeSection` -> OptionWheel rotates to match.
   - User rotates/clicks OptionWheel -> `handleNavClick` smoothly scrolls page to section.

**Tech Stack:** Next.js, React, OptionWheel, GSAP.

## Global Constraints
- Pure `#000000` void aesthetic, 1px contour lines (`rgba(255, 255, 255, 0.15)`).
- Preserve horizontal scroll track in `About` section.
- Non-intrusive HUD visible on desktop (≥768px).

---

### Task 1: Add Controlled External Position Sync to OptionWheel

**Files:**
- Modify: `src/components/OptionWheel.jsx`

**Interfaces:**
- Consumes: `selected` prop (optional external active index number)
- Produces: Smooth animated target update when `selected` prop changes externally.

- [ ] **Step 1: Add `selected` prop handling in `OptionWheel.jsx`**

Update `OptionWheel.jsx` signature and effect:
```jsx
const OptionWheel = ({
  items = DEFAULT_ITEMS,
  defaultSelected = 3,
  selected = null, // External controlled active index
  onChange = (index, item) => {},
...
```

Add effect to sync target when `selected` prop changes from outside:
```jsx
useEffect(() => {
  if (selected !== null && selected !== undefined && selected >= 0) {
    if (selectedRef.current !== selected) {
      applyTarget(selected, true);
    }
  }
}, [selected, applyTarget]);
```

- [ ] **Step 2: Commit OptionWheel prop update**

```bash
git add src/components/OptionWheel.jsx
git commit -m "feat(OptionWheel): add controlled selected prop support for external scroll sync"
```

---

### Task 2: Restore Clean Cards Layout in Services Section

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `contentData.services.items`
- Produces: Clean cards representation in `#services` section.

- [ ] **Step 1: Replace `#services` section in `src/app/page.tsx` with clean cards grid**

Update `#services` in `src/app/page.tsx`:
```tsx
{/* Section 4 — Services */}
<section
  id="services"
  className="min-h-screen flex items-center relative overflow-hidden py-20"
  style={{ background: 'transparent', paddingLeft: '10vw', paddingRight: '10vw' }}
>
  <div className="w-full max-w-5xl mx-auto">
    <p className="font-mono text-xs mb-4 tracking-widest uppercase text-secondary animate-entrance">
      [STEP.03/05] — Services & Solutions
    </p>
    <h2 className="font-display font-bold uppercase mb-16 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
      {contentData.services.header}
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
      {contentData.services.items.map((item, idx) => (
        <div
          key={item.id || idx}
          className="rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-primary/40 group"
        >
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
              <span className="font-mono text-xs tracking-widest uppercase text-accent font-semibold">
                [0{idx + 1} / 0{contentData.services.items.length}]
              </span>
              <span className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded border border-border bg-surface text-secondary">
                {item.price}
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold uppercase text-primary mb-2 group-hover:text-accent transition-colors">
              {item.title}
            </h3>
            <p className="font-mono text-xs text-accent uppercase tracking-wider mb-4">
              {item.subtitle}
            </p>

            <p className="font-body text-sm text-secondary leading-relaxed mb-6">
              {item.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {item.deliverables.map((deliv, dIdx) => (
                <span
                  key={dIdx}
                  className="font-mono text-[11px] px-2.5 py-1 rounded-sm border border-border/50 bg-surface/60 text-primary/90"
                >
                  ✓ {deliv}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 flex items-center justify-between">
            <span className="font-mono text-[11px] text-secondary uppercase tracking-wider">
              {item.id}
            </span>
            <a
              href="#contacts"
              className="font-mono text-xs uppercase text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-semibold"
            >
              Заказать →
            </a>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit Services cards update**

```bash
git add src/app/page.tsx
git commit -m "feat(services): restore clean cards grid layout for services section"
```

---

### Task 3: Integrate Fixed Global Side HUD Controller in page.tsx

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `OptionWheel`, `SECTIONS`, `activeSection`, `handleNavClick`
- Produces: Floating HUD anchored on right side of viewport.

- [ ] **Step 1: Add Global OptionWheel HUD component to page layout**

In `src/app/page.tsx`, before closing main or after `<ScrollProgressIndicator>`:
```tsx
{/* ── Global Side HUD Controller (OptionWheel Штурвал Навигации) ──────── */}
<div
  className="fixed right-2 top-1/2 -translate-y-1/2 w-[240px] sm:w-[280px] h-[360px] z-40 pointer-events-none hidden md:block"
  aria-label="Navigation Wheel HUD"
>
  <div className="w-full h-full relative pointer-events-auto rounded-l-2xl border-l border-y border-border/30 bg-black/40 backdrop-blur-md overflow-hidden flex items-center shadow-2xl">
    <OptionWheel
      items={[...SECTIONS]}
      defaultSelected={0}
      selected={activeSection >= 0 ? activeSection : 0}
      onChange={(index) => {
        // Prevent feedback loop if triggered by scroll sync
        if (index !== activeSectionRef.current) {
          handleNavClick(index);
        }
      }}
      side="right"
      fontSize={1.3}
      curve={1.3}
      tilt={10}
      inset={24}
      wheelPassthrough={true}
    />
  </div>
</div>
```

- [ ] **Step 2: Commit Global Side HUD integration**

```bash
git add src/app/page.tsx
git commit -m "feat(navigation): integrate global OptionWheel side HUD controller with bi-directional sync"
```

---

### Task 4: Verification & Build Check

**Files:**
- Build check

- [ ] **Step 1: Execute production build**

Run: `npm run build`
Expected: Build passes with 0 errors.

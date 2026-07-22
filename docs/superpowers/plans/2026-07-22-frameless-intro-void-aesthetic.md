# Frameless Void Aesthetic & Intro Style Site-Wide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicate wheel from IntroPanel and eliminate card box containers site-wide, establishing a unified frameless Void aesthetic matching the Intro section.

**Architecture:**
1. Remove embedded `OptionWheel` from `src/components/IntroPanel.tsx`.
2. Clean up card background borders/shadows/surfaces in `About` and `Services` sections in `src/app/page.tsx`, replacing them with frameless floating typography and 1px dividers.

**Tech Stack:** Next.js, React, Tailwind CSS.

## Global Constraints
- Pure `#000000` void aesthetic.
- Zero bulky card containers (`bg-surface/40`, `rounded-2xl`, `shadow-xl`).
- 1px thin dividers (`border-b border-border/30`).

---

### Task 1: Remove Duplicate OptionWheel from IntroPanel

**Files:**
- Modify: `src/components/IntroPanel.tsx:104-132`

**Interfaces:**
- Consumes: `IntroPanel` component
- Produces: Clean `IntroPanel` without inline `OptionWheel`.

- [ ] **Step 1: Remove OptionWheel JSX block from `IntroPanel.tsx`**

In `src/components/IntroPanel.tsx`, remove unused `OptionWheel` import and the embedded JSX block:
```tsx
// Remove import OptionWheel from './OptionWheel';
```
And remove lines 104-132.

- [ ] **Step 2: Commit IntroPanel cleanup**

```bash
git add src/components/IntroPanel.tsx
git commit -m "refactor(intro): remove duplicate inline OptionWheel widget"
```

---

### Task 2: Refactor About & Services Sections to Frameless Void Aesthetic

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `src/app/page.tsx`
- Produces: Frameless `About` and `Services` sections without card containers.

- [ ] **Step 1: Update `About` items in `src/app/page.tsx`**

Remove `rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 md:p-10 shadow-xl` classes from About items, replacing them with frameless containers:
```tsx
className="scroll-item min-w-[320px] w-[80vw] max-w-[500px] flex-none border-y border-border/30 py-6 md:py-8 flex flex-col justify-between"
```

- [ ] **Step 2: Update `Services` items in `src/app/page.tsx`**

Remove `rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 shadow-xl` classes from Services items, replacing them with frameless border-b rows:
```tsx
className="border-b border-border/30 pb-8 flex flex-col justify-between group"
```

- [ ] **Step 3: Commit frameless styling updates**

```bash
git add src/app/page.tsx
git commit -m "style(sections): apply frameless void aesthetic across About and Services sections"
```

---

### Task 3: Build Verification

**Files:**
- Build check

- [ ] **Step 1: Execute production build**

Run: `npm run build`
Expected: Build passes with 0 errors.

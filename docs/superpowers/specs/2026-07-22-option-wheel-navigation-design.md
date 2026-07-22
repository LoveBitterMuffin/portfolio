# OptionWheel Global Side HUD Navigation Design Specification

## Overview
This design specification defines the implementation of `OptionWheel` as a **Global Side HUD Controller ("Штурвал навигации")** across the entire website. 

Instead of replacing inline content within a single section, `OptionWheel` is anchored to the right side of the screen as a fixed, non-intrusive interactive controller. It provides bi-directional synchronization with the site's vertical/horizontal scrolling sections, while preserving the full horizontal scroll experience in `About` and the rich card representation in `Services`.

---

## 1. Architecture & Aesthetic Guidelines (Void Aesthetic)

### Visual HUD Styling
- **Position**: `fixed`, pinned to the right edge (`right-0`, vertically centered `top-1/2 -translate-y-1/2`).
- **Container**: `w-[260px] h-[360px] z-40 pointer-events-auto hidden md:flex`.
- **Background**: Pure `#000000` / transparent backdrop with 1px contour concentric guide rings (`rgba(255, 255, 255, 0.12)`).
- **Typography & Items**: Navigational sections: `['About', 'Experience', 'Services', 'Education', 'Contacts']`.
- **Selected Accent**: Crisp `#ffffff` text with zero blur, subtle HSL glow, and low-opacity blur on inactive section labels (`#a6a6a6`).

---

## 2. Bi-Directional Synchronization Logic

```
   [User Scrolls Page]  ──────IntersectionObserver─────>  Update OptionWheel Active Index
                                                                   │
                                                                   ▼
[User Rotates / Clicks Wheel] ────scrollIntoView()──────> Smooth Scroll to Target Section
```

1. **Page Scroll -> Wheel Rotation**:
   - The existing `IntersectionObserver` in `src/app/page.tsx` detects section entry (`about`, `experience`, `services`, `education`, `contacts`).
   - Updates `activeSection` state index (0 to 4).
   - `OptionWheel` receives prop or imperatively syncs position target so the wheel rotates smoothly to match page progress.

2. **Wheel Interaction -> Page Scroll**:
   - When the user drags, rotates mousewheel, or clicks an item on the `OptionWheel`, its `onChange(index)` callback fires.
   - Calls `handleNavClick(index)` which smoothly scrolls the viewport to `SECTIONS[index]` (`#about`, `#experience`, etc.).

---

## 3. Section Adjustments (`src/app/page.tsx`)

### Services Section (`#services`)
- Restored to a clean, highly readable layout displaying all services cards with deliverables, prices, and CTA buttons without replacing them with the wheel inside the section.

### About Section (`#about`)
- Horizontal scroll track is fully preserved with Three.js geometry morphing.

### Header Streamlining
- The fixed Header retains logo and CTA, seamlessly delegating section tracking to the floating `OptionWheel` HUD.

---

## 4. Verification Plan

### Automated Verification
- Next.js production build check (`npm run build`) to ensure 0 build errors.

### Manual Verification
- Scroll down the page vertically: confirm `OptionWheel` rotates in real-time to highlight active section.
- Click / rotate items on `OptionWheel`: confirm viewport smoothly scrolls to target section.
- Verify horizontal scroll track in `About` section works uninterrupted.

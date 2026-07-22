# Frameless Void Aesthetic & Duplicate Wheel Removal Design Specification

## Overview
This specification refines the portfolio UI by:
1. **Removing Duplicate Wheel**: Deleting the embedded `OptionWheel` from `IntroPanel.tsx` to eliminate redundancy with the global side `OptionWheel` HUD.
2. **Eliminating Card Containers ("Убрать вид карточек")**: Removing boxed card backgrounds (`bg-surface/40`, `backdrop-blur-xl`, `rounded-2xl`, `border border-border`, `shadow-xl`) across `About`, `Services`, `Experience`, and `Contacts`.
3. **Frameless Void Aesthetic (Intro-Style)**: Applying the clean, floating typography layout from `IntroPanel` site-wide, featuring:
   - High-contrast display typography (`font-display font-bold uppercase`).
   - Monospaced system indicators (`[STEP.0X/05]`, `[0X/03]`).
   - Thin 1px accent dividers (`border-b border-border/40` or `border-t border-border/40`).
   - Direct placement over the background canvas.

---

## 1. Intro Panel Refactoring (`src/components/IntroPanel.tsx`)
- Remove lines 104–132 containing the inline `<OptionWheel />` widget.
- Expand hero text area layout for full breathing room.

---

## 2. Frameless Section Styling (`src/app/page.tsx`)

### About Section (`#about`)
- Remove card boxes `rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 md:p-10 shadow-xl` from the 3 horizontal scroll items.
- Convert items into clean frameless floating panels with 1px top and bottom divider lines (`border-y border-border/30 py-6`).

### Services Section (`#services`)
- Remove card boxes `rounded-2xl border border-border bg-surface/40 backdrop-blur-xl p-8 shadow-xl`.
- Format services as minimal, frameless rows with left title/subtitle, right deliverables tags, and price badges separated by subtle 1px dashed or solid border lines (`border-b border-border/40 pb-8`).

---

## 3. Verification Plan
- **Build Check**: `npm run build` to verify zero TypeScript or Next.js build errors.
- **Visual Check**: Verify that `IntroPanel` has no duplicate wheel, global HUD handles section scrolling, and all sections display frameless floating text matching the Intro aesthetic.

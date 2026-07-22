# OptionWheel Scroll Rotation Fix

## Problem
The navigation wheel (OptionWheel component) was not rotating visually when scrolling through page sections. The wheel would only update when manually clicked or dragged, but not respond to page scroll events.

## Root Cause
1. The wheel was controlled by the `selected` prop, but it wasn't being updated based on scroll position
2. When the `selected` prop did change, the animation loop (`startLoop`) would not restart because it checked `if (rafRef.current != null) return;` and exited early if an animation was already running

## Solution

### 1. Added Scroll-Based Wheel Rotation
**File:** `src/app/page.tsx`

Added state and scroll listener to track the closest section to viewport center:

```typescript
// State to track wheel position based on scroll
const [wheelScrollIndex, setWheelScrollIndex] = useState(0);

// Scroll listener that finds closest section to center
useEffect(() => {
  const handleScroll = () => {
    const sections = SECTIONS.map(s => document.getElementById(s.toLowerCase())).filter(Boolean);
    if (sections.length === 0) return;

    let closestSection = -1;
    let closestDistance = Infinity;

    sections.forEach((section, index) => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top - window.innerHeight / 2);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSection = index;
      }
    });

    if (closestSection !== -1) {
      setWheelScrollIndex(closestSection);
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial call

  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

Updated OptionWheel to use scroll-based index:

```tsx
<OptionWheel
  items={[...SECTIONS]}
  defaultSelected={0}
  selected={wheelScrollIndex}  // Changed from activeSection
  onChange={(index) => {
    if (index !== activeSectionRef.current) {
      handleNavClick(index);
    }
  }}
  // ... other props
  wheelPassthrough={true}  // Allows page scroll to work
/>
```

### 2. Fixed Animation Loop Restart
**File:** `src/components/OptionWheel.jsx`

Modified `startLoop` to cancel and restart existing animation:

```javascript
const startLoop = useCallback(() => {
  if (rafRef.current != null) {
    // Cancel existing animation to restart with new target
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }
  lastRef.current = performance.now();
  rafRef.current = requestAnimationFrame(runFrame);
}, [runFrame]);
```

**Before:** The function would return early if `rafRef.current` was not null, preventing animation restart when the target changed.

**After:** The function now cancels any existing animation and starts a fresh one, ensuring the wheel animates to the new target position.

## Changes Summary

### Files Modified
1. `src/app/page.tsx` - Added scroll-based wheel rotation logic
2. `src/components/OptionWheel.jsx` - Fixed animation loop restart mechanism

### Key Improvements
- Wheel now rotates continuously as user scrolls through sections
- Page scrolling works normally (wheelPassthrough=true)
- Animation properly restarts when target changes
- Visual feedback matches current viewport position

## Configuration
- Wheel size: 420×500px (increased from 320×400px)
- Font size: 2.2rem (increased from 1.6rem)
- Inset: 60px (increased from 40px)
- Circle rings: Hidden (opacity: 0)
- Wheel passthrough: Enabled (allows page scroll)

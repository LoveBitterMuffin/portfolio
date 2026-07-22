# Dmitry Volkov — Interactive Portfolio

## Stack
- **Framework**: Next.js 14 (App Router)
- **3D Graphics**: Three.js (Vanilla TypeScript)
- **Animation**: GSAP + ScrollTrigger
- **Styling**: Tailwind CSS v4

## Commands
```bash
npm run dev    # Development server (Turbopack)
npm run build  # Production build
npm run start  # Production server
npm run lint   # ESLint check
```

## Architecture
Три изолированных сервиса управляются центральным оркестратором (page.tsx):
- `BackgroundGraphicsService` — Three.js WebGL частицы с морфингом
- `ScrollInterfaceService` — горизонтальный скролл через GSAP ScrollTrigger
- `VideoInteractionService` — видео-скруббинг и параллакс

## Deployment

### Vercel (Recommended)
```bash
npx vercel --prod
```

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Design System
- **Style**: Exaggerated Minimalism / White Digital Minimalism
- **Colors**: Monochromatic with single blue accent (#2563EB)
- **Typography**: Space Grotesk + JetBrains Mono
- **Motion**: 5-level animation system with reduced motion support

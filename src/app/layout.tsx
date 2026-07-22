import './globals.css';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { SkipLink } from '../components/SkipLink';
import { ThemeProvider } from '../contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'Дмитрий Волков — Full-Stack Developer & DevSecOps Engineer',
  description: 'Интерактивное портфолио: архитектура безопасности, эстетика кода, педагогика будущего. Разработка на Next.js, Three.js, GSAP.',
  keywords: ['Full-Stack Developer', 'DevSecOps', 'React', 'Next.js', 'Three.js', 'GSAP', 'портфолио'],
  authors: [{ name: 'Dmitry Volkov', url: 'https://github.com/LoveBitterMuffin' }],
  openGraph: {
    title: 'Дмитрий Волков — Full-Stack Developer & DevSecOps',
    description: 'Архитектура безопасности. Эстетика кода. Педагогика будущего.',
    type: 'website',
    locale: 'ru_RU',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ThemeProvider>
          <SkipLink />
          <main id="main-content">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

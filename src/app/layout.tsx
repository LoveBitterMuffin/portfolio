import './globals.css';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { SkipLink } from '../components/SkipLink';
import { ThemeProvider } from '../contexts/ThemeContext';
import { CookieConsent } from '../components/CookieConsent';

// Dynamic SEO metadata generation
export async function generateMetadata(): Promise<Metadata> {
  try {
    // Try to fetch SEO data from the API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/seo/sync`, {
      cache: 'force-cache', // Cache for 24 hours
      next: { revalidate: 86400 }, // Revalidate every 24 hours
    });

    if (response.ok) {
      const seoData = await response.json();
      
      if (seoData.success && seoData.data) {
        const { title, description, keywords, jsonLd } = seoData.data;

        return {
          title,
          description,
          keywords,
          authors: [{ name: 'Dmitry Volkov', url: 'https://github.com/LoveBitterMuffin' }],
          openGraph: {
            title,
            description,
            type: 'website',
            locale: 'ru_RU',
          },
          robots: {
            index: true,
            follow: true,
          },
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch SEO data, using fallback:', error);
  }

  // Fallback metadata
  return {
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
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Dmitry Volkov',
              jobTitle: 'Full-Stack Developer & DevSecOps Engineer',
              url: 'https://github.com/LoveBitterMuffin',
              sameAs: [
                'https://github.com/LoveBitterMuffin',
                'https://linkedin.com/in/dmitry-volkov-dev',
              ],
              knowsAbout: ['React', 'Next.js', 'DevSecOps', 'Three.js', 'GSAP'],
            }),
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SkipLink />
          <main id="main-content">{children}</main>
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}

import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Portfolio',
  description: 'Interactive portfolio',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

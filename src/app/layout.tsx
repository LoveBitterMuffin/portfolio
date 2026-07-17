import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Mouse Follow Video',
  description: 'GSAP Interactive Video',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

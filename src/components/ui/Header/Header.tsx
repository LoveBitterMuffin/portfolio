import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeSectionIndex: number;
  sections: readonly string[];
  onNavClick: (index: number) => void;
}

export function Header({ activeSectionIndex, sections, onNavClick }: HeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-300 px-4 md:px-8 lg:px-12"
      style={{
        height: '60px',
        background: activeSectionIndex < 0
          ? 'rgba(250,250,250,0)'
          : theme === 'light' ? 'rgba(250,250,250,0.85)' : 'rgba(9, 9, 11, 0.85)',
        backdropFilter: activeSectionIndex < 0
          ? 'blur(0px)'
          : 'blur(12px)',
        borderBottom: activeSectionIndex < 0
          ? '0.5px solid transparent'
          : '0.5px solid var(--color-border)',
      }}
    >
      <span
        className="font-mono tracking-widest uppercase"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', letterSpacing: '0.15em' }}
      >
        DV.SYS
      </span>

      {/* Desktop nav — hidden on mobile */}
      <nav
        aria-label="Section navigation"
        className="hidden md:flex gap-8 transition-all duration-300"
        style={{
          opacity: activeSectionIndex < 0 ? 0 : 1,
          pointerEvents: activeSectionIndex < 0 ? 'none' : 'auto',
          transform: activeSectionIndex < 0 ? 'translateY(-10px)' : 'translateY(0)',
        }}
      >
        {sections.map((name, i) => (
          <button
            key={name}
            onClick={() => onNavClick(i)}
            className="font-display font-medium transition-colors duration-200 uppercase"
            style={{
              fontSize: 'var(--text-sm)',
              color: activeSectionIndex === i
                ? 'var(--color-accent)'
                : 'var(--color-secondary)',
              letterSpacing: '0.05em',
              background: 'none',
              border: 'none',
              borderBottom: activeSectionIndex === i
                ? '1px solid var(--color-accent)'
                : '1px solid transparent',
              cursor: 'pointer',
              padding: '2px 0',
            }}
          >
            {name}
          </button>
        ))}
        <ThemeToggle />
      </nav>

      {/* Mobile hamburger button */}
      <div className="flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <button
          id="mobile-menu-toggle"
          className="flex flex-col gap-1.5 p-2"
        aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span
          style={{
            display: 'block', width: '20px', height: '1px',
            background: 'var(--color-primary)',
            transition: 'transform 0.2s',
            transform: mobileNavOpen ? 'rotate(45deg) translate(1.5px, 1.5px)' : 'none',
          }}
        />
        <span
          style={{
            display: 'block', width: '20px', height: '1px',
            background: 'var(--color-primary)',
            transition: 'opacity 0.2s',
            opacity: mobileNavOpen ? 0 : 1,
          }}
        />
        <span
          style={{
            display: 'block', width: '20px', height: '1px',
            background: 'var(--color-primary)',
            transition: 'transform 0.2s',
            transform: mobileNavOpen ? 'rotate(-45deg) translate(1.5px, -1.5px)' : 'none',
          }}
        />
      </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileNavOpen && (
        <nav
          aria-label="Mobile section navigation"
          className="md:hidden absolute top-[60px] left-0 right-0 flex flex-col"
          style={{
            background: theme === 'light' ? 'rgba(250,250,250,0.96)' : 'rgba(9, 9, 11, 0.96)',
            backdropFilter: 'blur(12px)',
            borderBottom: '0.5px solid var(--color-border)',
          }}
        >
          {sections.map((name, i) => (
            <button
              key={name}
              onClick={() => { onNavClick(i); setMobileNavOpen(false); }}
              className="font-display font-medium uppercase text-left"
              style={{
                fontSize: 'var(--text-sm)',
                color: activeSectionIndex === i ? 'var(--color-accent)' : 'var(--color-secondary)',
                letterSpacing: '0.05em',
                background: 'none',
                border: 'none',
                borderBottom: '0.5px solid var(--color-border)',
                cursor: 'pointer',
                padding: 'var(--space-4) var(--space-6)',
                width: '100%',
              }}
            >
              {name}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

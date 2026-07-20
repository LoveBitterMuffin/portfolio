import React, { ReactNode } from 'react';

interface SkillTagProps {
  children: ReactNode;
}

export function SkillTag({ children }: SkillTagProps) {
  return (
    <span 
      className="inline-flex cursor-default transition-colors duration-150"
      style={{
        border: '0.5px solid var(--color-border)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        padding: '4px 10px',
        background: 'transparent',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
    >
      {children}
    </span>
  );
}

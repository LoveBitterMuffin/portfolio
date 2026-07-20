import React, { ReactNode } from 'react';

interface CtaButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function CtaButton({ children, onClick, className = '', type = 'button' }: CtaButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`pointer-events-auto uppercase transition-all duration-250 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-primary hover:text-[var(--color-on-primary)] ${className}`}
      style={{
        border: '1px solid var(--color-primary)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        letterSpacing: '0.08em',
        padding: '12px 32px',
        outlineColor: 'var(--color-ring)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-primary)';
        e.currentTarget.style.color = 'var(--color-on-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'inherit';
      }}
    >
      {children}
    </button>
  );
}

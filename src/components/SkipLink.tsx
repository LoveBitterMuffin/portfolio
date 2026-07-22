'use client';

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        padding: '8px',
        background: 'var(--color-primary)',
        color: 'var(--color-on-primary)',
        zIndex: 100,
        transition: 'top 0.2s',
      }}
      onFocus={(e) => (e.currentTarget.style.top = '0')}
      onBlur={(e) => (e.currentTarget.style.top = '-40px')}
    >
      Перейти к основному содержимому
    </a>
  );
}

import React from 'react';

interface ScrollProgressIndicatorProps {
  progress: number;
  activeSection: number;
}

export function ScrollProgressIndicator({ progress, activeSection }: ScrollProgressIndicatorProps) {
  const stepLabel = `[STEP.0${activeSection + 1}/05]`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="relative h-px" style={{ background: 'var(--color-border)' }}>
        <div
          className="absolute top-0 left-0 h-full"
          style={{ 
            width: `${progress * 100}%`, 
            background: 'var(--color-primary)',
            transition: 'width 0.1s linear'
          }}
        />
      </div>
      <div
        className="absolute bottom-2 right-0 font-mono"
        style={{ 
          fontSize: 'var(--text-xs)',
          color: 'var(--color-secondary)', 
          padding: '12px 16px', 
          letterSpacing: 'var(--tracking-ui)' 
        }}
      >
        {stepLabel}
      </div>
    </div>
  );
}

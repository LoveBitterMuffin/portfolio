import React from 'react';

interface TimelineItemProps {
  period: string;
  role: string;
  place: string;
  details?: string[];
}

export function TimelineItem({ period, role, place, details }: TimelineItemProps) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: '0 var(--space-8)' }}>
      <div className="flex flex-col items-center">
        <div 
          className="rounded-full shrink-0" 
          style={{ width: '8px', height: '8px', background: 'var(--color-primary)', marginTop: '6px' }}
        />
        <div 
          className="border-l border-dashed"
          style={{ 
            borderColor: 'var(--color-border)', 
            height: 'calc(100% - 14px)',
            marginLeft: '3.5px' 
          }}
        />
      </div>
      <div className="pb-8">
        <p className="font-mono mb-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-secondary)' }}>{period}</p>
        <h3 className="font-display font-semibold mb-1" style={{ fontSize: 'var(--text-body)', color: 'var(--color-primary)' }}>{role}</h3>
        <p className="font-display mb-4" style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: 'var(--color-secondary)' }}>{place}</p>
        
        {details && details.length > 0 && (
          <ul className="list-disc pl-4 space-y-1">
            {details.map((detail, idx) => (
              <li key={idx} className="font-body leading-relaxed" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-foreground)' }}>
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

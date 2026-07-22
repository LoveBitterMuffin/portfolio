'use client';

import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:max-w-md z-50 p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/70 backdrop-blur-md shadow-2xl flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="font-display font-semibold text-lg text-[var(--color-primary)]">Уведомление об использовании Cookie</h3>
        <p className="text-sm text-[var(--color-secondary)]">
          Мы используем файлы cookie для улучшения работы сайта и аналитики. 
          Продолжая использовать сайт, вы даете согласие на обработку персональных данных (согласно 152-ФЗ).
        </p>
      </div>
      <div className="flex flex-row items-center gap-3 mt-2">
        <button 
          onClick={handleAccept}
          className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Принять
        </button>
        <a 
          href="/privacy" 
          className="text-sm text-[var(--color-secondary)] hover:text-[var(--color-primary)] underline-offset-4 hover:underline transition-colors"
        >
          Политика конфиденциальности
        </a>
      </div>
    </div>
  );
}

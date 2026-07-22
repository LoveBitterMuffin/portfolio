'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface EstimateConfig {
  siteType: 'landing' | 'webapp';
  uiUx: 'template' | 'custom';
  aiChatbot: boolean;
  devSecOps: 'base' | 'pro';
}

interface PriceResult {
  price: number;
  timeline: string;
}

const PRICING = {
  siteType: { landing: 50000, webapp: 150000 },
  uiUx: { template: 0, custom: 80000 },
  aiChatbot: { true: 50000, false: 0 },
  devSecOps: { base: 30000, pro: 80000 },
};

const TIMELINES = {
  landing: { base: '2-3 недели', pro: '3-4 недели' },
  webapp: { base: '4-6 недель', pro: '6-8 недель' },
};

export default function EstimateCalculator() {
  const [config, setConfig] = useState<EstimateConfig>({
    siteType: 'landing',
    uiUx: 'template',
    aiChatbot: false,
    devSecOps: 'base',
  });

  const priceRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<HTMLSpanElement>(null);
  const prevPriceRef = useRef(0);

  const calculatePrice = (): PriceResult => {
    const basePrice = PRICING.siteType[config.siteType];
    const uiUxPrice = PRICING.uiUx[config.uiUx];
    const aiPrice = PRICING.aiChatbot[config.aiChatbot as keyof typeof PRICING.aiChatbot];
    const devSecOpsPrice = PRICING.devSecOps[config.devSecOps];

    const totalPrice = basePrice + uiUxPrice + aiPrice + devSecOpsPrice;
    
    const timeline = TIMELINES[config.siteType][config.devSecOps];

    return { price: totalPrice, timeline };
  };

  const { price, timeline } = calculatePrice();

  // GSAP CountUp animation
  useGSAP(() => {
    if (priceRef.current && price !== prevPriceRef.current) {
      gsap.to(priceRef.current, {
        innerText: price,
        duration: 1,
        ease: 'power2.out',
        snap: { innerText: 1 },
        onUpdate: function () {
          if (priceRef.current) {
            priceRef.current.innerText = Math.round(this.targets()[0].innerText).toLocaleString('ru-RU');
          }
        },
      });
      prevPriceRef.current = price;
    }
  }, [price]);

  const handleSendEstimate = () => {
    const configText = `
Конфигурация проекта:
• Тип сайта: ${config.siteType === 'landing' ? 'Landing Page' : 'Web Application'}
• UI/UX: ${config.uiUx === 'template' ? 'Шаблонное решение' : 'Кастомный дизайн'}
• ИИ/Чат-бот: ${config.aiChatbot ? 'Да' : 'Нет'}
• DevSecOps: ${config.devSecOps === 'base' ? 'Базовый' : 'Pro'}

Ориентировочная стоимость: ${price.toLocaleString('ru-RU')} ₽
Сроки: ${timeline}
    `.trim();

    const mailtoLink = `mailto:volkov.dmitry.dev@example.com?subject=Запрос на смету проекта&body=${encodeURIComponent(configText)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleSendTelegram = () => {
    const configText = `
📋 *Конфигурация проекта*
• Тип сайта: ${config.siteType === 'landing' ? 'Landing Page' : 'Web Application'}
• UI/UX: ${config.uiUx === 'template' ? 'Шаблонное решение' : 'Кастомный дизайн'}
• ИИ/Чат-бот: ${config.aiChatbot ? '✅ Да' : '❌ Нет'}
• DevSecOps: ${config.devSecOps === 'base' ? 'Базовый' : 'Pro'}

💰 *Ориентировочная стоимость:* ${price.toLocaleString('ru-RU')} ₽
⏱ *Сроки:* ${timeline}
    `.trim();

    const telegramLink = `https://t.me/LoveBitterMuffin?text=${encodeURIComponent(configText)}`;
    window.open(telegramLink, '_blank');
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <p className="font-mono text-xs mb-4 tracking-widest uppercase text-secondary animate-entrance">
        [STEP.03/05] — Services & Solutions
      </p>
      <h2 className="font-display font-bold uppercase mb-16 text-primary animate-entrance" style={{ fontSize: 'var(--text-h1)' }}>
        Калькулятор сметы
      </h2>

      <div className="border border-border/30 rounded-lg p-8 bg-surface/30 backdrop-blur-sm">
        {/* Site Type */}
        <div className="mb-8">
          <label className="font-display text-sm uppercase tracking-wider text-primary mb-4 block">
            Тип сайта
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setConfig({ ...config, siteType: 'landing' })}
              className={`flex-1 py-3 px-4 border transition-all duration-300 font-mono text-sm uppercase tracking-wider ${
                config.siteType === 'landing'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-secondary hover:border-primary/50'
              }`}
            >
              Landing Page
            </button>
            <button
              onClick={() => setConfig({ ...config, siteType: 'webapp' })}
              className={`flex-1 py-3 px-4 border transition-all duration-300 font-mono text-sm uppercase tracking-wider ${
                config.siteType === 'webapp'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-secondary hover:border-primary/50'
              }`}
            >
              Web Application
            </button>
          </div>
        </div>

        {/* UI/UX */}
        <div className="mb-8">
          <label className="font-display text-sm uppercase tracking-wider text-primary mb-4 block">
            UI/UX Дизайн
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setConfig({ ...config, uiUx: 'template' })}
              className={`flex-1 py-3 px-4 border transition-all duration-300 font-mono text-sm uppercase tracking-wider ${
                config.uiUx === 'template'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-secondary hover:border-primary/50'
              }`}
            >
              Шаблон
            </button>
            <button
              onClick={() => setConfig({ ...config, uiUx: 'custom' })}
              className={`flex-1 py-3 px-4 border transition-all duration-300 font-mono text-sm uppercase tracking-wider ${
                config.uiUx === 'custom'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-secondary hover:border-primary/50'
              }`}
            >
              Кастом
            </button>
          </div>
        </div>

        {/* AI/Chatbot */}
        <div className="mb-8">
          <label className="font-display text-sm uppercase tracking-wider text-primary mb-4 block">
            ИИ/Чат-бот
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setConfig({ ...config, aiChatbot: true })}
              className={`flex-1 py-3 px-4 border transition-all duration-300 font-mono text-sm uppercase tracking-wider ${
                config.aiChatbot
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-secondary hover:border-primary/50'
              }`}
            >
              Да
            </button>
            <button
              onClick={() => setConfig({ ...config, aiChatbot: false })}
              className={`flex-1 py-3 px-4 border transition-all duration-300 font-mono text-sm uppercase tracking-wider ${
                !config.aiChatbot
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-secondary hover:border-primary/50'
              }`}
            >
              Нет
            </button>
          </div>
        </div>

        {/* DevSecOps */}
        <div className="mb-8">
          <label className="font-display text-sm uppercase tracking-wider text-primary mb-4 block">
            DevSecOps
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setConfig({ ...config, devSecOps: 'base' })}
              className={`flex-1 py-3 px-4 border transition-all duration-300 font-mono text-sm uppercase tracking-wider ${
                config.devSecOps === 'base'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-secondary hover:border-primary/50'
              }`}
            >
              База
            </button>
            <button
              onClick={() => setConfig({ ...config, devSecOps: 'pro' })}
              className={`flex-1 py-3 px-4 border transition-all duration-300 font-mono text-sm uppercase tracking-wider ${
                config.devSecOps === 'pro'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-secondary hover:border-primary/50'
              }`}
            >
              Pro
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="border-t border-border/40 pt-8 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-mono text-xs text-secondary uppercase tracking-wider mb-1">
                Ориентировочная стоимость
              </p>
              <p className="font-display font-bold text-primary" style={{ fontSize: 'var(--text-h2)' }}>
                <span ref={priceRef}>0</span> ₽
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-secondary uppercase tracking-wider mb-1">
                Сроки выполнения
              </p>
              <p ref={timelineRef} className="font-display font-bold text-accent" style={{ fontSize: 'var(--text-h3)' }}>
                {timeline}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSendEstimate}
              className="flex-1 py-3 px-6 bg-primary text-secondary font-mono text-sm uppercase tracking-wider hover:bg-accent transition-colors duration-300"
            >
              Отправить смету (Email)
            </button>
            <button
              onClick={handleSendTelegram}
              className="flex-1 py-3 px-6 border border-primary text-primary font-mono text-sm uppercase tracking-wider hover:bg-primary hover:text-secondary transition-colors duration-300"
            >
              Telegram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

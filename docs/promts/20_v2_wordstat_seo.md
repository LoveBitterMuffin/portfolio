# Задача 20: Wordstat SEO Auto-Updater (ИИ-модуль)

Реализация фонового автоматического обновления SEO-тегов сайта с помощью Яндекс.Вордстат и ИИ.

**Шаги выполнения:**
1. Создай серверный модуль `src/services/WordstatSeoService.ts`.
2. Реализуй функцию получения релевантных запросов (например, "devsecops engineer", "react developer") — используй mock или парсер.
3. Добавь вызов Gemini API, который принимает контент сайта и новые ключевые слова, и генерирует оптимальные Title, Description и JSON-LD (Schema.org).
4. Напиши API-роут `src/app/api/seo/sync/route.ts` для триггера обновления (можно добавить поддержку cron/Vercel Cron).
5. Настрой обновление SEO-тегов в `layout.tsx` (используя кэшированный JSON результат).
6. Сделай коммит: `git commit -am "feat: wordstat seo ai updater"`.

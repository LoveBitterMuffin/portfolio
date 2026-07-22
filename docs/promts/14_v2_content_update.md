# Задача 14: Обновление контента (Full-Stack & DevSecOps)

Твоя задача — привести контент сайта в соответствие с новой концепцией (удаление репетиторства, акцент на DevSecOps).

**Шаги выполнения:**
1. Открой `src/data/content.json` и `docs/CONTENT.md`.
2. Удали блок `Репетиторство ЕГЭ` из секции `experience`.
3. В услугах (`services`) замени репетиторство на `Аудит безопасности & Код-ревью`.
4. Обнови `tagline` в Intro на: `Архитектура безопасных систем. Бескомпромиссная эстетика фронтенда & DevSecOps.`.
5. Дополни опыт `Freelance Web Developer / DevSecOps Engineer` актуальным стеком (Kubernetes, CI/CD, OWASP).
6. Убедись, что типы в `src/types/content.ts` (если они там есть) не сломались из-за изменения полей.
7. Сделай коммит: `git commit -am "chore: remove tutoring and update positioning"`.

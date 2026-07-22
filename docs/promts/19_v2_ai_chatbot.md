# Задача 19: ИИ Чат-бот («Cyber Assistant»)

Интеграция LLM помощника для пользователей сайта.

**Шаги выполнения:**
1. Создай API-роут `src/app/api/chat/route.ts` (Next.js App Router).
2. Настрой интеграцию с Gemini API (или OpenAI) используя `@google/genai` (или `ai` Vercel SDK).
3. Заложи системный промпт (информация о Дмитрии: опыт, цены, контакты из `content.json`).
4. Создай клиентский UI-компонент `src/components/AiChatbotWidget.tsx` (Glassmorphic дизайн, фиксированное позиционирование внизу-справа).
5. Добавь анимацию открытия/закрытия чата с помощью GSAP.
6. Вставь компонент в `src/app/layout.tsx`.
7. Сделай коммит: `git commit -am "feat: ai chatbot assistant integration"`.

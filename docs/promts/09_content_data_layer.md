# Промт 9: Структура данных контента и секции (Content Data Layer)

## Задача
Преобразовать контент из [CONTENT.md](file:///c:/mp/portfolio/docs/CONTENT.md) в типизированный JSON-файл данных и TypeScript-интерфейсы. Подключить данные к компонентам всех 5 секций портфолио.

## Контекст и файлы
*   **Источник контента**: [CONTENT.md](file:///c:/mp/portfolio/docs/CONTENT.md) (Секции 0–4)
*   **Дизайн секций**: [DESIGN.md](file:///c:/mp/portfolio/docs/DESIGN.md) (Разделы 5 и 8)
*   **Оркестратор**: [page.tsx](file:///c:/mp/portfolio/src/app/page.tsx)

## Инструкции по реализации

### 1. TypeScript-типы (`src/types/content.ts`)
Определите строго типизированные интерфейсы для каждой секции контента:

```typescript
export interface EducationItem {
  institution: string;
  specialty: string;
  description: string;
}

export interface ExperienceItem {
  role: string;
  place?: string;
  period?: string;
  details?: string[];
}

export interface SkillGroup {
  title: string;
  items: string[];
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string; // имя иконки Lucide/Heroicons
}

export interface PortfolioContent {
  intro: {
    name: string;
    role: string;
    tagline: string;
    ctaText: string;
  };
  education: {
    sectionTitle: string;
    items: EducationItem[];
  };
  experience: {
    sectionTitle: string;
    items: ExperienceItem[];
  };
  about: {
    sectionTitle: string;
    skillGroups: SkillGroup[];
    bio: string;
  };
  contacts: {
    sectionTitle: string;
    email: string;
    social: SocialLink[];
    formPlaceholders: {
      name: string;
      email: string;
      message: string;
    };
    footerNote: string;
  };
}
```

### 2. JSON-файл данных (`src/data/content.json`)
Создайте файл на основе [CONTENT.md](file:///c:/mp/portfolio/docs/CONTENT.md):

```json
{
  "intro": {
    "name": "ДМИТРИЙ ВОЛКОВ",
    "role": "FULL-STACK DEVELOPER & DEVSECOPS ENGINEER",
    "tagline": "Архитектура безопасности. Эстетика кода. Педагогика будущего.",
    "ctaText": "Исследовать систему"
  },
  "education": {
    "sectionTitle": "ОБРАЗОВАНИЕ // ACADEMIC BACKGROUND",
    "items": [
      {
        "institution": "МТУСИ им. Ордена Красного Знамени",
        "specialty": "DevSecOps Engineering",
        "description": "Глубокая инженерная подготовка в области безопасной разработки, оркестрации контейнеров и защиты инфраструктуры. Синтез Linux-администрирования и практик CI/CD."
      },
      {
        "institution": "Московский городской педагогический университет (МГПУ)",
        "specialty": "Коррекционная педагогика",
        "description": "Навыки адаптивной коммуникации. Умение декомпозировать сложные технические концепции для аудитории с разным уровнем подготовки."
      },
      {
        "institution": "Колледж",
        "specialty": "Оператор электронного набора и вёрстки",
        "description": "Фундаментальная база в полиграфическом дизайне, работе с Adobe Illustrator, Photoshop и принципах композиционной верстки."
      }
    ]
  },
  "experience": {
    "sectionTitle": "ОПЫТ // PROFESSIONAL TRAJECTORY",
    "items": [
      {
        "role": "Педагог дополнительного образования",
        "place": "ГБОУ ДО ДТДиМ \"Севастополец\"",
        "period": "202X – Наст. время",
        "details": [
          "Frontend-мастерская: React, Next.js, Tailwind CSS.",
          "Backend-мастерская: Node.js, базы данных, API.",
          "Кружки: Визуальное программирование, ИИ в действии, Компьютерная грамотность."
        ]
      },
      {
        "role": "Репетитор ЕГЭ по информатике",
        "details": ["Подготовка к экзаменам, алгоритмизация, разбор задач высокой сложности."]
      },
      {
        "role": "Freelance Web Developer",
        "details": ["Полный цикл разработки веб-приложений. От прототипа в Figma до деплоя на Kubernetes. Оптимизация Core Web Vitals, SEO-аудит, автоматизация тестирования."]
      }
    ]
  },
  "about": {
    "sectionTitle": "НАВЫКИ // TECHNICAL ARSENAL",
    "skillGroups": [
      {
        "title": "Frontend Core",
        "items": ["React", "Next.js", "Angular", "Tailwind CSS", "GSAP", "Three.js", "Figma"]
      },
      {
        "title": "Backend & DevSecOps",
        "items": ["Docker", "Kubernetes", "Linux", "GitHub Actions", "GitLab CI", "OWASP", "Vault"]
      },
      {
        "title": "Soft Skills",
        "items": ["Преподавание и менторство", "Адаптивная коммуникация", "Аналитическое мышление"]
      }
    ],
    "bio": "Я объединяю строгость инженерной безопасности с гибкостью современного фронтенда. Мой подход — это не просто написание кода, а создание отказоустойчивых, быстрых и визуально совершенных цифровых продуктов."
  },
  "contacts": {
    "sectionTitle": "СВЯЗЬ // INITIATE CONNECTION",
    "email": "volkov.dmitry.dev@example.com",
    "social": [
      { "label": "GitHub", "href": "https://github.com/LoveBitterMuffin", "icon": "github" },
      { "label": "LinkedIn", "href": "https://linkedin.com/in/dmitry-volkov-dev", "icon": "linkedin" },
      { "label": "Telegram", "href": "https://t.me/LoveBitterMuffin", "icon": "send" }
    ],
    "formPlaceholders": {
      "name": "Ваше имя",
      "email": "Ваш email",
      "message": "Сообщение..."
    },
    "footerNote": "© 2026 Dmitry Volkov. Built with Next.js, GSAP & Three.js. System Status: ONLINE"
  }
}
```

### 3. Хелпер-утилита импорта (`src/data/getContent.ts`)
```typescript
import content from './content.json';
import type { PortfolioContent } from '@/types/content';

export const getContent = (): PortfolioContent => content as PortfolioContent;
```

### 4. Верстка компонентов секций
Создайте или обновите компоненты для каждой из 5 секций (`src/components/sections/`):

*   **`IntroSection.tsx`**: Использует `content.intro`. Отображает `name` через `--text-hero` (700 weight, `letter-spacing: -0.05em`), `role` через `--text-h3` (uppercase, `letter-spacing: 0.1em`), `tagline` и кнопку `<CtaButton>`.
*   **`EducationSection.tsx`**: Использует `content.education.items`. Для каждого элемента — карточка с заголовком `specialty` (font-display, bold) и описанием (font-body).
*   **`ExperienceSection.tsx`**: Использует `content.experience.items`. Отображает список через компоненты `<TimelineItem>`.
*   **`AboutSection.tsx`**: Использует `content.about`. Для каждой группы навыков — блок с заголовком и набором `<SkillTag>`, под ними — `bio`-текст.
*   **`ContactsSection.tsx`**: Использует `content.contacts`. Отображает email, список `social`-ссылок с иконками Lucide, простую форму обратной связи, `footerNote`.

### 5. Форма контактов (`ContactsSection.tsx`)
Реализуйте HTML-форму без серверного обработчика:
*   `action="mailto:{email}"` или `action="https://formspree.io/..."` (заглушка).
*   Поля: `<input name="name">`, `<input name="email" type="email">`, `<textarea name="message">`.
*   Стили: `border: 0.5px solid var(--color-border); background: transparent; padding: var(--space-3) var(--space-4); font-family: var(--font-body)`.
*   Кнопка отправки: `<CtaButton type="submit">Отправить</CtaButton>`.
*   Focus-видимость на всех полях: `outline: 2px solid var(--color-ring); outline-offset: 2px`.

## Критерии приемки
1. Файл `src/data/content.json` содержит все данные в соответствии с контентом [CONTENT.md](file:///c:/mp/portfolio/docs/CONTENT.md).
2. TypeScript-типы в `src/types/content.ts` покрывают всю структуру данных без `any`.
3. Каждая из 5 секций рендерится с корректным контентом и не содержит хардкода строк прямо в компонентах.
4. Форма контактов имеет корректные поля и стилизована в соответствии с дизайн-системой.
5. Иконки соцсетей реализованы через SVG (Lucide/Heroicons), без emoji.

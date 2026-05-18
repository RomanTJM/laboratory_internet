# Роман Рябченко — Portfolio Landing

Лендинг-презентация Frontend-разработчика. Тёмная тема, плавные анимации, рабочая форма обратной связи с AI-ответом через Google Gemini API.

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | Vanilla TypeScript, SCSS (BEM), HTML5 |
| Bundler | Vite 5 |
| Backend/API | Vercel Serverless Functions (Node.js / TypeScript) |
| Email | Nodemailer + SMTP (Gmail / любой провайдер) |
| AI | Google Gemini API (`gemini-1.5-flash`) |
| Deploy | Vercel |

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
git clone https://github.com/RomanTJM/portfolio_landing
cd portfolio-landing
npm install
```

### 2. Настроить переменные окружения

```bash
cp .env
```

Заполнить `.env`:

| Переменная | Значение |
|-----------|---------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | ваш Gmail |
| `SMTP_PASS` | App Password (не пароль от аккаунта) |
| `TO_EMAIL` | куда получать заявки |
| `GEMINI_API_KEY` | ключ с [aistudio.google.com](https://aistudio.google.com) — бесплатно |

> **Gmail App Password**: Google Account → Безопасность → Двухэтапная проверка → Пароли приложений.

> **Gemini API Key**: [aistudio.google.com](https://aistudio.google.com) → Get API key — бесплатно, без карты.

### 3. Запустить локально

```bash
# Frontend (localhost:3000) + API (localhost:3002) одновременно
npm run dev:all
```

Отдельно по необходимости:
```bash
npm run dev      # только Vite frontend
npm run dev:api  # только API-сервер (tsx api/server.dev.ts)
```

### 4. Сборка и деплой

```bash
# Проверить сборку локально
npm run build

# Деплой на Vercel
vercel --prod
```

При деплое на Vercel добавить env-переменные в `Settings → Environment Variables`.

## Структура проекта

```
portfolio-landing/
├── api/
│   ├── contact.ts          # Serverless function: валидация, Nodemailer, Gemini AI
│   └── server.dev.ts       # Локальный dev-сервер для API (порт 3002)
├── src/
│   ├── main.ts             # Точка входа: nav, scroll-анимации, инициализация
│   ├── modules/
│   │   ├── form.ts         # Форма: валидация, fetch, состояния loading/success/error
│   │   └── typed.ts        # Typewriter-эффект на hero
│   └── styles/
│       ├── main.scss       # Импорты всех partial
│       ├── _variables.scss # CSS custom properties (цвета, отступы, радиусы)
│       ├── _reset.scss     # Reset + базовые компоненты (btn, tag, container)
│       ├── _animations.scss
│       ├── _nav.scss
│       ├── _hero.scss
│       ├── _about.scss
│       ├── _work.scss
│       ├── _cases.scss
│       ├── _contact.scss
│       ├── _form.scss
│       └── _footer.scss
├── index.html
├── vite.config.ts
├── tsconfig.json
└── vercel.json
```

## Как реализована форма

**Клиент (`src/modules/form.ts`):**
1. Валидация в реальном времени (`blur` + `input`) — required, email regex, phone regex
2. `fetch('/api/contact')` с JSON-телом
3. Три состояния кнопки: idle / loading (спиннер) / disabled
4. Статус-блок: success (зелёный) / error (красный) с текстом из API
5. Защита от non-JSON ответов (404 HTML → понятное сообщение об ошибке)

**API (`api/contact.ts`):**
1. Проверка метода (только POST)
2. Серверная валидация полей (required, email regex, phone regex)
3. Вызов Gemini API → персонализированный текст подтверждения
4. Параллельная отправка двух писем через Nodemailer:
   - Владельцу — данные формы в HTML-таблице
   - Пользователю — копия с AI-сгенерированным ответом
5. Graceful degradation: если Gemini недоступен (лимит, нет ключа) — используется fallback-текст, письма всё равно уходят

## AI-интеграция

Использован **Google Gemini** (`gemini-1.5-flash`) — быстрая модель с бесплатным уровнем.

**Сценарий:** при отправке формы API вызывает Gemini с промптом, передавая имя и комментарий пользователя. Gemini генерирует персонализированный ответ на языке сообщения (RU/EN). Ответ:
- включается в email-копию пользователю
- возвращается фронтенду и отображается в success-уведомлении

**Graceful degradation:** ошибка AI (quota, недоступность) перехватывается, подставляется шаблонный текст — форма работает в любом случае.

## Что делалось с помощью ИИ

- Генерация структуры компонентов и имён классов (BEM)
- Написание SCSS-стилей по дизайн-токенам
- Написание TypeScript-модулей (`typed.ts`, `form.ts`)
- Serverless-функция: шаблоны HTML-писем, `escapeHtml`
- Шаблон промпта для Gemini
- Написание README

## Что исправлялось вручную

- Доводил CSS-анимации (`float-glow`, курсор) до нужного ощущения
- Настройка `IntersectionObserver`: `threshold` и `rootMargin` для корректного срабатывания на мобильных
- Проверка корректности TypeScript-типов для `VercelRequest` / `VercelResponse`
- Адаптивные breakpoints: сетки 2→1 колонка, скрытие code-block на мобильных
- HTML-семантика: `aria-label`, `role="alert"`, `aria-live`, `aria-expanded`
- Смена AI-провайдера: изначально Anthropic Claude, переключился на Google Gemini (бесплатный ключ)
- Исправлял конфликт портов между Vite и dev API-сервером
- Добавлял `strictPort: true` в Vite и Vite-прокси на локальный API
- Обновил модель с `gemini-2.0-flash` (нет на free tier) на `gemini-1.5-flash`

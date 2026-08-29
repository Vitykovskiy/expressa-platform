---
title: Быстрый старт standalone E2E
description: Установка и запуск Playwright-набора Expressa.
type: guide
area: e2e
status: active
tags: [e2e, playwright, setup]
---

# Быстрый старт

```bash
npm ci
cp .env.example .env.e2e.local
```

В `.env.e2e.local` укажи адреса отдельно запущенных интерфейсов:

```dotenv
E2E_FRONT_OFFICE_URL=http://localhost:5173
E2E_BACK_OFFICE_URL=http://localhost:5174
```

Обе переменные обязательны. Каждая принимает только абсолютный HTTP(S)-адрес без credentials, query и fragment. Файл `.env.e2e.local` не попадает в Git.

```bash
npm run typecheck:e2e
npm run e2e
```

Пакет не запускает и не собирает front-office или back-office. До появления предметных specs команда `npm run e2e` завершится без тестов; это штатное состояние стартового каркаса.

---
title: Проверки back-office
type: guide
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../package.json
  - ../../tests/e2e/app.e2e.ts
  - ../../tests/e2e/auth.e2e.ts
  - ../../tests/e2e/catalog.e2e.ts
  - ../../tests/e2e/orders.e2e.ts
  - ../../../.github/workflows/back-office-ci.yml
---

# Проверки

Этот раздел описывает проверки рабочего PWA: качество исходного кода, тесты,
production-сборку, OpenAPI-снимок и браузерные сценарии.

## Структура каталога

```text
95-testing/
└── README.md          # команды, уровни проверок и E2E-сценарии
```

## Команды

`package.json` — источник истины для команд.

```sh
npm run format:check  # проверка форматирования
npm run lint          # статический анализ
npm run typecheck     # проверка TypeScript и Vue-шаблонов
npm test -- --run     # unit и компонентные тесты
npm run build         # production-сборка
npm run contract:check # совпадение OpenAPI-снимка с backend
```

## Браузерные сценарии

- `npm run test:e2e` собирает приложение и запускает
  [app.e2e.ts](../../tests/e2e/app.e2e.ts): перенаправление на вход, адаптивный
  экран входа и PWA-артефакты production-сборки.
- Команда CI для [auth.e2e.ts](../../tests/e2e/auth.e2e.ts):
  `VITE_APP_ENV=development VITE_API_BASE_URL=http://127.0.0.1:3000 npm run build && PLAYWRIGHT_TARGET=auth npx playwright test --project=auth-e2e`.
- `npm run test:catalog:e2e` запускает
  [catalog.e2e.ts](../../tests/e2e/catalog.e2e.ts): управление каталогом и его
  отображение в публичном меню.
- Команда CI для [orders.e2e.ts](../../tests/e2e/orders.e2e.ts):
  `npx playwright test --config=playwright.orders.config.ts`.

## Межконтурные зависимости

- `app.e2e.ts` проверяет только production-сборку back-office.
- `auth.e2e.ts` поднимает backend и PostgreSQL.
- `catalog.e2e.ts` также собирает и запускает front-office.
- `orders.e2e.ts` запускает backend, front-office и back-office.

Перед тремя последними сценариями установите зависимости в нужных контурах:
back-office, backend и, где требуется, front-office.

Эти команды выполняет [workflow back-office](../../../.github/workflows/back-office-ci.yml).

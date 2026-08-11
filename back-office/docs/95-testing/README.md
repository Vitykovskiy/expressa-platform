---
title: Проверки back-office
type: guide
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../tests/e2e/auth.e2e.ts
  - ../../tests/e2e/catalog.e2e.ts
---

# Проверки

`package.json` — источник команд. `format:check`, `lint`, `typecheck`, `test -- --run` и `build` проверяют runtime; `contract:check` сверяет OpenAPI-снимок. `test:e2e` проверяет приложение, `test:catalog:e2e` — каталог с test backend. `storybook:build` собирает каталог и проверяет reference; `test:storybook`, `test:storybook:screenshots`, `test:a11y`, `test:visual` проверяют интеракции, снимки, доступность и визуальные эталоны. Источники: [package.json](../../package.json), [app E2E](../../tests/e2e/app.e2e.ts), [catalog E2E](../../tests/e2e/catalog.e2e.ts), [storybook tests](../../.storybook/tests/).

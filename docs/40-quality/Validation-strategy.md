---
title: Стратегия проверки UI
description: Обязательные уровни проверки UI front-office и back-office.
type: strategy
area: quality
status: active
tags: [quality, testing, playwright]
updated: 2026-08-02
---

# Стратегия проверки UI

Стратегия задаёт текущий нормативный стандарт для всего UI-кода `front-office`
и `back-office`, а не отчёт об уже выполненных тестах. Клиенты остаются
автономными; Storybook односторонне использует runtime UI по
[[../20-architecture/Client-architecture|архитектуре клиентов]] и
[[../20-architecture/Repository-boundaries|границам приложений]]. Барьеры
состояний и публикации определяет [[../50-interfaces/Storybook-gates|Storybook]].
Требования доступности определяет [[UI-accessibility|профильная нота]].

## Обязательные уровни

- В каждом изолированном npm-проекте выполняются сборка, typecheck и lint.
- Модульные тесты покрывают логику с самостоятельными входами и выходами.
- Интерактивные и доступностные проверки Storybook покрывают применимые
  состояния историй.
- Playwright в реальном браузере проверяет ключевые пользовательские потоки и
  наблюдаемый вид.
- UI-проверки выполняются в границах [[UI-accessibility|требований
  доступности]].

## Ширины браузера

Для зависящих от ширины экранов и компонентов обязательны `479`, `480`, `767`,
`768`, `1023` и `1024` px. Дополнительно сохраняются контрольные ширины
Storybook: `320`, `390`, `768` px для front-office и `768`, `1280`, `1440` px
для back-office.

## Команды и подтверждение

Команды берутся только из фактических `package.json`: `npm run format:check`,
`npm run lint`, `npm run typecheck`, `npm run build`, `npm run storybook:build`,
`npm run test`, `npm run test:a11y`, `npm run test:visual` и `npm run test:e2e`
— если они применимы к изменению. Имена интерактивных проверок Storybook различаются:
`npm run storybook:test` в front-office и `npm run test:storybook` в
back-office.

`npm run format:check` обязателен в обоих проектах. Результаты обязательных
проверок и готовность к выпуску фиксируются по
[[../95-testing/Release-verification|проверке готовности и выпуска]].

Сначала UI получает визуальное одобрение, затем добавляются новые
автоматизированные тесты; существующие проверки не удаляются.

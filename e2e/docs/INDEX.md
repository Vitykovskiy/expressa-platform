---
title: Документация standalone E2E Expressa
description: Главная карта UI-only Playwright E2E-набора.
type: index
area: e2e
status: active
tags: [e2e, playwright, moc]
---

# Документация standalone E2E Expressa

Набор проверяет два отдельно запущенных пользовательских интерфейса Expressa через браузер. Исходный код приложений, их локальные E2E-наборы и инфраструктура запуска принадлежат соответствующим контурам.

## Текущее устройство

- [Быстрый старт](10-overview/Quick-start.md) — установка и запуск.
- [Архитектура](20-architecture/INDEX.md) — UI-only граница и принятые решения.
- [Соглашения](80-conventions/INDEX.md) — правила Playwright, TypeScript и критерии готовности.
- [Тестирование](95-testing/INDEX.md) — карта сценариев, их подробные описания и исполняемые journeys.

## Первичные источники и поставка

- [Конфигурация Playwright](../playwright.config.ts), [fixtures](../fixtures/test.ts) и [конфигурация окружения](../support/config/e2e-environment.ts) — исполняемая граница набора.
- [Сквозной сценарий](../specs/journeys/journey-05-full-order-lifecycle.spec.ts) и [проверка границ](../tools/check-e2e-boundaries.mjs) — сценарии и локальная приёмка.
- [Результаты прогонов](../../docs/70-deployment/E2E-on-VPS.md) — постоянный Playwright report на VPS и журнал запусков GitHub Actions.

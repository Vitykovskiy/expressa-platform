---
title: ADR-001 — Архитектура standalone E2E
description: UI-only архитектура Playwright-набора Expressa.
type: adr
area: e2e
status: accepted
sources:
  - ../../../playwright.config.ts
  - ../../../fixtures/test.ts
related:
  - ../../10-overview/Quick-start.md
  - ../../80-conventions/Code-style.md
---

# ADR-001 — Архитектура standalone E2E

## Статус

Решение принято.

## Контекст

Сквозная проверка Q-E2E должна связывать пользовательские действия в front-office и back-office, не смешивая runtime-код клиентов с общим набором. Оба интерфейса поставляются и запускаются вне `e2e`.

## Решение

- Набор использует Playwright Test с одним проектом Chromium, одним worker, без retries, HTML-отчётом и screenshot только при ошибке.
- `E2E_FRONT_OFFICE_URL` и `E2E_BACK_OFFICE_URL` обязательны и проходят проверку в `support/config` до исполнения сценария.
- Spec описывает пользовательское поведение. Page и Component Objects владеют локаторами, ожиданиями готовности и UI-действиями; `fixtures/test.ts` собирает зависимости сценария.
- Предметные данные находятся в `support/data`. Взаимодействие с приложениями выполняется только через UI Playwright: API, БД, Web Storage, прямое изменение сети и запуск приложений не используются.
- Каждый новый или изменяемый объект следует структуре `<subject>.constants.ts`, `<subject>.types.ts` и `<subject>.page.ts` либо `<subject>.component.ts`.

## Последствия

Набор дополняет, но не изменяет локальные E2E клиентов. Будущие Q-E2E сценарии фиксируются в [карте сценариев](../../95-testing/E2E-map.md) и выполняются только против подготовленной внешней среды.

---
title: Тестирование backend
type: moc
area: backend
status: current
owner: backend
last_verified: 2026-08-11
sources:
  - ../../test/e2e/auth.e2e-spec.ts
---

# Тестирование

[Локальная карта](INDEX.md) — вход раздела.

`npm test -- --runInBand` запускает unit-спеки из `src`; `test:integration`
проверяет PostgreSQL-схему и adapters; `test:e2e` проверяет HTTP с PostgreSQL;
`test:production` — собранный runtime. [Scripts](../../package.json).

| Сценарий                                                  | Автоматическая проверка                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| OTP, refresh, logout, `/me`, Origin и роли                | [auth e2e](../../test/e2e/auth.e2e-spec.ts)                                  |
| публичное меню и админ-каталог с аудитом                  | [catalog e2e](../../test/e2e/admin-catalog.e2e-spec.ts)                      |
| доступность, цены, идемпотентность и снимок заказа        | [orders e2e](../../test/e2e/create-order.e2e-spec.ts)                        |
| liveness/readiness, error envelope, request log и метрики | [health e2e](../../test/e2e/health.e2e-spec.ts)                              |
| миграции, ограничения и транзакции                        | [integration](../../test/integration/order-unit-of-work.integration.spec.ts) |

Перед изменением HTTP запускают lint, typecheck, unit, build и `openapi:check`;
для базы доступны integration/e2e. [AGENTS](../../AGENTS.md).

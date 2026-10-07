---
title: "Жизненный цикл заказа"
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/orders/domain/order-lifecycle.constants.ts
  - ../../backend/src/orders/adapters/postgres-order-lifecycle.repository.ts
knowledge_role: implementation
scope: system
---

# Жизненный цикл заказа

## Стадии и выдача

Заказ проходит стадии `CREATED` → `ACCEPTED` → `PREPARING` → `READY` → `ISSUED`.
Каждый успешный переход атомарно сохраняет новую стадию и событие с автором,
временем, исходной и целевой стадией. [Источник: lifecycle](../../backend/src/orders/domain/order-lifecycle.constants.ts), [PostgreSQL repository](../../backend/src/orders/adapters/postgres-order-lifecycle.repository.ts).

Выдача переводит заказ из `READY` в `ISSUED`; отдельная хранимая модель оплаты
не создаётся. Клиент видит оплату на кассе при получении. [OpenAPI](../../backend/openapi/openapi.json), [интерфейс front-office](../50-interfaces/Front-office-UI.md).

Создание требует customer и ключ идемпотентности; подробности запроса —
[Orders API](../50-interfaces/Orders-API.md).

---
title: "Заказы"
type: domain
owner: backend
last_verified: 2026-09-20
sources:
  - ../../openapi/openapi.json
  - ../../src/orders/transport/orders-v3.controller.ts
  - ../../src/orders/transport/backoffice-orders-v3.controller.ts
  - ../../src/orders/transport/backoffice-orders.controller.ts
knowledge_role: implementation
scope: backend
---

# Заказы

Создание, чтение и повтор customer-заказа, а также чтение очереди / деталей staff-заказа работают в v3. Четыре перехода сотрудника `accept`, `start-preparing`, `mark-ready`, `issue` остаются текущими v2 API. Методы и схемы принадлежат [OpenAPI](../../openapi/openapi.json), граница версий — [ADR-008](../../../docs/20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md).

Владельцы HTTP-границы: [customer orders](../../src/orders/transport/orders-v3.controller.ts), [staff reads](../../src/orders/transport/backoffice-orders-v3.controller.ts), [staff transitions](../../src/orders/transport/backoffice-orders.controller.ts). Общие инварианты: [жизненный цикл](../../../docs/30-domain/Order-lifecycle.md), [снимки](../../../docs/30-domain/Order-snapshots.md), [идемпотентность](../../../docs/50-interfaces/Error-model-and-idempotency.md).

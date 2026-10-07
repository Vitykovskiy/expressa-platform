---
title: "Интеграция с API и ошибки"
type: domain
owner: back-office
last_verified: 2026-09-20
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/catalog.api.ts
  - ../../src/shared/api/availability.api.ts
knowledge_role: implementation
scope: back-office
---

# Интеграция с API и ошибки

[Локальный OpenAPI-снимок](../../contracts/openapi.json) задаёт HTTP-пути и схемы. Его соответствие backend проверяет существующая команда `contract:check` из [package.json](../../package.json).

- Каталог и команды товаров используют v3: [catalog API](../../src/shared/api/catalog.api.ts).
- Категории, модификаторы, приём заказов и сохранённые операции доступности используют v2; ценовые опции — v3: [availability API](../../src/shared/api/availability.api.ts).
- Очередь читается через v3, переходы стадий остаются v2: [orders API](../../src/shared/api/orders.api.ts).

Удалённые v2 операции товаров и чтения заказов не являются fallback. Ошибки и диагностика проходят через [HTTP-клиент](../../src/shared/api/client.ts); экран владеет отображением и допустимым повтором. Общий формат — [модель ошибок](../../../docs/50-interfaces/Error-model-and-idempotency.md), карта — [staff API](../../../docs/50-interfaces/Back-office-API.md).

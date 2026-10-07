---
title: "Соглашения HTTP API"
type: interface
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/platform/observability/request-observability.middleware.ts
knowledge_role: implementation
scope: system
---

# Соглашения HTTP API

Backend публикует JSON API под `/api/v2` и `/api/v3`; точный метод и путь выбираются по OpenAPI. Граница версий задана [ADR-008](../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md), а не общей версией приложения.
Каждый запрос получает или создаёт `x-request-id`, а ошибки возвращают тот же
идентификатор для диагностики. [Источники: OpenAPI](../../backend/openapi/openapi.json), [middleware](../../backend/src/platform/observability/request-observability.middleware.ts).

UUID и ISO-даты определяются схемами OpenAPI; Bearer нужен только защищённым
операциям, refresh использует cookie. [Источник: OpenAPI](../../backend/openapi/openapi.json).

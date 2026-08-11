---
type: interface
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/platform/observability/request-observability.middleware.ts
---

# Соглашения HTTP API

Backend публикует JSON API под `/api/v1`; OpenAPI-снимок — внешний контракт.
Каждый запрос получает или создаёт `x-request-id`, а ошибки возвращают тот же
идентификатор для диагностики. [Источники: OpenAPI](../../backend/openapi/openapi.json), [middleware](../../backend/src/platform/observability/request-observability.middleware.ts).

UUID и ISO-даты определяются схемами OpenAPI; Bearer нужен только защищённым
операциям, refresh использует cookie. [Источник: OpenAPI](../../backend/openapi/openapi.json).

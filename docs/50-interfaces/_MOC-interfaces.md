---
title: "Контракт сквозного HTTP-сценария"
type: moc
owner: root
last_verified: 2026-10-07
sources:
  - ../../backend/openapi/openapi.json
knowledge_role: navigation
scope: system
---

# Контракт сквозного HTTP-сценария

Карта интерфейсов — [INDEX.md](INDEX.md). При изменении клиентского сценария прочитайте:

1. [HTTP-соглашения](HTTP-API-conventions.md) и [ошибки / идемпотентность](Error-model-and-idempotency.md).
2. Затронутый контракт: [авторизация](Authentication-API.md), [меню](Menu-API.md), [заказы](Orders-API.md), [staff API](Back-office-API.md) или [push](Push-notifications.md).
3. Соответствующий UI: [front-office](Front-office-UI.md) или [back-office](Back-office-UI.md), затем локальную карту приложения.
4. [OpenAPI backend](../../backend/openapi/openapi.json) и потребляющий API-клиент для точных методов, схем и фактического использования.

Наличие серверного push-протокола не доказывает доставку уведомления в браузер. Требование, код и наблюдение доставки — разные источники.

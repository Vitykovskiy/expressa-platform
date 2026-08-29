---
title: Доступность и приём заказов
type: domain
owner: root
last_verified: 2026-08-16
sources:
  - ../../backend/src/orders/domain/order-revalidation.ts
  - ../../backend/src/catalog/transport/backoffice-availability.controller.ts
---

# Доступность и приём заказов

Backend хранит `isAvailable` у товаров, размеров и добавок, а `accepts_new_orders`
— в `service_settings`; создание заказа повторно проверяет оба вида ограничений.
[Revalidation](../../backend/src/orders/domain/order-revalidation.ts),
[схема заказа](../../backend/migrations/0006_e07_orders.sql).

Публичное меню возвращает текущую доступность и признак приёма новых заказов;
непригодные к публикации позиции отсекаются. [Public menu](../../backend/src/catalog/adapters/postgres-public-menu.repository.ts),
[OpenAPI](../../backend/openapi/openapi.json).

Staff читает `GET /api/v2/backoffice/availability`, изменяет product, variant или
modifier через `PATCH /api/v2/backoffice/availability/{type}/{id}` и приём через
`PATCH /api/v2/backoffice/service/intake`. Изменения записывают автора, время и
аудит; ответ сервера остаётся источником истины для back-office.
[Контроллер](../../backend/src/catalog/transport/backoffice-availability.controller.ts),
[OpenAPI](../../backend/openapi/openapi.json).

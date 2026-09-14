---
title: Доступность и приём заказов
type: domain
owner: root
last_verified: 2026-09-14
sources:
  - ../../backend/schema.sql
  - ../../backend/src/orders/domain/order-revalidation.ts
  - ../../backend/src/catalog/transport/backoffice-availability.controller.ts
---

# Доступность и приём заказов

Товары, варианты цены и добавки имеют ручную доступность, а настройки сервиса
содержат `accepts_new_orders`. Создание заказа повторно проверяет эти условия.
[Схема](../../backend/schema.sql), [revalidation](../../backend/src/orders/domain/order-revalidation.ts).

Публичное меню возвращает текущую доступность и признак приёма заказов. Staff
управляет доступностью и приёмом через back-office API; ответ сервера остаётся
источником истины. [Контроллер](../../backend/src/catalog/transport/backoffice-availability.controller.ts),
[OpenAPI](../../backend/openapi/openapi.json).

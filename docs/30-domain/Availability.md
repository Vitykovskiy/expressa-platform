---
title: Доступность и приём заказов
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/orders/domain/order-revalidation.ts
  - ../../back-office/docs/30-domains/Inactive-screens.md
---

# Доступность и приём заказов

Backend хранит `isAvailable` у товаров, размеров и добавок, а `accepts_new_orders`
— в `service_settings`; создание заказа повторно проверяет оба вида ограничений.
[Revalidation](../../backend/src/orders/domain/order-revalidation.ts),
[схема заказа](../../backend/migrations/0006_e07_orders.sql).

Публичное меню возвращает текущую доступность и признак приёма новых заказов;
непригодные к публикации позиции отсекаются. [Public menu](../../backend/src/catalog/adapters/postgres-public-menu.repository.ts),
[OpenAPI](../../backend/openapi/openapi.json).

Управление оперативной доступностью и приёмом заказов не опубликовано backend
API. `/availability` back-office — защищённая заглушка, а `AvailabilityScreen`
существует вне активного маршрута; поэтому это не staff-сценарий. [Маршрут и граница](../../back-office/docs/30-domains/Inactive-screens.md),
[coverage](../../back-office/docs/COVERAGE.md).

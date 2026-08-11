---
title: Создание заказов
type: feature
owner: backend
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../src/orders/application/create-order.use-case.ts
  - ../../src/orders/domain/order-revalidation.ts
  - ../../migrations/0006_e07_orders.sql
---

# Заказы

Только customer создаёт заказ через `POST /orders`; заголовок `Idempotency-Key`
обязателен. Сценарий заново читает актуальное меню, проверяет доступность,
размеры и модификаторы, пересчитывает сумму и сохраняет снимок. [Controller](../../src/orders/transport/orders.controller.ts),
[revalidation](../../src/orders/domain/order-revalidation.ts).

Единица работы блокирует обработку ключа, сравнивает fingerprint и либо отдаёт
первый результат, либо сохраняет заказ, позиции, модификаторы и дневной номер
одной транзакцией. Одинаковый ключ того же customer не создаёт дубль; другой
запрос с ключом получает конфликт. [Unit of work](../../src/orders/adapters/postgres-order-unit-of-work.ts),
[use case](../../src/orders/application/create-order.use-case.ts).

Схема закрепляет idempotency на customer, уникальный номер дня, неотрицательные
суммы и снимки позиций. Приём заказов контролирует `service_settings`.
[Миграция](../../migrations/0006_e07_orders.sql).

Проверки покрывают пересчёт и fingerprint unit-спеками, а e2e — авторизацию,
конкурентность, неизменность снимка и повторную проверку после admin-правки.
[unit](../../src/orders/application/create-order.use-case.spec.ts),
[e2e](../../test/e2e/create-order.e2e-spec.ts).

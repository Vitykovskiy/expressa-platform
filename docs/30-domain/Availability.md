---
title: "Доступность и приём заказов"
type: domain
owner: root
last_verified: 2026-10-23
sources:
  - ../../backend/schema.sql
  - ../../backend/src/orders/domain/order-revalidation.ts
  - ../../backend/src/catalog/transport/backoffice-availability.controller.ts
knowledge_role: implementation
scope: system
---

# Доступность и приём заказов

Товары, варианты цены и добавки имеют ручную доступность, а настройки сервиса
содержат `accepts_new_orders`. Создание заказа повторно проверяет эти условия.
[Схема](../../backend/schema.sql), [revalidation](../../backend/src/orders/domain/order-revalidation.ts).

Публичное меню возвращает текущую доступность и признак приёма заказов. Staff
управляет доступностью и приёмом через back-office API; ответ сервера остаётся
источником истины. [Контроллер](../../backend/src/catalog/transport/backoffice-availability.controller.ts),
[OpenAPI](../../backend/openapi/openapi.json).

Доступность товара — общий выключатель, а доступность каждого размера — его
отдельная сохранённая настройка. Размер доступен для заказа, только когда
включены и товар, и сам размер. Выключение товара не меняет сохранённые флаги
размеров; повторное включение восстанавливает их прежнее сочетание.
Если выключены все размеры, товар недоступен покупателю, даже когда общий
выключатель включён. Чтобы вернуть такой товар в продажу, сотрудник включает
нужный размер. [Публичное меню](../../backend/src/catalog/application/get-public-menu.use-case.ts),
[проверка заказа](../../backend/src/orders/domain/order-revalidation.ts).

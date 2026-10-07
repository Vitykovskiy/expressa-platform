---
title: "Корзина и оформление"
type: feature
owner: front-office
last_verified: 2026-10-07
sources:
  - ../../contracts/openapi.json
  - ../../src/entities/customer/model/cart.store.ts
  - ../../src/features/checkout/checkout.store.ts
knowledge_role: implementation
scope: front-office
---

# Корзина и оформление

Checkout создаёт заказ через `POST /api/v3/orders`. Позиция корзины содержит товар, выбранную ценовую опцию при необходимости и модификаторы; модели variant/S-M-L нет. Владелец локальных данных — [cart store](../../src/entities/customer/model/cart.store.ts), отправки — [checkout store](../../src/features/checkout/checkout.store.ts).

Итог, доступность и приём заказов повторно проверяет сервер. Формат тела и ошибок задаёт [OpenAPI](../../contracts/openapi.json); клиентская сумма не является источником цены. Межконтурный сценарий и восстановление после ошибки — [оформление заказа](../../../docs/40-features/Authenticate-and-place-order.md).

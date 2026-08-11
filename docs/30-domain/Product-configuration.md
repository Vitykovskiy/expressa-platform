---
title: Конфигурация товара
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/orders/domain/order-revalidation.ts
  - ../../front-office/docs/30-features/Menu-and-configuration.md
---

# Конфигурация товара

Конфигурация заказа содержит товар, вариант размера для `DRINK` и выбранные
варианты модификаторов. Backend при создании заказа сверяет их с актуальным
меню, допустимым количеством выбора и пересчитывает сумму; клиентский итог не
является источником цены. [Revalidation](../../backend/src/orders/domain/order-revalidation.ts),
[order API](../../backend/openapi/openapi.json).

Front-office строит начальное состояние из публичного меню: доступный `M`, иначе
первый доступный размер; обязательные бесплатные default-модификаторы. Изменение
пользователя ограничено правилами группы до отправки, но backend остаётся
окончательной проверкой. [Клиентский сценарий](../../front-office/docs/30-features/Menu-and-configuration.md),
[frontend tests](../../front-office/src/features/menu/product-configuration.spec.ts).

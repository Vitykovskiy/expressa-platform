---
title: "Авторизация и оформление заказа"
type: feature
owner: root
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../front-office/src/pages/CartPage.vue
knowledge_role: implementation
scope: system
---

# Авторизация и оформление заказа

Описание по исходникам; runtime и визуальная приёмка этой редакцией не подтверждены.

## Оформление после входа

Целевой сценарий первой регистрации: после подтверждения телефона клиент без
сохранённого имени вводит его на `/auth/name`, затем возвращается к прежней
задаче. Имя сохраняется только после успешного ответа backend. Ошибка
оставляет введённое имя и возможность повторить; повторный вход клиента с
именем сразу продолжает задачу. Восстановленная сессия без имени проходит этот
шаг перед корзиной, историей, деталями заказа или явным входом, без нового OTP.
Просмотр меню остаётся доступным. Корзина и безопасный `returnTo` сохраняются.
Это изменение контрактов; runtime-подтверждение выполняется после интеграции.

Гость из корзины идёт на OTP с внутренним `returnTo`; customer отправляет
checkout. Успех очищает корзину и открывает `/orders/:id`; страница загружает собственный заказ с backend. [Источники: CartPage](../../front-office/src/pages/CartPage.vue), [OrderPage](../../front-office/src/pages/OrderPage.vue).

Network повторяет тот же ключ; изменение total требует reconfirm, unavailable
выделяет позиции. Submit отключает только `acceptsNewOrders=false`; ответ
`ORDER_INTAKE_CLOSED` показывает ошибку checkout, но не делает retry permanently
disabled. [Источники: CartPage](../../front-office/src/pages/CartPage.vue), [CartScreen](../../front-office/src/features/checkout/CartScreen.vue), [checkout store](../../front-office/src/features/checkout/checkout.store.ts).

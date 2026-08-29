---
title: Интерфейс front-office
type: interface
owner: root
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../front-office/src/app/router.ts
  - ../../front-office/src/entities/customer/model/menu.store.ts
  - ../../front-office/src/features/checkout/checkout.store.ts
  - ../../front-office/src/pages/CartPage.vue
---

# Интерфейс front-office

## Активные границы

Маршрутизатор регистрирует меню, корзину, OTP, текущий заказ и `/orders`.
[front-office/src/app/router.ts:router](../../front-office/src/app/router.ts).

`customerNavigationGuard` защищает маршруты заказа и направляет анонима на
вход. [front-office/src/app/router.ts:customerNavigationGuard](../../front-office/src/app/router.ts).

`getSafeReturnTo` принимает только внутренний путь и отбрасывает auth paths.
[front-office/src/app/router.ts:getSafeReturnTo](../../front-office/src/app/router.ts).

Страница меню показывает loading, error с повтором и empty.
[front-office/src/pages/MenuPage.vue:entry](../../front-office/src/pages/MenuPage.vue).

`useMenuStore` получает публичное меню и сохраняет result/error.
[front-office/src/entities/customer/model/menu.store.ts:useMenuStore](../../front-office/src/entities/customer/model/menu.store.ts).

Корзина передаёт checkout-state в `CartScreen`; при закрытом intake, submitting
или недоступных позициях кнопка оформления блокируется. [front-office/src/features/checkout/CartScreen.vue:entry](../../front-office/src/features/checkout/CartScreen.vue).

`checkout` вызывает confirm либо retry сетевой ошибки.
[front-office/src/pages/CartPage.vue:checkout](../../front-office/src/pages/CartPage.vue).

`reconfirm` отправляет явное повторное подтверждение итога.
[front-office/src/pages/CartPage.vue:reconfirm](../../front-office/src/pages/CartPage.vue).

`finishCheckout` после успешного ответа очищает корзину и открывает
`/orders/:id`. [front-office/src/pages/CartPage.vue:finishCheckout](../../front-office/src/pages/CartPage.vue).

Тест `CartPage` проверяет retry, reconfirm и переход после успешного заказа.
[front-office/src/pages/CartPage.spec.ts:CartPage](../../front-office/src/pages/CartPage.spec.ts).

`useCheckoutStore` вызывает `ordersApi.createOrder`.
[front-office/src/features/checkout/checkout.store.ts:useCheckoutStore](../../front-office/src/features/checkout/checkout.store.ts).

В заполненной корзине и деталях созданного заказа показывается точный текст
«Оплата на кассе при получении». [CartScreen](../../front-office/src/features/checkout/CartScreen.vue), [OrderPage](../../front-office/src/pages/OrderPage.vue).

Изменение итога переводит checkout в reconfirmation, недоступность и закрытый
intake — в error state.
[front-office/src/features/checkout/checkout.store.ts:handleError](../../front-office/src/features/checkout/checkout.store.ts).

`createOrdersApi` отправляет `POST /api/v2/orders` с Bearer token и
idempotency key; API остаётся источником созданного заказа.
[front-office/src/shared/api/orders.api.ts:createOrdersApi](../../front-office/src/shared/api/orders.api.ts).

Повторно используемая кнопка связывает disabled/loading с `aria-busy` и
показывает progressbar во время loading. [front-office/src/shared/ui/customer/btn/UiBtn.vue:entry](../../front-office/src/shared/ui/customer/btn/UiBtn.vue).

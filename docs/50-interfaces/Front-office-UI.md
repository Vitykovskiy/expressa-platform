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

`createOrdersApi` отправляет `POST /api/v3/orders` с Bearer token и
idempotency key; API остаётся источником созданного заказа.
[front-office/src/shared/api/orders.api.ts:createOrdersApi](../../front-office/src/shared/api/orders.api.ts).

## Навигация customer

Ниже 1024px header всегда содержит один left-aligned touch-control с видимой
надписью «Экспресса» (и декоративной чашкой там, где она помещается), без
House. Его доступное имя — «Перейти в меню»: с корня
меню действие безопасно повторяет reset, с категории или товара возвращает в
корень MenuFlow, а с остальных маршрутов открывает `/`. Отдельного Home-action
нет. Back не принадлежит header: на category, product и details он находится
в отдельной left-aligned contextual row сразу под header и перед primary content
соответствующего экрана; он не входит в строку заголовка. Бренд всегда
начинается от левого content edge header. Справа в
постоянных позициях находятся «Аккаунт», «История заказов» и «Корзина».
Гость и вошедший customer видят те же действия в тех же местах: отличаются
только защищённый результат History и содержимое Account-диалога.

От 1024px сохраняется существующая боковая навигация: clickable brand, Menu,
History, Cart, categories и нижняя строка Account. Account остаётся постоянным
местом управления уведомлениями. Явный logout отвязывает только текущую
browser association и не меняет browser permission или local subscription. Точный
сценарий уведомлений — в [системной feature-ноте](../40-features/Track-history-and-repeat-order.md),
а контракт shell — в [UI-контрактах front-office](../../front-office/docs/30-conventions/UI-contracts.md).

## Account и пустая History

Гость открывает компактный Account ровно с заголовком «Аккаунт», текстом «Вы
не вошли в аккаунт» и действием «Войти»; дополнительного объяснения и
notification inspection нет.
Вошедший customer видит телефон, один статус «Уведомления о заказах», только
применимое действие и визуально отделённый logout. Endpoint, owner,
association/version и предупреждения о технической привязке не показываются.

Диалог имеет один источник open-состояния, видимую 44px кнопку закрытия и
возвращает фокус фактическому desktop/mobile trigger после X, Escape и
backdrop. Повторное и быстрое открытие не создаёт второй диалог; reduced motion
не использует выезд из trigger. На 479/480 и 1023/1024 px нет overflow или
скачка layout.

Пустая History повторяет уже применённый паттерн пустой Cart: центрированный
блок в доступной content area, круглая subtle-surface иконка, текст «История
заказов пуста» и крупная surface-кнопка «Перейти в меню». Refresh остаётся
вторичным действием header.

Повторно используемая кнопка связывает disabled/loading с `aria-busy` и
показывает progressbar во время loading. [front-office/src/shared/ui/customer/btn/UiBtn.vue:entry](../../front-office/src/shared/ui/customer/btn/UiBtn.vue).

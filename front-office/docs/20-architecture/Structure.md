---
type: architecture
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../src/app/router.ts
---

# Структура runtime

`app` создаёт Vue, Pinia, маршрутизатор, bootstrap сессии и PWA; `pages`
связывают маршрут с действиями; `widgets` собирают оболочку; `features` владеют
экранной логикой; `entities` владеют меню и корзиной; `shared` владеет HTTP,
настройкой и повторно используемым UI. [Источники: App](../../src/app/App.vue),
[router](../../src/app/router.ts).

Зависимости направлены вниз: `app -> pages -> widgets -> features -> entities -> shared`.
Storybook зависит от runtime и не участвует в production-графе.
[Источник: ADR](../50-adr/ADR-001-runtime-and-storybook-boundaries.md).

Заказ не является сущностью `entities`: его запрос и ответ принадлежат
`features/checkout` и `shared/api/orders.api`; страница читает завершённое
checkout-состояние. [Источники: store](../../src/features/checkout/checkout.store.ts),
[страница](../../src/pages/OrderPage.vue).

Проверка границ: [typecheck и тесты](../40-testing/Verification.md).

---
title: Неактивные экраны back-office
type: feature
implementation_status: current
owner: back-office
last_verified: 2026-08-26
sources:
  - ../../src/app/router.constants.ts
  - ../../src/pages/QueuePage.vue
  - ../../src/pages/AvailabilityPage.vue
---

# Неактивные экраны

`/queue` и `/availability` — активные маршруты для barista и administrator.
`QueuePage` показывает очередь, поиск, фильтр стадии, детали заказа и доступное
следующее действие; `AvailabilityPage` показывает приём заказов и доступность
товаров, размеров и добавок. Guard не допускает на эти маршруты customer.
[QueuePage.vue](../../src/pages/QueuePage.vue),
[AvailabilityPage.vue](../../src/pages/AvailabilityPage.vue),
[router.constants.ts](../../src/app/router.constants.ts).

`OrdersScreen` и `AvailabilityScreen` входят в активные страницы соответственно
очереди и управления доступностью. `SettingsScreen`, `UsersScreen`,
`AddUserDialog` и `UserActionDialog` не импортируются маршрутизатором; они не
создают активных маршрутов, API-вызовов или ролевых прав приложения.
[QueuePage.vue](../../src/pages/QueuePage.vue),
[AvailabilityPage.vue](../../src/pages/AvailabilityPage.vue),
[router.constants.ts](../../src/app/router.constants.ts).

`AuthScreen` не входит в этот список: его импортирует [LoginPage](../../src/pages/LoginPage.vue) на активном `/login`. Полный контракт — в [входе и ролях](Authentication-and-role-gates.md). При подключении любого неактивного экрана необходимо одновременно обновить router, role matrix, API/store, feature note, COVERAGE и tests.

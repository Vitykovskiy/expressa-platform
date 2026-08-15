---
title: Неактивные экраны back-office
type: feature
implementation_status: placeholder
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../src/app/router.constants.ts
  - ../../src/pages/QueuePage.vue
  - ../../src/pages/AvailabilityPage.vue
---

# Неактивные экраны

`/queue` и `/availability` — защищённые placeholder-маршруты для barista и administrator. Они используют `PageShell` и только сообщают, что соответствующий API будет опубликован позже: не загружают заказы, не меняют доступность, не содержат форм, диалогов, validation или API-клиентов. Эти URL остаются в роли-навигации и guards, поэтому не считаются отсутствующими. Источники: [QueuePage.vue](../../src/pages/QueuePage.vue), [AvailabilityPage.vue](../../src/pages/AvailabilityPage.vue), [router.constants.ts](../../src/app/router.constants.ts).

`AvailabilityScreen`, `OrdersScreen`, `SettingsScreen`, `UsersScreen`, `AddUserDialog` и `UserActionDialog` существуют в `src/pages/admin`, но не импортируются маршрутизатором. Это orphan runtime-компоненты: они не создают активных маршрутов, API-вызовов или ролевых прав приложения. Источник: [router.constants.ts](../../src/app/router.constants.ts).

`AuthScreen` не входит в этот список: его импортирует [LoginPage](../../src/pages/LoginPage.vue) на активном `/login`. Полный контракт — в [входе и ролях](Authentication-and-role-gates.md). При подключении любого неактивного экрана необходимо одновременно обновить router, role matrix, API/store, feature note, COVERAGE и tests.

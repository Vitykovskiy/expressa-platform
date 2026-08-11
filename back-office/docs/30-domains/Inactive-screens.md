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
  - ../../.storybook/main.ts
---

# Неактивные экраны

`/queue` и `/availability` — защищённые placeholder-маршруты для barista и administrator. Они используют `PageShell` и только сообщают, что соответствующий API будет опубликован позже: не загружают заказы, не меняют доступность, не содержат форм, диалогов, validation или API-клиентов. Эти URL остаются в роли-навигации и guards, поэтому не считаются отсутствующими. Источники: [QueuePage.vue](../../src/pages/QueuePage.vue), [AvailabilityPage.vue](../../src/pages/AvailabilityPage.vue), [router.constants.ts](../../src/app/router.constants.ts).

`AvailabilityScreen`, `OrdersScreen`, `SettingsScreen`, `UsersScreen`, `AddUserDialog` и `UserActionDialog` существуют в `src/pages/admin`, но не импортируются маршрутизатором. Они orphan runtime-компоненты, доступные для изолированной проверки через Storybook; их stories и действия не создают активных маршрутов, API-вызовов или ролевых прав приложения. Их UI contracts — controls, dialogs, loading/error/empty states, keyboard/focus и responsive widths — проверяются Storybook suites. Источники: [router.constants.ts](../../src/app/router.constants.ts), [stories](../../.storybook/stories/admin/), [navigation tests](../../.storybook/tests/navigation.e2e.ts).

`AuthScreen` не входит в этот список: его импортирует [LoginPage](../../src/pages/LoginPage.vue) на активном `/login`. Полный контракт — в [входе и ролях](Authentication-and-role-gates.md). При подключении любого неактивного экрана необходимо одновременно обновить router, role matrix, API/store, feature note, COVERAGE и tests.

---
type: guide
implementation_status: current
owner: back-office
last_verified: 2026-08-11
sources:
  - ../../src/app/App.vue
  - ../../src/pages/MenuPage.vue
  - ../../src/widgets/admin-shell/AdminShell.vue
  - ../../src/shared/ui/admin/admin-dialog/AdminDialog.vue
  - ../../src/shared/ui/admin/request-state-panel/AdminRequestStatePanel.vue
---

# Владение UI back-office

`App.vue` выбирает вход либо `AdminShell` по сессии; оболочка строит пункты из роли и передаёт навигацию и выход наружу. Экранная ошибка `app.store` показывается через `ErrorNotice`; загрузку каталога, авторизацию и предметные действия оболочка не выполняет. Источники: [App.vue](../../src/app/App.vue), [session.store.ts](../../src/app/session.store.ts), [navigation.ts](../../src/app/navigation.ts).

`MenuPage` владеет открытыми диалогами, раскрытием групп, выбранными сущностями и возвратом фокуса; `catalog.store` начинается в `idle`, затем владеет данными и статусом `loading|ready|error`. После подтверждённого пустого ответа страница показывает действие «Добавьте первую категорию»; это отдельное implemented empty state, не ошибка. Контракт экрана — в [управлении каталогом](../30-domains/Catalog-management.md). Источники: [catalog.constants.ts](../../src/pages/admin/menu/catalog.constants.ts), [MenuPage.vue](../../src/pages/MenuPage.vue).

`MenuReorderPanel` владеет только локальным черновиком порядка, dirty-индикаторами и клавиатурными move-controls; `MenuPage` владеет последовательной записью dirty scopes через `catalog.store`, компенсацией и обновлением подтверждённого каталога. Черновик не меняет API и не переживает только успешное закрытие режима. Источники: [MenuReorderPanel.vue](../../src/pages/admin/menu/MenuReorderPanel.vue), [useMenuReorderDraft.ts](../../src/pages/admin/menu/composables/useMenuReorderDraft.ts).

`MenuOverview` — единственный владелец toolbar обзора и поднимает typed events создания, перехода к порядку и редактирования категорий, товаров и групп добавок. `MenuPage` владеет product-create dialog и navigation к `ProductEditPage`; `ProductEditPage` владеет edit draft, командами save/archive и leave flow. Reorder panel windows complete category subtrees и sibling products через spacer ranges, сохраняя логические position/total для строк. Источники: [MenuOverview.vue](../../src/pages/admin/menu/MenuOverview.vue), [ProductEditPage.vue](../../src/pages/ProductEditPage.vue), [useVirtualSiblingRows.ts](../../src/pages/admin/menu/composables/useVirtualSiblingRows.ts).

`AddCategoryDialog` и `EditCategoryDialog` владеют только диалоговым состоянием и поднимают create/save/archive actions. `CategoryFormFields` отображает общие поля, а `useCategoryDraft` владеет нормализованным baseline, valid и dirty. `MenuPage` остаётся владельцем API-команд, pending/error archive state и закрытия редактора только после подтверждённой архивной команды. Источники: [AddCategoryDialog.vue](../../src/pages/admin/menu/AddCategoryDialog.vue), [EditCategoryDialog.vue](../../src/pages/admin/menu/EditCategoryDialog.vue), [MenuPage.vue](../../src/pages/MenuPage.vue).

`AvailabilityPage` и `QueuePage` владеют API-загрузкой, stale-request защитой, query persistence и входом после `401`; экранные компоненты получают данные/статусы props и поднимают действия emits. `AdminRequestStatePanel` получает готовые пользовательские copy и support IDs, а не backend message. Фокус/`alert` включаются только после user-initiated failure. Источники: [AvailabilityPage.vue](../../src/pages/AvailabilityPage.vue), [QueuePage.vue](../../src/pages/QueuePage.vue), [AvailabilityScreen.vue](../../src/pages/admin/availability/AvailabilityScreen.vue), [OrdersScreen.vue](../../src/pages/admin/orders/OrdersScreen.vue).

Диалоги создания, редактирования и удаления работают с явными `confirm/save/cancel`; отмена очищает черновик, подтверждение удаляет только после `ConfirmDialog`. `AdminDialog` — bottom sheet до 767px и центрированный диалог с ограничением 90vh от 768px; поддерживает persistent header/footer slots. `ConfirmDialog` — 480 px `alertdialog`, связывает заголовок и описание через ARIA, ставит безопасную «Отмена» первой в DOM/визуальном/focus порядке, поддерживает pending/error и возвращает фокус opener. Поля, textarea и переключатели имеют нативную семантику, видимый focus ring и отключённое состояние. `FilterTabs` — single-select radiogroup с одним roving tab stop: Arrow/Home/End атомарно выбирают и переносят фокус, Space/Enter выбирают элемент в фокусе. `AdminRequestStatePanel` принимает только подготовленные заголовок, текст, code/request ID; raw backend message не является частью его API. Источники: [AdminDialog.vue](../../src/shared/ui/admin/admin-dialog/AdminDialog.vue), [ConfirmDialog.vue](../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue), [AdminTextField.vue](../../src/shared/ui/admin/admin-text-field/AdminTextField.vue), [AdminTextarea.vue](../../src/shared/ui/admin/admin-textarea/AdminTextarea.vue), [AdminToggle.vue](../../src/shared/ui/admin/admin-toggle/AdminToggle.vue), [FilterTabs.vue](../../src/shared/ui/admin/filter-tabs/FilterTabs.vue), [AdminRequestStatePanel.vue](../../src/shared/ui/admin/request-state-panel/AdminRequestStatePanel.vue).

`AdminShell` показывает боковую навигацию от 768px и нижнюю вкладочную панель на меньшей ширине; контент прокручивается внутри оболочки. Runtime следует `app -> pages -> widgets -> features -> entities -> shared`. См. [shell](../../src/widgets/admin-shell/AdminShell.vue).

Канонические Admin-цвета определяет [theme.ts](../../src/styles/theme.ts), семантические CSS tokens — [main.css](../../src/styles/main.css), который потребляет переменные темы Vuetify. Tokens содержат утверждённые palette, 4/8/12/16/24/32/48 spacing, 10/12/16 radii, типографику, 44 px target, 48 px narrow/coarse target, focus ring 2 px + offset 2 px и 80/120/160 ms motion с reduced-motion override. Изменённые цвета, отступы, границы, radius и shared-control overrides используют semantic token; общие исключения и проверку задаёт [Vue-code-style](../../../docs/40-quality/Vue-code-style.md).

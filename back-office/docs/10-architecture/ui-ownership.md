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
---

# Владение UI back-office

`App.vue` выбирает вход либо `AdminShell` по сессии; оболочка строит пункты из роли и передаёт навигацию и выход наружу. Экранная ошибка `app.store` показывается через `ErrorNotice`; загрузку каталога, авторизацию и предметные действия оболочка не выполняет. Источники: [App.vue](../../src/app/App.vue), [session.store.ts](../../src/app/session.store.ts), [navigation.ts](../../src/app/navigation.ts).

`MenuPage` владеет открытыми диалогами, раскрытием групп, выбранными сущностями и возвратом фокуса; `catalog.store` начинается в `idle`, затем владеет данными и статусом `loading|ready|error`. После подтверждённого пустого ответа страница показывает действие «Добавьте первую категорию»; это отдельное implemented empty state, не ошибка. Контракт экрана — в [управлении каталогом](../30-domains/Catalog-management.md). Источники: [catalog.constants.ts](../../src/pages/admin/menu/catalog.constants.ts), [MenuPage.vue](../../src/pages/MenuPage.vue).

Диалоги создания, редактирования и удаления работают с явными `confirm/save/cancel`; отмена очищает черновик, подтверждение удаляет только после `ConfirmDialog`. `AdminDialog` — bottom sheet до 767px и центрированный диалог с ограничением 90vh от 768px; `ConfirmDialog` связывает заголовок и описание через ARIA, требует причину когда задано `requireInput`, очищает её при закрытии и возвращает фокус. Поля и переключатели имеют нативную семантику, видимый focus ring и отключённое состояние. Источники: [AdminDialog.vue](../../src/shared/ui/admin/admin-dialog/AdminDialog.vue), [ConfirmDialog.vue](../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue), [AdminTextField.vue](../../src/shared/ui/admin/admin-text-field/AdminTextField.vue), [AdminToggle.vue](../../src/shared/ui/admin/admin-toggle/AdminToggle.vue).

`AdminShell` показывает боковую навигацию от 768px и нижнюю вкладочную панель на меньшей ширине; контент прокручивается внутри оболочки. Runtime следует `app -> pages -> widgets -> features -> entities -> shared`; Storybook импортирует runtime, но runtime не импортирует Storybook. См. [shell](../../src/widgets/admin-shell/AdminShell.vue) и [ADR-001](../ADR/ADR-001-feature-sliced-runtime-and-storybook.md).

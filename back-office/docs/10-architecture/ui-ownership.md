---
type: guide
implementation_status: current
owner: back-office
last_verified: 2026-09-23
sources:
  - ../../src/app/App.vue
  - ../../src/pages/MenuPage.vue
  - ../../src/widgets/admin-shell/AdminShell.vue
  - ../../src/shared/ui/admin/admin-dialog/AdminDialog.vue
  - ../../src/shared/ui/admin/request-state-panel/AdminRequestStatePanel.vue
---

# Владение UI back-office

## Глобальные UI-заповеди — нормативная цель

Статус: обязательная целевая норма для всего UI front-office и back-office; она не описывает текущую реализацию и не является её приёмкой.

> 1. Все server/API/transport failures во всём приложении показываются исключительно через единую canonical notification system контура. Dialogs, pages, forms, panels, cards и другие локальные поверхности не рендерят server errors.
> 2. Один application-root notification service и один host обслуживают все операции контура. Локальные snackbar/toast/error-banner реализации запрещены. Технические сведения доступны только в console, без секретов и пользовательских данных.
> 3. Validation корректируемого значения показывается только у соответствующего поля. Domain refusals, limits и неподтверждённые операции классифицируются централизованно и показываются через notifications. Произвольный server message не становится field error.
> 4. Для каждого повторяющегося atom/pattern/composite/shell/action group/field/dialog/notification/navigation/state surface существует ровно один canonical shared component в обоснованном контуре. Consumers только параметризуют его.
> 5. Отдельные компоненты допустимы только для доказанно разных semantics. Цвет, размер, отступ, сущность, название экрана и визуальное предпочтение не являются основанием для дублирования.
> 6. В контуре ровно один canonical dialog shell. Он владеет header/body/footer/actions/close/loading/scroll и всеми layout/styles. Consumer header/footer/action layouts, nested cards и альтернативные dialog shells запрещены.
> 7. Header любого dialog: title слева, close справа. Footer всегда горизонтальный: optional destructive secondary слева; «Отмена», затем primary справа. Destructive confirmation имеет один destructive primary. Порядок и styles одинаковы во всех dialogs и viewport states.
> 8. Все typography/spacing/colors/sizes/borders/radii/shadows/motion разрешаются через единую semantic token authority. Локальные literals и CSS-переопределения внутреннего вида shared components запрещены.
> 9. UI содержит только необходимые title/labels/data/current state/validation/actions и краткое существующее destructive consequence. Hints, tooltips, instructional placeholders, explanatory subtitles, support details и дублирующие тексты запрещены.
> 10. Shared fields владеют label/required/control/actual validation. Один label, одно актуальное field error; никаких hint rows и optional markers. Локальные native-control substitutes запрещены.
> 11. Storybook показывает реальные canonical components и реальные tokens с deterministic direct states. Story-only fixes, copied demos, скрытые API-зависимости и фиктивные успешные сценарии запрещены.
> 12. Миграция завершена только после перехода всех consumers обоих контуров, удаления дубликатов и независимой проверки source coverage и работающих сценариев. Четыре dialogs или один showcase не доказывают global completion.
> 13. Границу доступности back-office задаёт [ADR-010](../../../docs/20-architecture/ADR/ADR-010-back-office-interaction-boundary.md): специальные `aria-*`, `role`, `tabindex`, видимые focus rings, программный возврат фокуса и отдельное клавиатурное управление не добавляются. Нативный ввод в полях и работа кнопок мышью и касанием сохраняются.
> 14. Автоматизированные тесты до явной приёмки не создавать, не изменять и не запускать. После приёмки — только по отдельному прямому запросу. Новые вспомогательные validators/scripts/automation требуют отдельного прямого запроса.

### Target owners and source bindings

| Family       | Required target owner                                                      | Current source binding                                                                                                                                                                                                                                          | Status                                                         |
| ------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Notification | One application-root notification service and one `NotificationHost`       | `src/main.ts`, `src/app/App.vue`                                                                                                                                                                                                                                | Required target; not accepted runtime fact.                    |
| Dialog       | One contour canonical dialog shell; `ConfirmDialog` is its semantic preset | `src/shared/ui/admin/admin-dialog/AdminDialog.vue`, `src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue`                                                                                                                                                      | Required target; existing components are migration candidates. |
| Field        | One shared field contract plus semantic controls                           | `src/shared/ui/admin/field-wrapper/`, `src/shared/ui/admin/admin-text-field/AdminTextField.vue`, `src/shared/ui/admin/admin-textarea/AdminTextarea.vue`, `src/shared/ui/admin/admin-select/AdminSelect.vue`, `src/shared/ui/admin/admin-toggle/AdminToggle.vue` | Required target; adoption unverified.                          |
| Tokens       | One semantic authority and framework aliases                               | `src/styles/theme.ts`, `src/styles/main.css`, `src/app/plugins.ts`                                                                                                                                                                                              | Required target; bindings remain source facts.                 |
| Icon family  | Existing contour icon authority                                            | `lucide-vue-next` imports in current UI sources                                                                                                                                                                                                                 | Required target; no replacement authorized.                    |

### Binding global contract sections

G01–G08, G51–G58 and G65–G80 are binding rules for this durable authority. Exact normative source: `.codex/tmp/tasks/global-ui-rules-v1/astra-global-commandments.md`. This note does not claim runtime adoption before independent acceptance.

`App.vue` выбирает вход либо `AdminShell` по сессии; оболочка строит пункты из роли и передаёт навигацию и выход наружу. Загрузку каталога, авторизацию и предметные действия оболочка не выполняет. Local server-error presentation подлежит удалению при migration к canonical notification system. Источники: [App.vue](../../src/app/App.vue), [session.store.ts](../../src/app/session.store.ts), [navigation.ts](../../src/app/navigation.ts).

`MenuPage` владеет открытыми диалогами, раскрытием групп и выбранными сущностями; `catalog.store` начинается в `idle`, затем владеет данными и статусом `loading|ready|error`. После подтверждённого пустого ответа страница показывает действие «Добавьте первую категорию»; это отдельное implemented empty state, не ошибка. Контракт экрана — в [управлении каталогом](../30-domains/Catalog-management.md). Источники: [catalog.constants.ts](../../src/pages/admin/menu/catalog.constants.ts), [MenuPage.vue](../../src/pages/MenuPage.vue).

`MenuReorderPanel` владеет только локальным черновиком порядка, dirty-индикаторами и управлением порядком мышью и касанием; `MenuPage` владеет последовательной записью dirty scopes через `catalog.store`, компенсацией и обновлением подтверждённого каталога. Черновик не меняет API и не переживает только успешное закрытие режима. Источники: [MenuReorderPanel.vue](../../src/pages/admin/menu/MenuReorderPanel.vue), [useMenuReorderDraft.ts](../../src/pages/admin/menu/composables/useMenuReorderDraft.ts).

`MenuOverview` — единственный владелец toolbar обзора и поднимает typed events создания, перехода к порядку и редактирования категорий, товаров и групп добавок. `MenuPage` владеет product-create dialog и navigation к `ProductEditPage`; `ProductEditPage` владеет edit draft, командами save/archive и leave flow. Reorder panel windows complete category subtrees и sibling products через spacer ranges, сохраняя логические position/total для строк. Источники: [MenuOverview.vue](../../src/pages/admin/menu/MenuOverview.vue), [ProductEditPage.vue](../../src/pages/ProductEditPage.vue), [useVirtualSiblingRows.ts](../../src/pages/admin/menu/composables/useVirtualSiblingRows.ts).

`AddCategoryDialog` и `EditCategoryDialog` владеют только диалоговым состоянием и поднимают create/save/archive actions. `CategoryFormFields` отображает общие поля, а `useCategoryDraft` владеет нормализованным baseline, valid и dirty. `MenuPage` остаётся владельцем API-команд, pending/error archive state и закрытия редактора только после подтверждённой архивной команды. Источники: [AddCategoryDialog.vue](../../src/pages/admin/menu/AddCategoryDialog.vue), [EditCategoryDialog.vue](../../src/pages/admin/menu/EditCategoryDialog.vue), [MenuPage.vue](../../src/pages/MenuPage.vue).

`AvailabilityPage` и `QueuePage` владеют API-загрузкой, stale-request защитой, query persistence и входом после `401`; экранные компоненты получают данные/статусы props и поднимают действия emits. `AdminRequestStatePanel` не рендерит server-error presentation; сохраняется только при real canonical non-error purpose. Источники: [AvailabilityPage.vue](../../src/pages/AvailabilityPage.vue), [QueuePage.vue](../../src/pages/QueuePage.vue), [AvailabilityScreen.vue](../../src/pages/admin/availability/AvailabilityScreen.vue), [OrdersScreen.vue](../../src/pages/admin/orders/OrdersScreen.vue).

Диалоги создания, редактирования и удаления работают с явными `confirm/save/cancel`; отмена очищает черновик, подтверждение удаляет только после `ConfirmDialog`. Один canonical dialog shell владеет header/body/footer/actions/close/loading/scroll; `ConfirmDialog` — его semantic preset, не отдельная surface/action recipe. Поля, textarea и переключатели сохраняют нативный ввод и отключённое состояние; `FilterTabs` выбирает вкладку нажатием. `AdminRequestStatePanel` не принимает server-error content, raw backend message или technical values. Источники: [AdminDialog.vue](../../src/shared/ui/admin/admin-dialog/AdminDialog.vue), [ConfirmDialog.vue](../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue), [AdminTextField.vue](../../src/shared/ui/admin/admin-text-field/AdminTextField.vue), [AdminTextarea.vue](../../src/shared/ui/admin/admin-textarea/AdminTextarea.vue), [AdminToggle.vue](../../src/shared/ui/admin/admin-toggle/AdminToggle.vue), [FilterTabs.vue](../../src/shared/ui/admin/filter-tabs/FilterTabs.vue), [AdminRequestStatePanel.vue](../../src/shared/ui/admin/request-state-panel/AdminRequestStatePanel.vue).

`AdminFieldWrapper` layouts `stack` and `row` remain default form compositions. The `row` layout divides the available width into two equal columns: the label starts at the left edge of the first, and the control starts at the left edge of the second. Its opt-in `table` layout keeps the same label/control/error contract while hiding the per-cell label visually for a single visible column header; the wrapper remains owner of visible validation text and required state.

Выбор категории при создании и редактировании товара использует общий `AdminCombobox`: шеврон обозначает раскрываемый список, ввод фильтрует варианты.

`AdminShell` показывает боковую навигацию от 768px и нижнюю вкладочную панель на меньшей ширине; контент прокручивается внутри оболочки. Runtime следует `app -> pages -> widgets -> features -> entities -> shared`. См. [shell](../../src/widgets/admin-shell/AdminShell.vue).

Канонические Admin-цвета определяет [theme.ts](../../src/styles/theme.ts), семантические CSS tokens — [main.css](../../src/styles/main.css), который потребляет переменные темы Vuetify. Tokens содержат light-only source-backed palette, component spacing 2/3/10/12/14/20 px и базовую шкалу 4/8/16/24/32/48 px, radii 6/10/16/999, source card/modal/tab-bar shadows, типографику, 40 px обычную и 44 px узкую/сенсорную высоту кнопок, 44/48 px для остальных controls и 120/200 ms ease-in-out motion. Изменённые цвета, отступы, границы, radius и shared-control overrides используют semantic token; общие исключения и проверку задаёт [Vue-code-style](../../../docs/40-quality/Vue-code-style.md).

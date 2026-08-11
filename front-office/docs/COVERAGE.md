---
type: coverage
owner: front-office
last_verified: 2026-08-11
sources:
  - ../src/app/router.ts
---

# Покрытие runtime

Реестр сопоставляет runtime с единственной подробной нотой. `[N/A]` означает
неиспользуемую для front-office часть контракта. [Источники: маршруты](../src/app/router.ts), [OpenAPI](../contracts/openapi.json).

| Runtime object | Status | Authoritative note | Sources | Tests | Disposition |
|---|---|---|---|---|---|
| / | current | [Меню](30-features/Menu-and-configuration.md) | [MenuPage](../src/pages/MenuPage.vue) | [spec](../src/pages/MenuPage.spec.ts) | rewrite: feature note |
| /cart | current | [Корзина](30-features/Cart-and-checkout.md) | [CartPage](../src/pages/CartPage.vue) | [spec](../src/features/checkout/CartScreen.spec.ts) | rewrite: feature note |
| /auth/phone | current | [Вход](30-features/Authentication-and-returnTo.md) | [page](../src/pages/AuthPhonePage.vue) | [spec](../src/pages/AuthPhonePage.spec.ts) | rewrite: feature note |
| /auth/code | current | [Вход](30-features/Authentication-and-returnTo.md) | [page](../src/pages/AuthCodePage.vue) | [spec](../src/pages/AuthCodePage.spec.ts) | rewrite: feature note |
| /orders/:id | current | [Заказы](30-features/Orders.md) | [page](../src/pages/OrderPage.vue) | [spec](../src/pages/OrderPage.spec.ts) | rewrite: feature note |
| /orders | current | [Заказы](30-features/Orders.md) | [page](../src/pages/OrdersPage.vue) | [router spec](../src/app/router.spec.ts) | rewrite: feature note |
| CustomerShell | orphan | [Контракты UI](30-conventions/UI-contracts.md) | [shell](../src/widgets/customer-shell/CustomerShell.vue) | [story](../.storybook/stories/customer/customer/Journeys.stories.ts) | story-only; no runtime import |
| AuthGatePrompt | orphan | [Контракты UI](30-conventions/UI-contracts.md) | [prompt](../src/features/auth/AuthGatePrompt.vue) | [story](../.storybook/stories/customer/customer/patterns/AuthGatePrompt.stories.ts) | story-only |
| UiPhoneInput | orphan | [Контракты UI](30-conventions/UI-contracts.md) | [phone](../src/shared/ui/customer/phone-input/UiPhoneInput.vue) | [story](../.storybook/stories/customer/customer/atoms/PhoneInput.stories.ts) | story-only; AuthForm uses UiTextField |
| UiOtpInput | orphan | [Контракты UI](30-conventions/UI-contracts.md) | [OTP](../src/shared/ui/customer/otp-input/UiOtpInput.vue) | [story](../.storybook/stories/customer/customer/atoms/OtpInput.stories.ts) | story-only; AuthForm uses UiTextField |
| UiSurfaceCard | orphan | [Контракты UI](30-conventions/UI-contracts.md) | [surface](../src/shared/ui/customer/surface-card/UiSurfaceCard.vue) | [story](../.storybook/stories/customer/customer/patterns/SurfaceCard.stories.ts) | story-only |
| UiToggle | orphan | [Контракты UI](30-conventions/UI-contracts.md) | [toggle](../src/shared/ui/customer/toggle/UiToggle.vue) | [story](../.storybook/stories/customer/customer/atoms/Toggle.stories.ts) | story-only |
| App and ErrorNotice | current | [Состояние и API](20-architecture/Application-state-and-API.md) | [App](../src/app/App.vue) | [spec](../src/app/App.spec.ts) | active global error display |
| API error mapper | orphan | [Состояние и API](20-architecture/Application-state-and-API.md) | [mapper](../src/app/api-error.mapper.ts) | [spec](../src/app/api-error.mapper.spec.ts) | tested only; no runtime consumer |
| app store | current | [Состояние и API](20-architecture/Application-state-and-API.md) | [store](../src/app/app.store.ts) | [spec](../src/app/App.spec.ts) | covered in state note |
| session store | current | [Состояние и API](20-architecture/Application-state-and-API.md) | [store](../src/app/session.store.ts) | [spec](../src/app/session.store.spec.ts) | covered in state note |
| menu store | current | [Состояние и API](20-architecture/Application-state-and-API.md) | [store](../src/entities/customer/model/menu.store.ts) | [spec](../src/entities/customer/model/menu.store.spec.ts) | covered in state note |
| cart store | current | [Состояние и API](20-architecture/Application-state-and-API.md) | [store](../src/entities/customer/model/cart.store.ts) | [spec](../src/entities/customer/model/cart.store.spec.ts) | covered in state note |
| checkout store | current | [Корзина](30-features/Cart-and-checkout.md) | [store](../src/features/checkout/checkout.store.ts) | [spec](../src/features/checkout/checkout.store.spec.ts) | covered in feature note |
| auth screen | current | [Вход](30-features/Authentication-and-returnTo.md) | [screen](../src/features/auth/AuthScreen.vue) | [stories](../.storybook/stories/customer/customer/Auth.stories.ts) | covered in feature note |
| menu root screen | current | [Меню](30-features/Menu-and-configuration.md) | [root](../src/features/menu/MenuRootScreen.vue) | [spec](../src/features/menu/MenuFlow.spec.ts) | covered in feature note |
| menu group screen | current | [Меню](30-features/Menu-and-configuration.md) | [group](../src/features/menu/MenuGroupScreen.vue) | [spec](../src/features/menu/MenuFlow.spec.ts) | covered in feature note |
| product detail screen | current | [Меню](30-features/Menu-and-configuration.md) | [detail](../src/features/menu/ProductDetailScreen.vue) | [spec](../src/features/menu/product-configuration.spec.ts) | covered in feature note |
| cart screen | current | [Корзина](30-features/Cart-and-checkout.md) | [screen](../src/features/checkout/CartScreen.vue) | [spec](../src/features/checkout/CartScreen.spec.ts) | covered in feature note |
| slot picker | orphan | [Корзина](30-features/Cart-and-checkout.md) | [screen](../src/features/checkout/SlotPickerScreen.vue) | [stories](../.storybook/stories/customer/customer/SlotPicker.stories.ts) | story-only; no routed consumer |
| orders history screen | orphan | [Заказы](30-features/Orders.md) | [screen](../src/features/orders/OrdersHistoryScreen.vue) | [stories](../.storybook/stories/customer/customer/OrdersHistory.stories.ts) | story-only; no routed consumer |
| dialog primitive | orphan | [Контракты UI](30-conventions/UI-contracts.md) | [dialog](../src/shared/ui/customer/dialog/UiDialog.vue) | [stories](../.storybook/stories/customer/customer/atoms/Dialog.stories.ts) | story-only; no runtime consumer |
| /api/v1/auth/otp/request | current | [Вход](30-features/Authentication-and-returnTo.md) | [OpenAPI](../contracts/openapi.json) | [API spec](../src/shared/api/auth.api.spec.ts) | consumed |
| /api/v1/auth/otp/verify | current | [Вход](30-features/Authentication-and-returnTo.md) | [OpenAPI](../contracts/openapi.json) | [API spec](../src/shared/api/auth.api.spec.ts) | consumed |
| /api/v1/auth/refresh | current | [Состояние и API](20-architecture/Application-state-and-API.md) | [OpenAPI](../contracts/openapi.json) | [API spec](../src/shared/api/auth.api.spec.ts) | consumed |
| /api/v1/auth/logout | current | [Состояние и API](20-architecture/Application-state-and-API.md) | [OpenAPI](../contracts/openapi.json) | [API spec](../src/shared/api/auth.api.spec.ts) | consumed |
| /api/v1/me | current | [Состояние и API](20-architecture/Application-state-and-API.md) | [OpenAPI](../contracts/openapi.json) | [API spec](../src/shared/api/auth.api.spec.ts) | consumed |
| /api/v1/public/menu | current | [Меню](30-features/Menu-and-configuration.md) | [OpenAPI](../contracts/openapi.json) | [API spec](../src/shared/api/public-menu.api.spec.ts) | consumed |
| /api/v1/backoffice/catalog | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/categories | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/categories/{categoryId} | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/categories/reorder | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/products | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/products/{productId} | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/products/reorder | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/modifier-groups | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/modifier-groups/{groupId} | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/modifier-groups/{groupId}/options | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/modifier-groups/options/{optionId} | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/modifier-groups/{groupId}/options/reorder | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/backoffice/catalog/categories/{categoryId}/modifier-groups | N/A reason: admin client | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /api/v1/orders | current | [Корзина](30-features/Cart-and-checkout.md) | [OpenAPI](../contracts/openapi.json) | [API spec](../src/shared/api/orders.api.spec.ts) | consumed POST |
| /health/live | N/A reason: no front-office caller | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |
| /health/ready | N/A reason: no front-office caller | [Контур](00-meta/Scope.md) | [OpenAPI](../contracts/openapi.json) | N/A | not consumed |

Disposition существующих нотов: `front-office/AGENTS.md` — keep, локальные
правила; `front-office/README.md` — update, вход в контур; `docs/INDEX.md` —
rewrite, навигация; `docs/README.md` — merge/delete в INDEX; `docs/storybook.md`
— delete, правила слиты в Runtime-and-Storybook; `00-meta/Scope.md` — rewrite,
границы; `20-architecture/Structure.md` — rewrite, слои; `30-conventions/Runtime-and-Storybook.md`
— update, граница каталога; `40-testing/Verification.md` — rewrite, проверки;
`50-adr/ADR-001-runtime-and-storybook-boundaries.md` — keep/trim, решение;
`_sources/README.md` — update, приоритет источников; `_journal/README.md` —
keep, журнал. [Источник: target-map](../../.codex/tmp/tasks/docs-as-code-rework/architecture.md).

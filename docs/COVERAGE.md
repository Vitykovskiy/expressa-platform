---
title: Реестр покрытия root-документации
type: registry
owner: root
last_verified: 2026-08-11
sources:
  - ../scripts/check-docs.mjs
  - ../.codex/tmp/tasks/docs-as-code-rework/disposition-manifest.md
  - ../backend/openapi/openapi.json
---

# Реестр покрытия root-документации

Реестр отделяет работающие межконтурные контракты от planning, ADR, journal и
placeholder. Детали реализации остаются в local docs.
[disposition-manifest.md:root](../.codex/tmp/tasks/docs-as-code-rework/disposition-manifest.md).

## Ноты root docs

| Runtime object | Status | Disposition / reason | Authoritative note | Sources | Tests |
|---|---|---|---|---|---|
| `docs/COVERAGE.md` | current | registry; источник статуса root docs | [COVERAGE](COVERAGE.md) | [scripts/check-docs.mjs:checkCoverage](../scripts/check-docs.mjs) | [scripts/check-docs.mjs:checkCoverage](../scripts/check-docs.mjs) |
| `docs/INDEX.md`, `docs/README.md`, `docs/**/_MOC-*.md` | N/A — navigation | navigation; reason: glob содержит только навигационные ноты | [INDEX](INDEX.md) | [scripts/check-docs.mjs:checkReachability](../scripts/check-docs.mjs) | [scripts/check-docs.mjs:checkReachability](../scripts/check-docs.mjs) |
| `docs/00-meta/*.md` кроме `_MOC-meta.md` | current | current policy/source rules | [Метаданные](00-meta/_MOC-meta.md) | [docs/00-meta/Source-precedence.md:source](00-meta/Source-precedence.md) | N/A — rules; reason: не runtime |
| `docs/10-overview/backlog/**/*.md`, `docs/10-overview/Backlog*.md`, `docs/10-overview/Epic-roadmap.md` | N/A — planning | planning; glob содержит только backlog corpus | [Бэклог](10-overview/Backlog.md) | [disposition-manifest.md:root](../.codex/tmp/tasks/docs-as-code-rework/disposition-manifest.md) | N/A — planning; reason: не runtime |
| `docs/10-overview/{MVP-scope,Project-overview,Roles-and-access}.md` | N/A — planning target | planning/target; reason: ТЗ описывает целевой MVP, не текущую систему | [Обзор](10-overview/_MOC-overview.md) | [docs/_sources/Expressa_MVP_Техническое_задание.md:MVP](_sources/Expressa_MVP_Техническое_задание.md) | N/A — planning; reason: не runtime |
| `docs/20-architecture/ADR/*.md` | N/A — decision records | ADR; glob содержит только решения | [Архитектура](20-architecture/_MOC-architecture.md) | [disposition-manifest.md:ADR](../.codex/tmp/tasks/docs-as-code-rework/disposition-manifest.md) | N/A — ADR; reason: не runtime |
| `docs/20-architecture/*.md` кроме `ADR/**` и `_MOC-architecture.md` | current | current cross-contour architecture | [Архитектура](20-architecture/_MOC-architecture.md) | [backend/src/app.module.ts:AppModule](../backend/src/app.module.ts) | [backend/test/e2e/health.e2e-spec.ts:health](../backend/test/e2e/health.e2e-spec.ts) |
| `docs/30-domain/*.md` кроме `_MOC-domain.md` | current | current domain boundaries | [Предметная область](30-domain/_MOC-domain.md) | [backend/migrations/0006_e07_orders.sql:orders](../backend/migrations/0006_e07_orders.sql) | [backend/test/e2e/create-order.e2e-spec.ts:createOrder](../backend/test/e2e/create-order.e2e-spec.ts) |
| `docs/40-features/*.md` кроме `_MOC-features.md` | current/placeholder/unsupported | scenario note declares its own runtime boundary | [Возможности](40-features/_MOC-features.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [docs/95-testing/Mandatory-scenarios.md:scenarios](95-testing/Mandatory-scenarios.md) |
| `docs/40-quality/*.md`, `docs/80-conventions/*.md` | current | current quality/DoD rules | [Тестирование](95-testing/_MOC-testing.md) | [docs/95-testing/Coverage-and-quality-gates.md:gates](95-testing/Coverage-and-quality-gates.md) | N/A — rules; reason: не runtime |
| `docs/50-interfaces/*.md` кроме `_MOC-interfaces.md` | current/placeholder/orphan | interface note declares its own boundary | [Интерфейсы](50-interfaces/_MOC-interfaces.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/test/e2e/create-order.e2e-spec.ts:createOrder](../backend/test/e2e/create-order.e2e-spec.ts) |
| `docs/70-deployment/*.md` кроме `_MOC-deployment.md` | current/unsupported | current delivery boundary or explicitly unsupported operation | [Поставка](70-deployment/_MOC-deployment.md) | [deploy/deploy.sh:main](../deploy/deploy.sh) | [deploy/deploy.sh:main](../deploy/deploy.sh) |
| `docs/90-agents/Project-instructions.md` | N/A — instruction | instruction; не runtime | [Инструкции](90-agents/_MOC-agents.md) | [AGENTS.md:instructions](../AGENTS.md) | N/A — instruction; reason: не runtime |
| `docs/95-testing/*.md` кроме `_MOC-testing.md` | current | current verification rules | [Тестирование](95-testing/_MOC-testing.md) | [backend/package.json:test](../backend/package.json) | [backend/package.json:test](../backend/package.json) |
| `docs/_sources/*.md` | N/A — source provenance | source provenance; не runtime | [Нормативный источник](_sources/README.md) | [docs/_sources/README.md:sources](_sources/README.md) | N/A — source note; reason: не runtime |
| `docs/_journal/*.md` | N/A — journal | journal; история изменений | [Журнал](_journal/README.md) | [docs/_journal/README.md:journal](_journal/README.md) | N/A — journal; reason: не runtime |

## Клиентские маршруты

> | Runtime object | Status | Disposition / reason | Authoritative note | Sources | Tests |
> |---|---|---|---|---|---|
> | Front `/`, `/cart`, `/auth/phone`, `/auth/code`, `/orders/:id`, `/orders` | current | active customer routes; `/orders` остаётся статической оболочкой | [Front UI](50-interfaces/Front-office-UI.md) | [front-office/src/app/router.ts:router](../front-office/src/app/router.ts) | [front-office/src/app/router.spec.ts:routes](../front-office/src/app/router.spec.ts) |
> | Back `/`, `/login`, `/queue`, `/availability`, `/menu` | current | active staff routes | [Back UI](50-interfaces/Back-office-UI.md) | [back-office/src/app/router.constants.ts:backOfficeRoutes](../back-office/src/app/router.constants.ts) | [back-office/src/app/router.spec.ts:router](../back-office/src/app/router.spec.ts) |

## OpenAPI

> | Runtime object | Status | Disposition / reason | Authoritative note | Sources | Tests |
> |---|---|---|---|---|---|
> | `POST /api/v2/auth/otp/request`, `POST /api/v2/auth/otp/verify`, `POST /api/v2/auth/refresh`, `POST /api/v2/auth/logout`, `GET /api/v2/me` | current | published auth/session contract | [Authentication API](50-interfaces/Authentication-API.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/src/auth/transport/auth.controller.spec.ts:AuthController](../backend/src/auth/transport/auth.controller.spec.ts) |
> | `GET /api/v2/public/menu` | current | published public menu read model | [Menu API](50-interfaces/Menu-API.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/src/catalog/transport/public-menu.controller.spec.ts:PublicMenuController](../backend/src/catalog/transport/public-menu.controller.spec.ts) |
> | `GET /api/v2/backoffice/catalog` | current | published administrator catalog read model | [Back-office API](50-interfaces/Back-office-API.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/src/catalog/transport/admin-catalog.controller.spec.ts:AdminCatalogController](../backend/src/catalog/transport/admin-catalog.controller.spec.ts) |
> | `POST /api/v2/backoffice/catalog/categories`, `PATCH /api/v2/backoffice/catalog/categories/{categoryId}`, `DELETE /api/v2/backoffice/catalog/categories/{categoryId}`, `POST /api/v2/backoffice/catalog/categories/reorder` | current | published category commands | [Back-office API](50-interfaces/Back-office-API.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/src/catalog/transport/catalog-categories.controller.spec.ts:CatalogCategoriesController](../backend/src/catalog/transport/catalog-categories.controller.spec.ts) |
> | `POST /api/v2/backoffice/catalog/products`, `PATCH /api/v2/backoffice/catalog/products/{productId}`, `DELETE /api/v2/backoffice/catalog/products/{productId}`, `POST /api/v2/backoffice/catalog/products/reorder` | current | published product commands | [Back-office API](50-interfaces/Back-office-API.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/src/catalog/transport/catalog-products.controller.spec.ts:CatalogProductsController](../backend/src/catalog/transport/catalog-products.controller.spec.ts) |
> | `POST /api/v2/backoffice/catalog/modifier-groups`, `PATCH /api/v2/backoffice/catalog/modifier-groups/{groupId}`, `DELETE /api/v2/backoffice/catalog/modifier-groups/{groupId}`, `POST /api/v2/backoffice/catalog/modifier-groups/{groupId}/options`, `PATCH /api/v2/backoffice/catalog/modifier-groups/options/{optionId}`, `DELETE /api/v2/backoffice/catalog/modifier-groups/options/{optionId}`, `POST /api/v2/backoffice/catalog/modifier-groups/{groupId}/options/reorder` | current | published modifier commands | [Back-office API](50-interfaces/Back-office-API.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/src/catalog/transport/catalog-modifiers.controller.spec.ts:CatalogModifiersController](../backend/src/catalog/transport/catalog-modifiers.controller.spec.ts) |
> | `PUT /api/v2/backoffice/catalog/categories/{categoryId}/modifier-groups` | current | published category-modifier assignment command | [Back-office API](50-interfaces/Back-office-API.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/src/catalog/transport/catalog-category-modifiers.controller.spec.ts:CatalogCategoryModifiersController](../backend/src/catalog/transport/catalog-category-modifiers.controller.spec.ts) |
> | `POST /api/v2/orders` | current | published order creation command | [Orders API](50-interfaces/Orders-API.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/test/e2e/create-order.e2e-spec.ts:createOrder](../backend/test/e2e/create-order.e2e-spec.ts) |
> | `GET /health/live`, `GET /health/ready` | current | published health contract | [Operations](70-deployment/Operations-runbook.md) | [backend/openapi/openapi.json:paths](../backend/openapi/openapi.json) | [backend/src/platform/health/health.controller.spec.ts:HealthController](../backend/src/platform/health/health.controller.spec.ts) |

## Пользовательские сценарии

> | Runtime object | Status | Disposition / reason | Authoritative note | Sources | Tests |
> |---|---|---|---|---|---|
> | Аутентификация и оформление заказа | current | current customer journey | [Authenticate and place order](40-features/Authenticate-and-place-order.md) | [front-office/src/pages/CartPage.vue:finishCheckout](../front-office/src/pages/CartPage.vue) | [front-office/src/pages/CartPage.spec.ts:CartPage](../front-office/src/pages/CartPage.spec.ts) |
> | Просмотр меню и сбор корзины | current | current customer journey | [Browse menu and build cart](40-features/Browse-menu-and-build-cart.md) | [front-office/src/pages/MenuPage.vue:entry](../front-office/src/pages/MenuPage.vue) | [front-office/src/pages/MenuPage.spec.ts:MenuPage](../front-office/src/pages/MenuPage.spec.ts) |
> | Управление меню | current | current administrator journey | [Manage menu](40-features/Manage-menu.md) | [back-office/src/pages/MenuPage.vue:entry](../back-office/src/pages/MenuPage.vue) | [back-office/src/pages/MenuPage.spec.ts:MenuPage](../back-office/src/pages/MenuPage.spec.ts) |
> | Управление доступностью | current | current staff journey | [Manage availability](40-features/Manage-availability.md) | [back-office/src/pages/AvailabilityPage.vue:entry](../back-office/src/pages/AvailabilityPage.vue) | [back-office/src/pages/admin/availability/AvailabilityScreen.spec.ts:AvailabilityScreen](../back-office/src/pages/admin/availability/AvailabilityScreen.spec.ts) |
> | Подготовка и выдача заказа | current | current staff journey | [Prepare and hand off order](40-features/Prepare-and-hand-off-order.md) | [back-office/src/pages/QueuePage.vue:entry](../back-office/src/pages/QueuePage.vue) | [back-office/src/pages/QueuePage.spec.ts:QueuePage](../back-office/src/pages/QueuePage.spec.ts) |
> | Текущая деталь заказа, история и повтор | current | current detail/history/repeat journey with implementation gaps tracked by standalone E2E map | [Track history and repeat order](40-features/Track-history-and-repeat-order.md) | [front-office/src/pages/OrderPage.vue:entry](../front-office/src/pages/OrderPage.vue) | [front-office/src/pages/OrderPage.spec.ts:OrderPage](../front-office/src/pages/OrderPage.spec.ts); [E2E map](../e2e/docs/95-testing/E2E-map.md) |

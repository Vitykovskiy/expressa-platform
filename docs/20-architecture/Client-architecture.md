---
title: "Архитектура клиентов"
type: architecture
owner: root
last_verified: 2026-10-08
sources:
  - ../../front-office/docs/INDEX.md
  - ../../back-office/docs/INDEX.md
knowledge_role: implementation
scope: system
---

# Архитектура клиентов

Front-office и back-office — независимые Vue/Vite PWA. Каждый контур владеет runtime, маршрутами, состоянием, UI, API-клиентом и локальной документацией. Слои и владельцы описаны в [front-office](../../front-office/docs/20-architecture/INDEX.md) и [back-office](../../back-office/docs/10-architecture/ui-ownership.md).

## Текущие маршруты

Front-office содержит меню, корзину, OTP, историю `/orders` и детали `/orders/:id`. История и детали читают backend; это не оболочки без данных. [Маршрутизатор](../../front-office/src/app/router.ts), [история](../../front-office/src/pages/OrdersPage.vue), [детали](../../front-office/src/pages/OrderPage.vue).

Back-office содержит вход, очередь `/queue`, доступность `/availability` и административный каталог `/menu`. Очередь и доступность подключены к активным страницам. Активные композиции и удалённый неподключённый UI описаны в [границах экранов](../../back-office/docs/30-domains/Inactive-screens.md). [Маршруты](../../back-office/src/app/router.constants.ts).

## Границы совместимости

Клиенты не импортируют исходники друг друга или backend; совместимость задаётся [HTTP/OpenAPI-контрактом](Cross-repository-contracts.md). Точные пути API выбирайте из [OpenAPI](../../backend/openapi/openapi.json), а не по версии всего приложения.

Storybook описан в [ADR-004](ADR/ADR-004-remove-storybook.md): требование изолированного каталога отделено от состояния интеграции каждого клиента.

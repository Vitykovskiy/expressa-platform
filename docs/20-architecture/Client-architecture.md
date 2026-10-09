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

Front-office и back-office — независимые клиенты на Vue/Vite. Для back-office обязательны Vue 3, Vuetify, TypeScript, Vite и Pinia по [техническому DoD](../80-conventions/Code-Definition-of-Done-back-office.md). [ADR-011](ADR/ADR-011-back-office-clean-slate.md) освобождает проектирование UI от прежней визуальной формы; стек и правила организации кода сохраняются. Каждый контур владеет runtime, маршрутами, состоянием, UI, API-клиентом и локальной документацией. Слои и владельцы описаны в [front-office](../../front-office/docs/20-architecture/INDEX.md) и [back-office](../../back-office/docs/10-architecture/ui-ownership.md).

## Текущие маршруты

Front-office содержит меню, корзину, OTP, историю `/orders` и детали `/orders/:id`. История и детали читают backend; это не оболочки без данных. [Маршрутизатор](../../front-office/src/app/router.ts), [история](../../front-office/src/pages/OrdersPage.vue), [детали](../../front-office/src/pages/OrderPage.vue).

Требуемые [staff-сценарии](../50-interfaces/Back-office-UI.md) back-office 2.0 отделены от состояния реализации. Прежние маршруты и композиции не задают новый клиент; состав рабочего дерева отражён в [локальной карте](../../back-office/docs/INDEX.md).

## Границы совместимости

Клиенты не импортируют исходники друг друга или backend; совместимость задаётся [HTTP/OpenAPI-контрактом](Cross-repository-contracts.md). Точные пути API выбирайте из [OpenAPI](../../backend/openapi/openapi.json), а не по версии всего приложения.

Для front-office каталог описан в [ADR-004](ADR/ADR-004-remove-storybook.md). Back-office 2.0 выбирает средства работы с UI по [ADR-011](ADR/ADR-011-back-office-clean-slate.md).

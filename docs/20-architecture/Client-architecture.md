---
title: Архитектура клиентов
type: architecture
owner: root
last_verified: 2026-08-11
sources:
  - ../../front-office/docs/INDEX.md
  - ../../back-office/docs/INDEX.md
---

# Архитектура клиентов

Front-office и back-office — независимые Vue/Vite PWA: каждый владеет runtime,
маршрутами, состоянием, UI, API-клиентом, тестами и локальной документацией.
[Front-office](../../front-office/docs/INDEX.md), [back-office](../../back-office/docs/INDEX.md).

Front-office обслуживает customer-путь меню, корзины, OTP и заказа. Back-office
реализует вход и администрирование каталога; `/queue` и `/availability` —
защищённые заглушки, а не работающие операции. [Front coverage](../../front-office/docs/COVERAGE.md),
[back coverage](../../back-office/docs/COVERAGE.md).

Клиенты не импортируют исходный код друг друга или backend; их совместимость
определяют HTTP и локальные OpenAPI-снимки. [Контракт](Cross-repository-contracts.md).

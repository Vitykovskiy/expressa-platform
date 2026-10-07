---
title: "Архитектура backend"
type: architecture
owner: root
last_verified: 2026-10-08
sources:
  - ../../backend/docs/10-architecture/Layers.md
  - ../../backend/openapi/openapi.json
knowledge_role: implementation
scope: system
---

# Архитектура backend

Backend — владелец HTTP API, серверных предметных правил и PostgreSQL. Локальная [архитектура](../../backend/docs/10-architecture/Layers.md) описывает transport, application, domain, adapters и сборку DI.

## Предметные границы

- [Авторизация](../../backend/docs/30-domains/Auth.md): OTP, сессии, текущий пользователь и logout.
- [Каталог](../../backend/docs/30-domains/Catalog.md): публичное меню, административный каталог, категории, товары, модификаторы и доступность.
- [Заказы](../../backend/docs/30-domains/Orders.md): создание, customer / staff чтение, повтор и переходы стадий.
- [Push-привязки](../../backend/docs/30-domains/Notifications.md): инспекция и связь подписки с аккаунтом.
- [Операции](../../backend/docs/60-operations/Run-and-environment.md): конфигурация, health и наблюдаемость.

Полный перечень HTTP-операций принадлежит [OpenAPI](../../backend/openapi/openapi.json), связь маршрута с предметным владельцем — [локальной карте API](../../backend/docs/50-api/_MOC-api.md). Этот обзор не фиксирует копию инвентаря или число endpoint.

Данные и транзакции описаны в [backend / data](../../backend/docs/40-data/INDEX.md); точный runtime-объект найдите в [COVERAGE](../../backend/docs/COVERAGE.md).

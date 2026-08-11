---
title: Архитектура backend
type: architecture
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/docs/10-architecture/Layers.md
  - ../../backend/openapi/openapi.json
---

# Архитектура backend

Backend — единственный владелец HTTP API, предметных правил и PostgreSQL.
Локальная [архитектура](../../backend/docs/10-architecture/Layers.md) описывает
controller → use case → port → adapter и DI-сборку модулей.

Он реализует OTP/session и `/me`, публичное и административное меню, создание
customer-заказа и health; полный список 22 путей — [локальная карта API](../../backend/docs/50-api/_MOC-api.md)
и [OpenAPI](../../backend/openapi/openapi.json). Чтение истории заказа, переходы
стадий, отдельные Users/Availability/Audit HTTP-модули не опубликованы: они не
являются текущими API-возможностями. [Реестр покрытия](../../backend/docs/COVERAGE.md).

Границы данных, транзакций, auth security и эксплуатационные свойства принадлежат
локальным нотам [данных](../../backend/docs/40-data/PostgreSQL-and-migrations.md),
[авторизации](../../backend/docs/30-domains/Auth.md), [заказов](../../backend/docs/30-domains/Orders.md)
и [операций](../../backend/docs/60-operations/Run-and-environment.md).

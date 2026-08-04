---
title: Архитектура backend
description: Целевые модули и слои backend Expressa.
type: architecture
area: architecture
status: current
tags: [expressa, backend, nestjs]
updated: 2026-07-26
---

# Архитектура backend

- **TR-REP-001.** Репозиторий `backend` использует NestJS, TypeScript, npm, базу знаний по требованиям раздела 2.3, тесты и pipeline.
- **TR-DATA-001.** Backend использует PostgreSQL и последовательные миграции схемы.

## 16. Архитектура backend

### 16.1. Модули

- `ConfigModule` — конфигурация и проверка окружения;
- `DatabaseModule` — подключение, миграции, транзакции;
- `AuthModule` — OTP, SMS-адаптер, сессии;
- `UsersModule` — роли и эксплуатационные команды;
- `CatalogModule` — категории, товары, варианты и добавки;
- `OrdersModule` — корзинная проверка, заказ, стадии и история;
- `AvailabilityModule` — оперативная доступность и приём новых заказов;
- `AuditModule` — аудит действий сотрудников;
- `HealthModule` — readiness и liveness;
- `ObservabilityModule` — request ID, структурированные журналы и метрики.

### 16.2. Слои

Каждый бизнес-модуль использует слои:

1. transport/controller;
2. application/use case;
3. domain rules;
4. persistence adapter;
5. external adapter.

Контроллеры выполняют разбор запроса и передачу в сценарий. Доменная логика стадий, цены и доступности размещается в сервисах предметной области.

### 16.3. Аутентификация

`AuthModule` предоставляет телефонную OTP-аутентификацию и текущую сессию. Контроллеры задают HTTP-границу, сценарии управляют жизненным циклом кода и сессии, PostgreSQL-адаптер атомарно резервирует код и изменяет сессию, а внешние адаптеры создают криптографические значения и доставляют SMS.

Проверка защищённого запроса сверяет Bearer access token с активной сессией и актуальной ролью пользователя в БД; роль из устаревшего токена не даёт доступ. Refresh token хранится только как хеш в сессии, при обновлении ротируется, а cookie ограничена `HttpOnly`, `SameSite=Strict` и путём `/api/v1/auth`; для всех сред, кроме `local`, используется `Secure`.

В `local` и `development` адаптер использует шестизначный `AUTH_DEVELOPMENT_OTP`; в `staging` и `production` код генерируется криптографически и отправляется через SMS.RU. Полный HTTP-контракт является источником истины в [API аутентификации](../50-interfaces/Authentication-API.md).

### 16.4. Публичное меню

`CatalogModule` предоставляет только read-model `GET /api/v1/public/menu`. PostgreSQL-адаптер одним набором упорядоченных выборок читает категории, товары, варианты, группы и варианты добавок, а сценарий собирает вложенный публичный контракт и отсекает непубликуемые или некорректные конфигурации. Полная HTTP-схема — [OpenAPI](../../backend/openapi/openapi.json), краткая граница — [API меню](../50-interfaces/Menu-API.md).

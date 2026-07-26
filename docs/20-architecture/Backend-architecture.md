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

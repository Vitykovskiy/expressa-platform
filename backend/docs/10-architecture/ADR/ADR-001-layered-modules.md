---
title: ADR-001 Слоистые предметные модули
type: adr
owner: backend
last_verified: 2026-08-11
sources:
  - ../../../src/app.module.ts
  - ../../../src/auth/auth.module.ts
---

# ADR-001: слоистые предметные модули

## Контекст

Сервер одновременно обслуживает HTTP-контракты и предметные правила, которым
нужны проверяемые границы с PostgreSQL и SMS.

## Решение

Каждый предметный модуль использует transport/application/domain/adapters.
NestJS DI связывает порты с адаптерами в модуле.

## Последствия

Domain и application тестируются без HTTP-сервера и конкретной базы. Контроллеры
не содержат SQL или предметные правила. Текущее описание исполнения —
[Layers](../Layers.md).

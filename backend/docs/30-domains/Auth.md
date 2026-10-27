---
title: "Авторизация и сессии"
type: domain
owner: backend
last_verified: 2026-10-27
sources:
  - ../../src/auth/transport/auth.controller.ts
  - ../../src/auth/application/logout.use-case.ts
  - ../../src/auth/adapters/postgres-auth.repository.ts
  - ../../src/staff-users/staff-users.module.ts
  - ../../../docs/20-architecture/ADR/ADR-017-account-memberships-and-session-context.md
knowledge_role: implementation
scope: backend
---

# Авторизация и сессии

## Целевой identity-контракт

[ADR-017](../../../docs/20-architecture/ADR/ADR-017-account-memberships-and-session-context.md)
задаёт независимые customer/employee-участия одного аккаунта и фиксированный
контекст сессии. Исходники реализуют эту модель; полный DoD и независимая
приёмка интеграции остаются отдельными проверками.
Один подробный владелец каждого контракта:

- [Identity-and-access](../../../docs/30-domain/Identity-and-access.md): account,
  каноническое имя, регистрация, авторизация, рабочий/global block, lock order,
  аудит, отзыв и контекст push.
- [Authentication API](../../../docs/50-interfaces/Authentication-API.md): auth v2,
  обязательные nullable memberships/context, legacy scalar projection, новые
  employees/customers v3, сохранённые users-команды, ошибки и публикация.
- [PostgreSQL](../40-data/PostgreSQL-and-migrations.md): точные целевые таблицы/FK,
  одноразовая инициализация, bootstrap и существующая CLI.

Transport вызывает application/domain; SQL остаётся в persistence adapters.
Auth, registration, staff transactions, guards, notification hydration/transfer
и CLI используют согласованную модель; authoritative `users.role` и `user_role`
удалены из текущей схемы и runtime SQL-потребителей. Проекцию старого role
строит только response boundary. Новый guard не доверяет ей.

У customer-контекста v2 push inspect/association/delete остаются доступными
до завершения регистрации. Customer-список и заказы требуют завершённого
участия; registration требует только customer-контекст. Эти политики нельзя
заменить общей проверкой «у аккаунта есть роль/имя/customer».

## Наблюдаемая граница исходников

На 2026-10-27 текущие `schema.sql`, auth DTO/guard и staff transport используют
независимые участия и фиксированный контекст. OTP создаёт только account;
registration добавляет customer. Новые employees/customers-проекции отделены
от сохранённого account API users. Это описание исходников, не положительный
вердикт полного DoD или пользовательской приёмки.
[Auth repository](../../src/auth/adapters/postgres-auth.repository.ts),
[RolesGuard](../../src/auth/transport/roles.guard.ts),
[DTO](../../src/auth/transport/auth.dto.ts),
[staff controller](../../src/staff-users/transport/staff-users.controller.ts).

Текущие v2 OTP/refresh/logout/me остаются опубликованными.
Logout controller/use case/repository сохраняют
[ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md),
с контекстным уточнением активной ветки по ADR-017. Подключение модулей,
OpenAPI/snapshot-публикация и ручная API/БД-проверка имеют собственные
доказательства; чтение исходников их не заменяет. Независимая приёмка полного
результата не подтверждена; полный typecheck сохраняет ошибки неизменённых
spec-исходников, которые запрещено исправлять без прямого запроса пользователя.

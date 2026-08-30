---
title: Слои и модули backend
type: architecture
area: backend
status: current
owner: backend
last_verified: 2026-08-11
sources:
  - ../../src/app.module.ts
  - ../../src/auth/auth.module.ts
  - ../../src/catalog/catalog.module.ts
  - ../../src/orders/orders.module.ts
---

# Слои и модули

Backend принимает HTTP и сохраняет предметные правила вне NestJS. `platform`
собирает конфигурацию, PostgreSQL, health и наблюдаемость; `auth`, `catalog` и
`orders` регистрируются как предметные модули. [Состав приложения](../../src/app.module.ts).

## Поток запроса

Контроллер валидирует транспортные данные, вызывает один use case и переводит
результат в HTTP. Use case координирует доменную проверку и порт; адаптер
реализует порт через PostgreSQL или SMS. NestJS DI связывает их в модуле, поэтому
domain/application не знают HTTP, декораторы или драйвер базы.
[Auth module](../../src/auth/auth.module.ts), [Catalog module](../../src/catalog/catalog.module.ts),
[Orders module](../../src/orders/orders.module.ts).

| Вход                             | Сценарий и порт                                                                              | Адаптер/выход                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `AuthController`, `MeController` | OTP, verify, refresh, logout, current user; `AuthRepository`, crypto, clock, sender          | PostgreSQL, Node crypto, development OTP/SMS.ru; HTTP token/cookie. [auth](../../src/auth/auth.module.ts) |
| catalog controllers              | чтение меню и управление категориями, товарами, модификаторами; репозитории и command runner | PostgreSQL, аудит в той же транзакции. [catalog](../../src/catalog/catalog.module.ts)                     |
| `OrdersController`               | создание заказа; `OrderUnitOfWork`                                                           | PostgreSQL-транзакция, снимок заказа. [orders](../../src/orders/orders.module.ts)                         |
| health controller                | liveness/readiness                                                                           | процесс и PostgreSQL. [health](../../src/platform/health/health.controller.ts)                            |

Границы проверяют unit-спеки use case и адаптеров; e2e проверяют HTTP-цепочку.
[Тесты auth](../../src/auth/application/verify-otp.use-case.spec.ts),
[e2e](../../test/e2e/auth.e2e-spec.ts).

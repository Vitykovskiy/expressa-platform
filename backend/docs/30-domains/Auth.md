---
title: Авторизация, сессия и текущий пользователь
type: feature
owner: backend
implementation_status: current
last_verified: 2026-08-11
sources:
  - ../../src/auth/transport/auth.controller.ts
  - ../../src/auth/transport/session.guard.ts
  - ../../src/auth/application/verify-otp.use-case.ts
---

# Авторизация, сессия и `/me`

Пользователь запрашивает OTP, подтверждает его и получает короткий Bearer access
token плюс refresh-cookie. `/me` читает текущую непросроченную сессию; logout
отзывает её и очищает cookie. [Контроллеры](../../src/auth/transport/auth.controller.ts),
[`/me`](../../src/auth/transport/me.controller.ts).

## Поток и безопасность

`RequestOtpUseCase` нормализует телефон, создаёт challenge и отправляет код;
`VerifyOtpUseCase` проверяет срок и попытки, создаёт пользователя/сессию,
подписывает access token. Refresh поворачивает refresh token, logout отзывает
сессию. [OTP policy](../../src/auth/domain/otp-policy.ts),
[verify](../../src/auth/application/verify-otp.use-case.ts),
[refresh](../../src/auth/application/refresh-session.use-case.ts).

Cookie имеет `HttpOnly`, `SameSite=Strict`, путь refresh и `Secure` во всех
окружениях, кроме значения `NODE_ENV=local`. Refresh/logout требуют допустимый точный Origin; session guard
проверяет Bearer claims и активную сессию в БД. [Cookie](../../src/auth/transport/auth-cookie.ts),
[OriginGuard](../../src/auth/transport/origin.guard.ts),
[SessionGuard](../../src/auth/transport/session.guard.ts),
[проверка окружения](../../src/platform/config/environment.spec.ts).

Роли: `customer`, `barista`, `administrator`; `Customer` допускает только
customer, `Staff` — barista/administrator, `Administrator` — администратора.
Эти правила применяют защищённые контроллеры, а `/me` возвращает id, телефон и
роль. [RolesGuard](../../src/auth/transport/roles.guard.ts),
[схема ролей](../../migrations/0002_e01_core_schema.sql).

В local/development один adapter выдаёт development OTP; в staging/production
код генерируется криптографически и отправляется SMS.ru. Секреты не попадают в
документацию. [Сборка adapters](../../src/auth/auth.module.ts),
[переменные](../../.env.example).

Проверки: unit покрывают OTP, refresh, guards и cookie; e2e — безопасные ошибки,
role, `/me`, rotation и logout. [unit](../../src/auth/application/request-otp.use-case.spec.ts),
[e2e](../../test/e2e/auth.e2e-spec.ts).

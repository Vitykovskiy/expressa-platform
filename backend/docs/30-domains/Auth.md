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

Выдача OTP сначала применяет 60-секундный UX cooldown, затем в одной
транзакции резервирует часовые лимиты номера, доверенного адреса источника и
общего SMS-провайдера. Отклонённый cooldown не изменяет security budget;
`Retry-After` всегда является фактическим остатком применённого окна.

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
[схема ролей](../../schema.sql).

В local/development один adapter выдаёт development OTP. Staging и production
не входят в поддерживаемый путь поставки. Секреты не попадают в документацию.
[Сборка adapters](../../src/auth/auth.module.ts),
[переменные](../../.env.example).

Проверки: unit покрывают OTP, refresh, guards и cookie; интеграционные — безопасные ошибки,
role, `/me`, rotation и logout. [unit](../../src/auth/application/request-otp.use-case.spec.ts),
[команды integration-проверок](../../package.json).

## Accepted target: customer logout с browser capability

Текущий runtime отзывает только refresh-сессию. Целевой совместимый logout
принимает необязательное pushSubscription. Объект содержит только непустой
absolute HTTPS endpoint и keys с непустыми string p256dh/auth; expirationTime и
неизвестные поля request/object/keys дают 400 VALIDATION_ERROR. Если объект передан, auth repository
в одной PostgreSQL transaction блокирует и проверяет refresh-session, получает
user_id, удаляет только совпавшую строку user_id + endpoint + p256dh + auth,
отзывает session и commit. null и отсутствующее поле не удаляют subscription.

Отсутствующая/чужая строка не является ошибкой и не раскрывается. Validation
происходит до transaction; storage failure откатывает оба эффекта и cookie не
очищается. Повтор той же session id/hash после потерянного ответа идемпотентен;
иной hash не авторизует replay. Object-body с
missing/malformed/expired/mismatched credential выполняет capability-only
удаление точной endpoint + keys association независимо от owner и возвращает
204 с очисткой cookie; неизвестная session не отзывается. Session storage
failure — 503 без очистки. Exact same-id/hash replay — 204.
null/omitted legacy ветка сохраняет 204+clear для invalid credential и 503 без
clear для storage failure. Её 204 гарантирует только caller session logout.
Object 204 дополнительно гарантирует отсутствие точной backend association;
server-session revocation подтверждается только active-session/exact-replay.
Это accepted target, ещё не реализованный
runtime contract. [System API](../../../docs/50-interfaces/Authentication-API.md),
[notifications domain](Notifications.md).

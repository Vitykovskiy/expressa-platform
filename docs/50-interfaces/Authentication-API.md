---
title: "API аутентификации"
type: interface
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/openapi/openapi.json
  - ../../backend/src/auth/transport/auth.controller.ts
knowledge_role: implementation
scope: system
---

# API аутентификации

Контракт: `POST /api/v2/auth/otp/request` возвращает `202` metadata;
`POST /api/v2/auth/otp/verify` и `POST /api/v2/auth/refresh` возвращают `200`
Bearer access token; `POST /api/v2/auth/logout` возвращает `204`; `GET /api/v2/me`
требует Bearer. Некорректный input — `400 VALIDATION_ERROR`, неверный или
устаревший OTP — соответственно `401 AUTH_CODE_INVALID` и
`401 AUTH_CODE_EXPIRED`, cooldown — `429 AUTH_RATE_LIMITED`, недоступность
delivery/session — `503 SERVICE_UNAVAILABLE`. Ошибки имеют форму
`{ code, message, details, requestId }`; `429` содержит целочисленный
`Retry-After` в секундах с фактическим остатком cooldown.

Verify и refresh выдают `Set-Cookie` для host-only `expressa_refresh` с
`HttpOnly`, `SameSite=Strict`, path `/api/v2/auth` и `Secure` вне local;
logout очищает эту cookie. Refresh cookie ротируется при refresh. [Источники: controller](../../backend/src/auth/transport/auth.controller.ts), [cookie](../../backend/src/auth/transport/auth-cookie.ts).

Refresh/logout защищены OriginGuard; `/me` и защищённые бизнес-методы проверяет
session guard. Front- и back-office используют одинаковые endpoint-пути, но
локально владеют экранным состоянием. [Источники: controller](../../backend/src/auth/transport/auth.controller.ts), [front consumer](../../front-office/src/shared/api/auth.api.ts).

## Первое имя клиента

Целевой контракт текущей доработки: после OTP клиент с `name=null` один раз
вводит имя; повторный вход клиента с именем не повторяет этот шаг.
`GET /api/v2/me` и `POST /api/v2/me/registration` возвращают прежние `id`,
`phoneE164`, `role` и обязательное `name: string | null` для всех ролей.
Отсутствие поля не равно `null` и считается нарушением контракта клиентом.

Новая команда `POST /api/v2/me/registration` требует Bearer и роль Customer.
Тело — только `{name: string}`: внешние пробелы обрезаются, пустая строка,
нестроковое значение и любые другие поля дают `400 VALIDATION_ERROR`.
Одна буква, Unicode, внутренние пробелы, апострофы и дефисы разрешены;
произвольный минимум длины или алфавитное ограничение не вводятся.

В одной транзакции блокируются user, затем session и заново проверяются
текущие subject, роль, блокировка, срок и отзыв сессии. Недействительная
идентичность даёт 401, сотрудник — 403, сбой хранения —
`503 SERVICE_UNAVAILABLE`. Записывается только отсутствующее имя. Повторная
или конкурентная команда возвращает первое сохранённое имя и не заменяет его.
Ответ — `200 CurrentUserDto`. Телефон, роли, OTP, cookie и сроки сессии эта
команда не меняет. Это завершение регистрации, а не редактирование профиля.

Публикация OpenAPI и наблюдение работающего сценария выполняются после
интеграции исходников; описание целевого контракта не подтверждает эти этапы.

## Current customer logout

Logout требует JSON body с обязательным полем `pushSubscription:
PushSubscription | null`. Body или поле без значения отклоняются как
`400 VALIDATION_ERROR`; других форм payload нет.

Объект содержит только endpoint — непустой absolute HTTPS URL — и keys с
непустыми string p256dh/auth. expirationTime не принимается. Неизвестные поля
на уровнях request, pushSubscription и keys дают 400 VALIDATION_ERROR.

Для переданного объекта backend в одной PostgreSQL transaction проверяет и
блокирует refresh-сессию, получает её user_id, удаляет только совпавшую
user_id + endpoint + p256dh + auth строку и отзывает сессию. Совпадение не
обязательно: отсутствие строки и другой owner дают тот же 204 без раскрытия.
null отзывает только сессию. Ошибка DTO возвращает существующий
400 VALIDATION_ERROR; ошибка storage — 503 SERVICE_UNAVAILABLE, transaction
откатывается и refresh-cookie не очищается. Успешный 204 очищает cookie.
Object является capability-proof. При active refresh-session transaction
удаляет только association этого user и отзывает session. При
missing/malformed/expired/mismatched refresh credential transaction удаляет
только точную endpoint + p256dh + auth association независимо от owner, не
отзывает неизвестную session и возвращает 204 с очисткой cookie. Ответ не
раскрывает наличие/owner строки. Exact replay также возвращает 204. Storage
failure возвращает 503 и не очищает cookie.

Таким образом, structurally valid object-body не имеет credential-401 ветки:
без session-proof он использует capability-only privacy fallback. Его 204
гарантирует caller session logout — cookie очищена — и отсутствие точной
backend association. Server-session revocation дополнительно гарантирована
только для active-session или exact-replay ветки; invalid proof не позволяет
утверждать отзыв неизвестной server session. Local PushSubscription и browser
permission не меняются.

`null` означает текущий session-only logout.

Customer front-office обязан передать объект после надёжного чтения локальной
подписки либо null после подтверждённого отсутствия/unsupported Push API.
Если чтение невозможно, он не вызывает logout и не заявляет успех.
[Решение](../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md).

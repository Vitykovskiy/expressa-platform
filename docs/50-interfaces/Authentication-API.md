---
title: "API аутентификации"
type: interface
owner: root
last_verified: 2026-10-27
sources:
  - ../20-architecture/ADR/ADR-017-account-memberships-and-session-context.md
  - ../../backend/openapi/openapi.json
  - ../../backend/src/auth/transport/auth.controller.ts
  - ../../backend/src/staff-users/transport/staff-users.controller.ts
knowledge_role: requirements
scope: system
---

# API аутентификации

Ниже — HTTP-контракт [ADR-017](../20-architecture/ADR/ADR-017-account-memberships-and-session-context.md).
Текущий [OpenAPI](../../backend/openapi/openapi.json) и одинаковые клиентские snapshots
публикуют ресурсы сотрудников/клиентов и обязательные поля context/customer/employee профиля.
Это подтверждает публикацию контракта; полные статические проверки, runtime-проверка
и пользовательская приёмка оцениваются отдельно.
Доменные условия, атомарность, отзыв и lock order имеют одного владельца —
[Identity-and-access](../30-domain/Identity-and-access.md); здесь определены
transport, DTO и совместимость. Наличие текста не означает runtime-приёмку.

## OTP, токены и cookie

| Метод                           | Тело / результат                                                                |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `POST /api/v2/auth/otp/request` | `{phone:string}`; `202 {expiresInSeconds:number,retryAfterSeconds:number}`      |
| `POST /api/v2/auth/otp/verify`  | `{phone:string,code:string,context?:'customer'\|'staff'}`; `200 AccessTokenDto` |
| `POST /api/v2/auth/refresh`     | refresh cookie; `200 AccessTokenDto`                                            |
| `POST /api/v2/auth/logout`      | обязательный body ниже; `204`                                                   |
| `GET /api/v2/me`                | Bearer; `200 CurrentUserDto`                                                    |

`AccessTokenDto={accessToken:string,tokenType:'Bearer',expiresInSeconds:number}`.
Телефон/код, общая OTP-защита, сроки и token shape сохраняются. Оба клиента
всегда передают явный свой `context`. Если поле отсутствует у опубликованного
caller, под account lock один раз выбирается staff при текущем включённом
employee, иначе customer. Неверно переданный context, включая null, не запускает
это правило и даёт `400 VALIDATION_ERROR`. Новый телефон создаёт только account,
без customer/employee. Staff-context без доступного employee может получить
профиль для denied UI, но не бизнес-доступ. Global block сохраняет обычный
отказ OTP без раскрытия статуса/существования аккаунта.

Некорректный input — `400 VALIDATION_ERROR`; неверный/устаревший OTP —
`401 AUTH_CODE_INVALID` / `401 AUTH_CODE_EXPIRED`; cooldown/security throttle —
`429 AUTH_RATE_LIMITED`; недоступность delivery/session — `503 SERVICE_UNAVAILABLE`.
Ошибки имеют форму `{code,message,details,requestId}`; `429` содержит целочисленный
`Retry-After` в секундах с фактическим остатком соответствующего ограничения.

Verify/refresh выдают host-only `expressa_refresh` с `HttpOnly`, `SameSite=Strict`,
path `/api/v2/auth` и `Secure` вне local. Refresh ротирует cookie, сохраняя
исходный session context; logout очищает её только по правилам ниже.
Refresh/logout защищены OriginGuard, `/me` и бизнес-методы — SessionGuard.
[Источник cookie](../../backend/src/auth/transport/auth-cookie.ts).
[Ограничение общего host](../30-domain/Identity-and-access.md#контекст-и-политики)
не снимается добавлением context.

## Профиль и совместимое поле role

`GET /api/v2/me` и `POST /api/v2/me/registration` возвращают обязательные поля:

| Поле CurrentUserDto | Форма                                                                         |
| ------------------- | ----------------------------------------------------------------------------- |
| `id`, `phoneE164`   | account UUID, нормализованный телефон                                         |
| `name`              | `string\|null`                                                                |
| `context`           | `'customer'\|'staff'`                                                         |
| `customer`          | `null\|{registeredAt:ISO}`                                                    |
| `employee`          | `null\|{role:'barista'\|'administrator',accessEnabled:boolean}`               |
| `role`              | опубликованный enum `'customer'\|'barista'\|'administrator'`, только проекция |

В customer-контексте `role=customer`. В staff-контексте включённого employee
это текущая staff-роль; в denied staff-контексте — `customer`. Проекция строится
только на response boundary; она не хранится в account и не доказывает участие
или право. Новые клиенты проверяют полные `context/customer/employee` и не
используют scalar role для авторизации. Отсутствие обязательного поля — ошибка
контракта, не null, не регистрация и не разрешение. `employee.accessEnabled`
отражает участие; global block вообще не допускает действующую сессию.
Удаление опубликованного поля role требует отдельного breaking-решения.

## Первое имя клиента

`POST /api/v2/me/registration` требует действующий customer-context Bearer,
включая employee без customer-участия. Staff-контекст даёт `403 ACCESS_DENIED`.
Тело ровно `{name:string}`: trim, непустая строка; неизвестные поля,
нестроковое/пустое имя — `400 VALIDATION_ERROR`. Одна буква, Unicode, внутренние
пробелы, апострофы и дефисы разрешены без произвольного минимума/алфавита.

Под account/session locks повторно проверяются subject, ownership, context,
срок/отзыв сессии и global block. Уже существующий customer возвращает сохранённый
профиль без перезаписи имени. При первом enrollment заполняется только null-имя
и атомарно вставляется customer. Отличающееся существующее каноническое имя
даёт `409 USER_NAME_CONFLICT`. Повтор/конкурентная команда сходятся к первому
завершению. Наличие имени без customer не означает завершённую регистрацию.
Недействительная сессия — `401`, storage failure — `503 SERVICE_UNAVAILABLE`.
Успех — `200 CurrentUserDto`; staff-права, телефон, cookie и сроки не меняются.

## Административные проекции и команды

Все маршруты этого раздела требуют Administrator; команды дополнительно
проверяют актуального actor/session внутри транзакции по доменному контракту.
`userId` — account UUID. Телефон создания — `+7XXXXXXXXXX`, имя — непустая
строка. Staff-роль строго `barista|administrator`, без customer/null.
Неизвестные поля body, неверные типы/ID/значения и отсутствие обязательных полей
дают `400 VALIDATION_ERROR`.

| Метод                                                | Вход                                                           | Успех                           |
| ---------------------------------------------------- | -------------------------------------------------------------- | ------------------------------- |
| `GET /api/v3/backoffice/employees`                   | `search?:string,role?:barista\|administrator,blocked?:boolean` | `200 {employees:EmployeeDto[]}` |
| `POST /api/v3/backoffice/employees`                  | `{name,phoneE164,role}`                                        | `201 EmployeeDto`               |
| `PATCH /api/v3/backoffice/employees/{userId}/role`   | `{role:barista\|administrator}`                                | `200 EmployeeDto`               |
| `PATCH /api/v3/backoffice/employees/{userId}/access` | `{enabled:boolean}`                                            | `200 EmployeeDto`               |
| `GET /api/v3/backoffice/customers`                   | `search?:string`                                               | `200 {customers:CustomerDto[]}` |

Query принимает каждое разрешённое поле не более одного раза, строкой;
`blocked` — только `true|false`. Неверный, повторённый или неизвестный параметр
даёт 400. Search — буквальная подстрока имени/телефона, `%`/`_` не wildcard.
Оба списка сортируются по name NULLS LAST, phoneE164, id. `blocked` employees
фильтрует эффективный запрет работы: disabled employee ИЛИ global account block.

`EmployeeDto={id:uuid,name:string|null,phoneE164:string,
role:'barista'|'administrator',accessEnabled:boolean,accountBlocked:boolean,
createdAt:ISO,updatedAt:ISO}`. Timestamps принадлежат employee-участию;
`accessEnabled` — только рабочему состоянию, эффективный доступ равен
`accessEnabled && !accountBlocked`. `CustomerDto={id:uuid,name:string,
phoneE164:string,registeredAt:ISO}` содержит только завершивших регистрацию
клиентов с непустым именем; нет role/block/access и customer mutations.
Участия могут пересекаться с тем же ID/телефоном.

Enrollment переиспользует существующий customer-account, не перезаписывает
отличающееся имя (`409 USER_NAME_CONFLICT`). Существующий employee, в том числе
отключённый, — `409 USER_PHONE_CONFLICT`; не upsert. Global block цели —
`409 USER_ACCESS_CONFLICT`; восстановление рабочего доступа при нём также
отклоняется. Новый employee не создаёт customer. Role-команда сохраняет
access/customer/name; access-команда меняет только рабочий доступ.
[Отзыв, no-op и self/last-admin](../30-domain/Identity-and-access.md#рабочий-доступ-и-глобальная-блокировка)
обязательны для всех соответствующих команд.

Отсутствующее employee-участие — `404 USER_NOT_FOUND`; недействительная сессия —
401, недостаточные права — 403, бизнес-конфликты — 409 с
`USER_PHONE_CONFLICT|USER_NAME_CONFLICT|USER_ACCESS_CONFLICT`; неожиданный storage
сбой административной команды — безопасный 500 в общей форме ошибки.
Неопределённый transport result не считается успехом мутации.

## Опубликованные account routes users

Существующие `/api/v3/backoffice/users` сохраняются. Это account API с одним
внутренним владельцем участий, не источник строк новых вкладок и не второе
хранилище роли. `StaffUserDto` сохраняет account-поля
`id,name:string|null,phoneE164,role,blocked,createdAt,updatedAt` и добавляет
обязательные `customer`/`employee` точно в формах CurrentUserDto выше.
Его `role` — включённая employee-роль, иначе customer; `blocked` — ГЛОБАЛЬНЫЙ
account block; timestamps — account timestamps.

| Сохранённый маршрут                             | Целевая семантика                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v3/backoffice/users`                  | `search?,role?:customer\|barista\|administrator,blocked?`; прежние строгие query, literal search и сортировка; `200 {users:StaffUserDto[]}`. Role-filter применяется к проекции, blocked — к global block                                                                                                                          |
| `POST /api/v3/backoffice/users`                 | обязательные `{name,phoneE164,role:customer\|barista\|administrator}`; `201 StaffUserDto`. Дубликат account phone — `409 USER_PHONE_CONFLICT`, без переиспользования. customer создаёт named account+customer; staff — account+employee                                                                                            |
| `PATCH /api/v3/backoffice/users/{userId}/role`  | `{role:customer\|barista\|administrator}`; `200 StaffUserDto`. Staff-значение даёт/меняет employee, сохраняет customer и не включает ранее disabled employee. customer отключает рабочий доступ существующего employee; завершает customer-участие только при настоящем account name, иначе регистрация остаётся обычному сценарию |
| `PATCH /api/v3/backoffice/users/{userId}/block` | `{blocked:boolean}`; `200 StaffUserDto`; глобальная блокировка/разблокировка, не рабочая кнопка                                                                                                                                                                                                                                    |

Ошибки validation/auth/forbidden/not-found/conflict/storage и self/last-admin
защита сохраняются как выше. No-op определяется итогом memberships/access,
не равенством scalar projection: явно запрошенное отсутствующее участие
добавляется по этим правилам. Рабочие изменения используют staff-only отзыв;
global block — all-context отзыв. Новые клиенты не используют старые scalar
команды для вкладок или рабочего блокирования. Customer administration UI
не добавляется из-за существования account API.

## Push v2 и публикация

Существующие push inspect/association/delete сохраняют paths/body/success DTO
и error envelope v2. Действующий незаблокированный customer-context session
допустим при `customer=null`; отсутствие регистрации само по себе не даёт 403.
Staff-context требует включённого barista. Session/proof/CAS/ownership ошибки,
включая cross-context `PUSH_ASSOCIATION_CONFLICT`, не ослабляются.
[Полный контекстный контракт](../30-domain/Identity-and-access.md#push-и-logout)
не позволяет выводить регистрацию из push-success; нового invitation UI нет.

Изменение auth v2 добавочное; новые административные ресурсы v3 соседствуют
с existing users v3. Каталог/заказы v2/v3 и существующие endpoint не удаляются.
Публикующий владелец обновляет DTO/decorators/backend OpenAPI, точные prefix
exclusions для `api/v3/backoffice/employees`,
`api/v3/backoffice/employees/:userId/role`,
`api/v3/backoffice/employees/:userId/access`, `api/v3/backoffice/customers`
в [HTTP-конфигурации](../../backend/src/platform/http/http-configuration.constants.ts),
проверяет фактические пути и копирует публикацию в оба client snapshot через
существующий `openapi:sync`. Тексты OpenAPI различают push-authentication и
customer-регистрацию. [Правила публикации](../20-architecture/Cross-repository-contracts.md)
сохраняют front `contract:check`; отсутствующий BO checker не создаётся.
До этой публикации целевой документ не является заявлением о её выполнении.

## Current customer logout

Logout требует JSON body с обязательным полем `pushSubscription:
PushSubscription | null`. Body или поле без значения отклоняются как
`400 VALIDATION_ERROR`; других форм payload нет.

Объект содержит только endpoint — непустой absolute HTTPS URL — и keys с
непустыми string p256dh/auth. expirationTime не принимается. Неизвестные поля
на уровнях request, pushSubscription и keys дают 400 VALIDATION_ERROR.

Для переданного объекта backend в одной PostgreSQL transaction проверяет и
блокирует refresh-сессию, получает её user_id, удаляет только совпавшую
user_id + context + endpoint + p256dh + auth строку и отзывает сессию. Совпадение не
обязательно: отсутствие строки и другой owner дают тот же 204 без раскрытия.
null отзывает только сессию. Ошибка DTO возвращает существующий
400 VALIDATION_ERROR; ошибка storage — 503 SERVICE_UNAVAILABLE, transaction
откатывается и refresh-cookie не очищается. Успешный 204 очищает cookie.
Object является capability-proof. При active refresh-session transaction
удаляет только association этого user и context и отзывает session. При
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

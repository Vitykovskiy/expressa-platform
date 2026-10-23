---
title: "Авторизация и сессии"
type: domain
owner: backend
last_verified: 2026-10-21
sources:
  - ../../src/auth/transport/auth.controller.ts
  - ../../src/auth/application/logout.use-case.ts
  - ../../src/auth/adapters/postgres-auth.repository.ts
  - ../../src/staff-users/staff-users.module.ts
  - ../../../docs/20-architecture/ADR/ADR-012-back-office-source-contract.md
knowledge_role: implementation
scope: backend
---

# Авторизация и сессии

## Первое имя customer

Целевое изменение: `GET /api/v2/me` возвращает обязательное nullable `name`
наряду с текущей идентичностью для любой роли. Новый name-only
`POST /api/v2/me/registration` завершает customer-регистрацию после OTP;
его [HTTP-контракт](../../../docs/50-interfaces/Authentication-API.md#первое-имя-клиента)
не меняет запрос/проверку OTP, refresh, logout или схему.

Имя записывается только при `users.name IS NULL`. Транзакция блокирует user,
затем session и проверяет действующую customer-идентичность заново. Повторы
возвращают уже сохранённое имя, не перезаписывая его. Остальные роли не могут
заполнить имя этим endpoint. `/me` не превращает отсутствие поля в null.
Штатная проекция заказов читает `users.name`; изменения staff UI не нужны.
Исходники и общий runtime/API-публикация принимаются раздельно.

Текущие маршруты авторизации остаются в v2: запрос / проверка OTP, refresh, logout с обязательным body и `me`. Точный HTTP-контракт принадлежит [OpenAPI](../../openapi/openapi.json), карта — [API аутентификации](../../../docs/50-interfaces/Authentication-API.md).

Logout принимает `pushSubscription: null | object`. Транзакционные ветки, повтор запроса и условия очистки cookie описаны в [ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md). Их реализация: [controller](../../src/auth/transport/auth.controller.ts), [use case](../../src/auth/application/logout.use-case.ts), [repository](../../src/auth/adapters/postgres-auth.repository.ts).

## Пользователи back-office и отзыв доступа

[Целевой контракт ADR-012](../../../docs/20-architecture/ADR/ADR-012-back-office-source-contract.md)
расширяет прежнее управление сотрудниками только через эксплуатацию.
[StaffUsersModule](../../src/staff-users/staff-users.module.ts) реализует
административные операции:

- `GET /api/v3/backoffice/users`: `{users: StaffUserDto[]}`; параметры `search`,
  `role`, `blocked` необязательны. Поиск — буквальная подстрока имени или
  телефона, без wildcard-семантики `%` и `_`. Повторённый, неизвестный или
  некорректный параметр даёт 400.
- `POST /api/v3/backoffice/users`: обязательные `name`, `phoneE164`, `role`;
  201 с созданным пользователем. Телефон строго `+7XXXXXXXXXX`, имя непустое.
  Дубликат телефона — `409 USER_PHONE_CONFLICT`, без upsert.
- `PATCH /api/v3/backoffice/users/{userId}/role`: `{role}`.
- `PATCH /api/v3/backoffice/users/{userId}/block`: `{blocked: boolean}`.

DTO содержит только `id`, `name: string | null`, `phoneE164`, `role`, `blocked`,
`createdAt`, `updatedAt` (ISO). Секреты OTP, access и refresh в него не входят.
OTP и CLI могут создавать аккаунт без имени, API создания требует имя.
Существующие DTO авторизации не меняются.

Контроллер применяет `SessionGuard` и `RolesGuard` для Administrator ко всем
маршрутам; команды дополнительно проверяют текущего активного администратора
внутри транзакции. Неизвестный target — `404 USER_NOT_FOUND`.
Self block/self demotion и удаление последнего активного администратора
отказом в доступе запрещены: `409 USER_ACCESS_CONFLICT`.

Команды выполняются в одной транзакции с аудитом `audit_events` и глобальной
transaction advisory lock `expressa:staff-users:membership`. Роль/блокировка,
отзыв всех сессий и удаление push-привязок именно целевого пользователя
фиксируются вместе. Повтор той же роли или блокировки возвращает текущее
состояние без нового аудита. Разблокировка не восстанавливает старые сессии.
HTTP-аудит содержит проверенного actor и requestId.

`findSessionWithUser` и `findCurrentUser` исключают заблокированных пользователей
и читают текущую роль из БД. Проверка OTP блокирует строку аккаунта перед
созданием сессии и отказывает заблокированному аккаунту. Refresh сначала
блокирует user, затем session: этот порядок совпадает со сменой доступа,
чтобы не создать сеанс после блокировки и не получить взаимную блокировку
user/session. OTP для заблокированного пользователя остаётся стандартным
отказом проверки кода, без раскрытия статуса аккаунта.

Операционный `npm run staff -- upsert` использует тот же membership lock,
сохраняет name и блокировку существующего пользователя, отзывает доступ при
смене роли и защищает последнего активного администратора. Новый аккаунт
создаётся с `name=null`; no-op не пишет повторный аудит. Для CLI нет HTTP actor:
`actor_id` ссылается на изменяемый аккаунт, `request_id=operations:<uuid>` явно
отличает операционную команду от действия вошедшего пользователя.

Это описание исходников модуля. Подключение к приложению, генерация OpenAPI,
ручная HTTP-проверка и независимая приёмка выполняются в общей интеграции;
наличие модуля не подтверждает эти этапы.

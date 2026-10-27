---
title: "PostgreSQL и одноразовая инициализация"
type: data
owner: backend
last_verified: 2026-10-27
sources:
  - ../../schema.sql
  - ../../scripts/initialize-database.ts
  - ../../scripts/reset-test-database.ts
  - ../../scripts/seed.ts
  - ../../../docs/20-architecture/ADR/ADR-017-account-memberships-and-session-context.md
knowledge_role: implementation
scope: backend
---

# PostgreSQL и одноразовая инициализация

`schema.sql` — единственный декларативный источник актуальной PostgreSQL-схемы.
Поддерживаются только пустые одноразовые базы local, test и development:
сначала к ним применяется `npm run db:init`, затем `npm run seed`.
[Схема](../../schema.sql), [инициализатор](../../scripts/initialize-database.ts),
[seed](../../scripts/seed.ts).

Инициализатор отказывается работать, если в целевой базе уже есть прикладные
таблицы. Он не удаляет, не обновляет и не сохраняет строки. Сброс базы —
отдельная операция в явно настроенном disposable-контексте; для integration
проверок это [reset-test-database](../../scripts/reset-test-database.ts).

Истории миграций, таблицы `schema_migrations`, backfill, rollback и поддержка
поставки поверх заполненной базы отсутствуют намеренно. Если данным потребуется
переживать поставку, это требует нового архитектурного решения до включения
такой среды.

Схема хранит users, OTP/sessions, каталог, audit и заказы. Каталог и заказ
фиксируются в собственных транзакционных границах. [Catalog runner](../../src/catalog/adapters/postgres-catalog-command.runner.ts),
[Order unit of work](../../src/orders/adapters/postgres-order-unit-of-work.ts).

Seed детерминированно создаёт каноничное меню и bootstrap administrator при
`BOOTSTRAP_ADMIN_PHONE`. Повторный seed после инициализации сохраняет этот
каноничный набор. Staging и production не входят в поддерживаемую поставку.

## Данные полного back-office

Хранение аккаунта и участий уточняется целевым
[ADR-017](../../../docs/20-architecture/ADR/ADR-017-account-memberships-and-session-context.md).
Текущая схема содержит customers/employees и session/push context;
исключительная `users.role` удалена. Применимость схемы к конкретной базе
подтверждается её отдельной инициализацией, а не наличием этого описания.
Остальные данные ADR-012 сохраняются.

`orders` сохраняет прежние пять `order_stage`. Отказ — отдельные согласованные
`rejected_at`, `rejected_by`, `rejection_reason`, допустимые только при CREATED;
причина непустая. `pickup_slot_start` и `pickup_slot_end` либо оба отсутствуют,
либо образуют десятиминутное окно. Снимки позиций, суммы и история сохраняются.

`service_operating_settings` — отдельная singleton-строка с `id=1`, временем
открытия раньше закрытия, положительной целой вместимостью, парой nullable
`updated_at`/`updated_by`. Прежняя `service_settings.accepts_new_orders` не
заменяется. Seed вставляет 09:00–20:00, вместимость 5, без автора изменения;
повторный seed сохраняет уже существующие настройки. UTC — политика ADR-012,
а не часовой пояс браузера или дополнительный столбец таблицы.

Схема и seed создают хранение; серверные команды, аудит, распределение,
проверка блокировок и новые HTTP-проекции реализуются отдельными владельцами.

## Целевая схема аккаунта и участий

`schema.sql` остаётся единственным исполняемым декларативным источником;
эта секция описывает реализованный контракт хранения. Имя каноническое, без отдельного
имени клиента/сотрудника. Подробная семантика принадлежит
[Identity-and-access](../../../docs/30-domain/Identity-and-access.md).

| Таблица              | Целевые поля и ограничения                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`              | Сохранить `id`, unique нормализованный `phone_e164`, nullable `name` с непустым btrim, глобальные `blocked_at/blocked_by` с парной nullable-проверкой, account `created_at/updated_at`. После перевода всех SQL-потребителей удалить `users.role` и enum `user_role`                                                                                                                                                                                                  |
| `customers`          | `user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT`, `registered_at timestamptz NOT NULL`. Строка означает завершённую регистрацию; нет роли, отдельного имени или block-флага                                                                                                                                                                                                                                                                         |
| `employees`          | `user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT`, `role staff_role NOT NULL`, enum `barista\|administrator`; `access_disabled_at timestamptz NULL`, `access_disabled_by UUID NULL REFERENCES users(id) ON DELETE RESTRICT`; `created_at/updated_at`. Disabled timestamp/actor либо оба null, либо оба присутствуют. Enabled выводится из `access_disabled_at IS NULL`, отдельный flag не хранится. Роль и строка сохраняются после окончания работы |
| `sessions`           | Сохранить `user_id`, ID, refresh/revocation/timestamp-поля; добавить `context auth_context NOT NULL`, enum `customer\|staff`. Контекст фиксируется при создании; роль/permissions в session не хранятся                                                                                                                                                                                                                                                               |
| `push_subscriptions` | Сохранить `user_id`, глобально unique endpoint, proof keys, `association_version`; добавить `context auth_context NOT NULL`, получаемый из проверенной session, с одним владельцем/контекстом endpoint                                                                                                                                                                                                                                                                |

Customer-регистрация атомарно обеспечивает настоящее непустое account name
и customer row. Это application transaction invariant; межтабличный SQL CHECK
не объявляется механизмом его обеспечения. Наличие name не создаёт участие.
Нет удаления customer/employee через рабочие команды, HR reason/history-table
или второй account identity.

## Ссылки и история

`orders.customer_id` сохраняет UUID аккаунта, FK меняется с users на
`customers(user_id)`. Ownership и idempotency scope остаются account ID;
name/phone по-прежнему читаются из users. Значения order ID/customer ID,
снимки, события и keys не переназначаются рабочими операциями.

`users.blocked_by`, `employees.access_disabled_by`, `sessions.user_id`,
`push_subscriptions.user_id`, `audit_events.actor_id`,
`service_settings.updated_by`, `service_operating_settings.updated_by`,
`orders.rejected_by`, `order_events.actor_id` ссылаются на `users.id`.
Staff-row ID не заменяет actor; бывший сотрудник остаётся исторически валиден.
Остальные FK delete modes и индексы сохраняются, кроме названной смены
customer FK и новых membership/context ограничений.

Полный runtime SQL-переход охватывает OTP/refresh/me/registration, staff
administrator-count/phone conflict/mutations, order gates, push recipient/
transfer/hydration и seed/CLI. Lock order, rechecks и совместный rollback
определены [доменным контрактом](../../../docs/30-domain/Identity-and-access.md#транзакции-и-блокировки).
Это fresh-schema изменение; миграция заполненной базы, backfill, новая rollback
инфраструктура и production/staging rollout не входят в работу.

## Bootstrap и существующая CLI

Целевой seed сохраняет детерминированный каталог и создаёт для
`BOOTSTRAP_ADMIN_PHONE` account+employee administrator без customer-участия
и без выдуманного имени. Existing schema/seed presence checks включают новые
обязательные таблицы. Сохранение customer-истории при work disable проверяется
внутри жизненного цикла запущенного приложения и не отменяет одноразовость БД.

Из `backend` существующая команда
`npm run staff -- upsert --phone +7XXXXXXXXXX --role barista|administrator|customer`
сохраняет phone validation и upsert, но переводит роль в участия:

- `barista|administrator` присоединяет/меняет employee и сохраняет customer,
  существующее имя и GLOBAL block; disabled work access молча не включается.
- `customer` отключает существующий рабочий доступ. При настоящем имени
  обеспечивает customer-участие, без имени оставляет обычную регистрацию
  незавершённой. Новый unnamed account не получает выдуманного имени.

CLI использует те же membership-инварианты, блокировки, last-admin защиту
и отзыв по контексту; no-op не дублирует аудит. `actor_id` остаётся account
ID изменяемого аккаунта, `request_id=operations:<uuid>` отличает операционный
вызов от HTTP actor. Второй административный механизм/новая helper-команда
не создаётся. HTTP role=customer mapping определён в
[account API](../../../docs/50-interfaces/Authentication-API.md#опубликованные-account-routes-users).

В этой документационной партии БД, seed и CLI не запускались; тестовый reset
не разрешён. Schema/seed/runtime и OpenAPI принимаются отдельными владельцами.

---
type: domain
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/src/catalog
  - ../../backend/test/e2e/admin-catalog.e2e-spec.ts
---

# Аудит

Аудит фиксирует изменения каталога, сделанные сотрудником: actor, request id,
сущность, действие и состояние до/после. Command repositories вызывают
`writeAudit` через transaction runner; runner задаёт `BEGIN`, `COMMIT` и
`ROLLBACK`, а command repositories вставляют `audit_events` в переданном
transaction client. [Источники: runner](../../backend/src/catalog/adapters/postgres-catalog-command.runner.ts), [category repository](../../backend/src/catalog/adapters/postgres-categories.repository.ts), [modifier repository](../../backend/src/catalog/adapters/postgres-modifiers.repository.ts).

Аудит не делает availability или очередь заказов активными возможностями сам по
себе: их route/API-доступность определяется соответствующими контурами.
[Источник: back-office](../../back-office/docs/INDEX.md).

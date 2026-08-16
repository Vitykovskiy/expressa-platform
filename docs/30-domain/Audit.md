---
type: domain
owner: root
last_verified: 2026-08-16
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

Переходы заказа сохраняют отдельные `order_events` с сотрудником, временем и
исходной/целевой стадией. Управление доступностью и приёмом заказов записывает
`audit_events` в той же транзакции, что и изменение.
[Lifecycle repository](../../backend/src/orders/adapters/postgres-order-lifecycle.repository.ts),
[availability use case](../../backend/src/catalog/application/manage-availability.use-case.ts).

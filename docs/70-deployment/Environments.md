---
title: Среды поставки
type: operations
owner: root
last_verified: 2026-08-11
sources:
  - ../../deploy/compose.yml
  - ../../.github/workflows/development-delivery.yml
---

# Среды поставки

`development` поставляется после main, `staging` — по тегу `staging-v*`; обе
используют отдельные Compose project, сети и volume PostgreSQL на одном VPS.
[Development workflow](../../.github/workflows/development-delivery.yml),
[staging workflow](../../.github/workflows/staging-deploy.yml), [Compose](../../deploy/compose.yml).

Production-среда не реализована и не является поддерживаемым путём поставки.
[ADR-002](../20-architecture/ADR/ADR-002-delivery-topology.md).

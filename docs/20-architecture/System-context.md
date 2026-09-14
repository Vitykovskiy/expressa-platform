---
title: Контекст системы
type: architecture
owner: root
last_verified: 2026-08-11
sources:
  - ../../backend/openapi/openapi.json
  - ../../deploy/compose.yml
---

# Контекст системы

Customer использует front-office, сотрудник — back-office; оба клиента обращаются
к backend HTTP API. Backend хранит данные в PostgreSQL; поддерживаемый путь
сейчас ограничен local/test/development. [API](../../backend/openapi/openapi.json),
[auth configuration](../../backend/src/auth/auth.module.ts).

Поставка собирает backend, front-office, back-office и PostgreSQL как отдельные
контейнеры. [Compose](../../deploy/compose.yml), [одноразовая база](ADR/ADR-007-disposable-database-bootstrap.md).

---
title: "Порядок обновления"
type: convention
owner: backend
last_verified: 2026-08-11
sources:
  - ../../AGENTS.md
  - ../../../scripts/check-docs.mjs
knowledge_role: requirements
scope: backend
---

# Порядок обновления

Перед правкой найдите тематическую ноту и первичный источник. После изменения
обновляется владеющая фактом нота; OpenAPI и `schema.sql` не копируются. Новое
архитектурное решение фиксируется ADR. Проверка ссылок, метаданных, достижимости
и реестра выполняется [checker](../../../scripts/check-docs.mjs).

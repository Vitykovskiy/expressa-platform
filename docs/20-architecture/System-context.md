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
к backend HTTP API. Backend хранит данные в PostgreSQL и в staging/production
отправляет OTP через SMS.ru. [API](../../backend/openapi/openapi.json),
[auth configuration](../../backend/src/auth/auth.module.ts).

Поставка собирает backend, front-office, back-office и PostgreSQL как отдельные
контейнеры. [Compose](../../deploy/compose.yml), [топология](ADR/ADR-002-delivery-topology.md).

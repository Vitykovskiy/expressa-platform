---
title: Проверяемые источники backend
type: sources
owner: backend
last_verified: 2026-08-11
sources:
  - ../../package.json
---

# Проверяемые источники

Код, миграции, тесты и конфигурация имеют приоритет над текстом. [OpenAPI](../../openapi/openapi.json)
— сгенерированный HTTP-контракт; `npm run openapi:check` сверяет его с
NestJS-декораторами. Секреты не копируются.

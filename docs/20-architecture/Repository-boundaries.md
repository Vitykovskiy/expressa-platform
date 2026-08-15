---
title: Границы приложений
type: architecture
owner: root
last_verified: 2026-08-15
sources:
  - ../../backend/src/main.ts
  - ../../front-office/src/main.ts
  - ../../back-office/src/main.ts
---

# Границы приложений

Корневой репозиторий содержит три автономно собираемых приложения и общую
системную документацию. Каждое приложение имеет собственные зависимости,
lock-файл, команды, образ и локальную Docs-as-Code; root хранит только
межконтурные и поставочные факты. [Backend](../../backend/package.json),
[front-office](../../front-office/package.json), [back-office](../../back-office/package.json).

`backend` владеет API и PostgreSQL; `front-office` — customer-клиентом;
`back-office` — staff-клиентом. Детали принадлежат их [локальным картам](../../backend/docs/INDEX.md),
[front-office](../../front-office/docs/INDEX.md) и [back-office](../../back-office/docs/INDEX.md).

Граница root/local документации закреплена в [ADR-004](ADR/ADR-004-remove-storybook.md).

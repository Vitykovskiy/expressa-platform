---
title: Среды поставки
type: operations
owner: root
last_verified: 2026-09-14
sources:
  - ../../.github/workflows/development-delivery.yml
  - ../../deploy/deploy.sh
---

# Среды поставки

Поддерживается только development: customer — <https://dev.expressa.vitykovskiy.ru/>,
admin — <https://admin.dev.expressa.vitykovskiy.ru/>, API —
<https://api.dev.expressa.vitykovskiy.ru>. Health проверяется по `/health/live`
и `/health/ready`; OpenAPI доступен в development.

База development одноразовая: каждая поддерживаемая поставка пересоздаёт её из
`backend/schema.sql` и заполняет seed. Staging и production не поддерживаются,
пока не принято отдельное решение о постоянных данных.

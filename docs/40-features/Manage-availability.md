---
title: Управление доступностью
type: feature
owner: root
implementation_status: placeholder
last_verified: 2026-08-11
sources:
  - ../../back-office/docs/30-domains/Inactive-screens.md
---

# Управление доступностью

Активного staff-сценария управления доступностью нет: backend OpenAPI не содержит
команд изменения `isAvailable` или `accepts_new_orders`, а `/availability`
back-office отображает защищённую заглушку. [OpenAPI](../../backend/openapi/openapi.json),
[inactive boundary](../../back-office/docs/30-domains/Inactive-screens.md).

Код `AvailabilityScreen` и его UI-составные части не подключены к активному
маршруту; они не доказывают реализованную пользовательскую возможность.
[Coverage](../../back-office/docs/COVERAGE.md).

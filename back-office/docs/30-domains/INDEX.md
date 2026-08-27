---
title: Рабочие области back-office
type: index
owner: back-office
last_verified: 2026-08-27
sources:
  - ../../src/app/router.ts
  - ../../src/app/router.constants.ts
---

# Рабочие области back-office

Локальная карта текущих пользовательских сценариев. К родительской карте документации: [back-office docs](../INDEX.md).

- [Вход и ролевые ограничения](Authentication-and-role-gates.md) — `/login`, OTP и сессия сотрудника.
- [Рабочие разделы и маршруты](working-areas-and-routes.md) — URL, перенаправления и доступные роли.
- [Управление каталогом](Catalog-management.md) — `/menu` для administrator.
- [Активные и неактивные экраны](Inactive-screens.md) — очередь, доступность и границы неиспользуемого UI.
- [API-интеграция и граница ошибок](api-integration-and-errors.md) — HTTP-клиент, OpenAPI и проверка контракта.

Проверки сценариев и команд: [95-testing/README.md](../95-testing/README.md). Полное соответствие runtime, API и тестов: [COVERAGE.md](../COVERAGE.md).

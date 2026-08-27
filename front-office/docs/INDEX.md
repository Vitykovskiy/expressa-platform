---
type: index
owner: front-office
last_verified: 2026-08-11
sources:
  - ../src/app/router.ts
---

# Документация front-office

Вход в контур — [README](../README.md). Здесь описано фактическое клиентское
приложение: маршрут, экран, состояние, HTTP-обмен и проверка сценария. Код,
тесты, OpenAPI-снимок и конфигурация имеют приоритет над текстом.
[Источники: маршруты](../src/app/router.ts), [контракт](../contracts/openapi.json),
[проверки](../package.json).

## Текущее устройство

- [Контур](00-meta/Scope.md) — актор, маршруты и потребляемый API.
- [Архитектура](20-architecture/INDEX.md) — слои, состояние и API.
- [Сценарии](30-features/INDEX.md) — меню, вход, корзина и заказы.
- [Контракты UI](30-conventions/UI-contracts.md) — повторно используемые
  примитивы и доступность.
- [Проверка](40-testing/Verification.md) и [покрытие](COVERAGE.md) — команды,
  сценарии и реестр runtime-объектов.
- [ADR-001](50-adr/ADR-001-runtime-and-storybook-boundaries.md) — границы
  runtime и Storybook.

## Служебные материалы

- [Источники](_sources/README.md) — приоритет первичных источников.
- [Журнал](_journal/README.md) — временные заметки, не описание текущего
  поведения.

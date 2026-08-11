---
type: adr
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../src/app/router.ts
  - ../../.storybook/main.ts
---

# ADR-001: границы runtime и Storybook

## Решение

Runtime организован слоями `app/pages/widgets/features/entities/shared`.
Storybook вынесен в `.storybook`, импортирует runtime, но не наоборот.
[Источники: маршрутизатор](../../src/app/router.ts), [Storybook](../../.storybook/main.ts).

## Причина

Маршруты, предметная модель и инструменты каталога получают разные владельцы;
сборка приложения не включает исходники Storybook.

## Проверка

Граница и проверка историй описаны канонически в
[Runtime и Storybook](../30-conventions/Runtime-and-Storybook.md).

---
title: "ADR-001: границы runtime и Storybook"
type: adr
owner: front-office
last_verified: 2026-08-11
sources:
  - ../../src/app/router.ts
knowledge_role: decision
scope: front-office
---

# ADR-001: границы runtime и Storybook

## Решение

Runtime организован слоями `app/pages/widgets/features/entities/shared`.
Это действующее правило front-office.
[Источник: маршрутизатор](../../src/app/router.ts).

## Историческая часть Storybook

Часть решения о Storybook заменена
[ADR-004](../../../docs/20-architecture/ADR/ADR-004-remove-storybook.md):
действует требование изолированного каталога. В текущем front-office интеграция отсутствует; это незакрытое требование, а не отмена ADR. Команды проверяются по [package.json](../../package.json).

## Причина

Маршруты, предметная модель и слой представления получают разные владельцы;
runtime сохраняет направленные зависимости между слоями.

## Проверка

Слои runtime проверяются по [маршрутизатору](../../src/app/router.ts).

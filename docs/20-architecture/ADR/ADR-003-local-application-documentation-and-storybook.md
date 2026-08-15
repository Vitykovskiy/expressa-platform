---
title: Локальная документация и Storybook (заменён)
description: Историческое решение о границе корневых и контурных документов и размещении Storybook.
type: adr
area: architecture
status: superseded
superseded_by: ADR-004-remove-storybook.md
owner: root
last_verified: 2026-08-15
sources:
  - ADR-004-remove-storybook.md
updated: 2026-08-11
supersedes: [ADR-001]
---

# ADR-003. Локальная документация и Storybook

> Заменён [ADR-004](ADR-004-remove-storybook.md).

## Контекст

Три автономных приложения получили собственные README, AGENTS и Docs-as-Code.
Корневые ноты, содержащие их внутреннюю структуру и пути историй, быстро
устаревают и дублируют владельца знания.

## Решение

Корневой `docs/` владеет системой, поставкой, межконтурными HTTP/OpenAPI
правилами и общим бэклогом. Каждый контур владеет своим README, AGENTS,
локальной документацией, runtime-структурой, командами и тестами.

Storybook каждого клиента находится в `.storybook` как каталог UI. `.storybook`
может импортировать runtime из `src`, но runtime не импортирует Storybook.

## Последствия

Корневые ноты ссылаются на локальные карты вместо внутренних путей приложений.
Этот ADR заменяет в ADR-001 положения о root-only документации и размещении
`*.stories.ts` рядом с UI-компонентами; остальные положения ADR-001 сохраняют
силу.

---
type: index
owner: back-office
last_verified: 2026-08-11
sources:
  - ../src/app/router.ts
  - ../src/pages/MenuPage.vue
---

# Индекс документации back-office

Back-office — отдельное Vue-приложение сотрудников. Эта локальная карта ведёт к текущему runtime: входу, очереди, доступности и меню администратора.

## Запуск и проверка

- [README приложения](../README.md) задаёт Node.js, установку и основные команды.
- [Правила области](../AGENTS.md) задают границы автономного контура и Definition of Done.
- [Проверки](95-testing/README.md) перечисляют команды из `package.json` и их назначение.
- [Покрытие](COVERAGE.md) связывает маршруты, runtime, API и тесты с нормативными нотами.

## Текущее поведение

- [Рабочие области](30-domains/INDEX.md) — вход, роли, маршруты, каталог, API и границы активных экранов.
- [Архитектура UI](10-architecture/ui-ownership.md) — владельцы состояния, responsive и accessibility-границы.
- [ADR-001](ADR/ADR-001-feature-sliced-runtime-and-storybook.md) — границы feature-sliced runtime.

## Устройство UI

- [Размещение кода](80-conventions/code-layout.md) фиксирует runtime-слои.

## Структура исходного кода

Исходный код следует направлению `app -> pages -> widgets -> features -> entities -> shared`; локальное правило — в [Размещении кода](80-conventions/code-layout.md), DoD — в [корневой конвенции](../../docs/80-conventions/Code-Definition-of-Done-back-office.md).

## Служебные материалы

- [Журнал](_journal/README.md) хранит только операционный контекст, не описание текущего поведения.
- [Источники](_sources/README.md) содержат проверяемые внешние ссылки и снимки.

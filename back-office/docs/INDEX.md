---
type: index
owner: back-office
last_verified: 2026-08-11
sources:
  - ../src/app/router.ts
  - ../src/pages/MenuPage.vue
---

# Индекс документации back-office

Back-office — отдельное Vue-приложение сотрудников. Этот индекс — MOC: runtime обслуживает вход и меню администратора; `/queue` и `/availability` сохранены как защищённые заглушки.

## Запуск и проверка

- [README приложения](../README.md) задаёт Node.js, установку и основные команды.
- [Проверки](95-testing/README.md) перечисляют команды из `package.json` и их назначение.
- [Покрытие](COVERAGE.md) связывает маршруты, runtime, API и тесты с нормативными нотами.

## Текущее поведение

- [Вход и роли](30-domains/Authentication-and-role-gates.md) — активный `/login`, восстановление сессии и доступ по ролям.
- [Управление каталогом](30-domains/Catalog-management.md) — активный `/menu`: данные, действия, validation, диалоги и ошибки.
- [Неактивные экраны](30-domains/Inactive-screens.md) — точные границы placeholder-маршрутов и неактивных компонентов.
- [Маршруты](30-domains/working-areas-and-routes.md) — компактная карта URL и перенаправлений.
- [API-интеграция](30-domains/api-integration-and-errors.md) — транспортная граница и OpenAPI-снимок.
- [Архитектура UI](10-architecture/ui-ownership.md) — владельцы состояния, responsive и accessibility-границы.

## Устройство UI

- [Размещение кода](80-conventions/code-layout.md) фиксирует runtime-слои.

## Структура исходного кода

Исходный код следует направлению `app -> pages -> widgets -> features -> entities -> shared`; локальное правило — в [Размещении кода](80-conventions/code-layout.md), DoD — в [корневой конвенции](../../docs/80-conventions/Code-Definition-of-Done-back-office.md).

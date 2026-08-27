---
title: Карта покрытия
type: registry
owner: root
last_verified: 2026-08-15
sources:
  - ../_sources/Expressa_MVP_Техническое_задание.md
---

# Карта покрытия

| Строки источника | Раздел | Основные ноты | Владелец |
| --- | --- | --- | --- |
| 1–22 | 1. Основание и цель | [Обзор проекта](../10-overview/Project-overview.md) | DOC-01 |
| 23–38 | 2.1. Репозитории | [Границы репозиториев](../20-architecture/Repository-boundaries.md), [Межрепозиторные контракты](../20-architecture/Cross-repository-contracts.md), [Контекст системы](../20-architecture/System-context.md) | DOC-01 |
| 39–50 | 2.2. Управление пакетами | [Обзор проекта](../10-overview/Project-overview.md) | DOC-01 |
| 51–89 | 2.3. Документация | [Как пользоваться базой знаний](How-to-use-this-vault.md), [Соглашения об именовании](Naming-conventions.md), [Приоритет источников](Source-precedence.md), [Протокол обновления](Update-protocol.md), [Словарь терминов](Glossary.md), [Проектные инструкции](../90-agents/Project-instructions.md) | DOC-01 |
| 90–100 | 2.4. Снятый каталог UI | [Удаление Storybook](../20-architecture/ADR/ADR-004-remove-storybook.md) | DOC-03 |
| 101–105 | 2.5. Каталог инженерных требований | [Архитектура backend](../20-architecture/Backend-architecture.md), [Архитектура клиентов](../20-architecture/Client-architecture.md) | DOC-01 |
| 106–106 | 2.5. Каталог инженерных требований | [Соглашения HTTP API](../50-interfaces/HTTP-API-conventions.md) | DOC-03 |
| 107–107 | 2.5. Каталог инженерных требований | [Архитектура backend](../20-architecture/Backend-architecture.md) | DOC-01 |
| 108–117 | 2.5. Каталог инженерных требований | [Интерфейс front-office](../50-interfaces/Front-office-UI.md), [Интерфейс back-office](../50-interfaces/Back-office-UI.md) | DOC-03 |
| 118–134 | 2.5. Каталог инженерных требований | [Среды](../70-deployment/Environments.md), [CI/CD](../70-deployment/CI-CD.md), [Версионирование, выпуск и совместимость](../70-deployment/Release-and-version-compatibility.md) | DOC-04 |
| 135–147 | 3. Состав MVP | [Границы MVP](../10-overview/MVP-scope.md) | DOC-01 |
| 148–161 | 4. За рамками MVP | [Границы MVP](../10-overview/MVP-scope.md) | DOC-01 |
| 162–178 | 5. Роли и права | [Роли и доступ](../10-overview/Roles-and-access.md) | DOC-01 |
| 179–244 | 6. Пользовательские сценарии | [Просмотр меню и сбор корзины](../40-features/Browse-menu-and-build-cart.md), [Авторизация и оформление заказа](../40-features/Authenticate-and-place-order.md), [Текущий заказ, история и повтор](../40-features/Track-history-and-repeat-order.md), [Приготовление и выдача заказа](../40-features/Prepare-and-hand-off-order.md), [Управление меню](../40-features/Manage-menu.md), [Управление доступностью](../40-features/Manage-availability.md) | DOC-02 |
| 245–269 | 7. Бизнес-правила | [Идентификация и доступ](../30-domain/Identity-and-access.md), [Каталог и меню](../30-domain/Catalog-and-menu.md), [Конфигурация товара](../30-domain/Product-configuration.md), [Цены](../30-domain/Pricing.md), [Доступность](../30-domain/Availability.md), [Жизненный цикл заказа](../30-domain/Order-lifecycle.md), [Снимки заказа](../30-domain/Order-snapshots.md), [Аудит](../30-domain/Audit.md), [Просмотр меню и сбор корзины](../40-features/Browse-menu-and-build-cart.md), [Текущий заказ, история и повтор](../40-features/Track-history-and-repeat-order.md) | DOC-02 |
| 270–388 | 8. Функциональные требования | [Идентификация и доступ](../30-domain/Identity-and-access.md), [Каталог и меню](../30-domain/Catalog-and-menu.md), [Конфигурация товара](../30-domain/Product-configuration.md), [Цены](../30-domain/Pricing.md), [Доступность](../30-domain/Availability.md), [Жизненный цикл заказа](../30-domain/Order-lifecycle.md), [Снимки заказа](../30-domain/Order-snapshots.md), [Аудит](../30-domain/Audit.md), [Просмотр меню и сбор корзины](../40-features/Browse-menu-and-build-cart.md), [Авторизация и оформление заказа](../40-features/Authenticate-and-place-order.md), [Текущий заказ, история и повтор](../40-features/Track-history-and-repeat-order.md), [Приготовление и выдача заказа](../40-features/Prepare-and-hand-off-order.md), [Управление меню](../40-features/Manage-menu.md), [Управление доступностью](../40-features/Manage-availability.md) | DOC-02 |
| 389–404 | 9. Модель состояний заказа | [Жизненный цикл заказа](../30-domain/Order-lifecycle.md) | DOC-02 |
| 405–456 | 10. Доменная модель | [Доменная модель](../30-domain/Domain-model.md), [Идентификация и доступ](../30-domain/Identity-and-access.md), [Каталог и меню](../30-domain/Catalog-and-menu.md), [Конфигурация товара](../30-domain/Product-configuration.md), [Цены](../30-domain/Pricing.md), [Доступность](../30-domain/Availability.md), [Жизненный цикл заказа](../30-domain/Order-lifecycle.md), [Снимки заказа](../30-domain/Order-snapshots.md), [Аудит](../30-domain/Audit.md) | DOC-02 |
| 457–522 | 11. HTTP API | [Соглашения HTTP API](../50-interfaces/HTTP-API-conventions.md), [API аутентификации](../50-interfaces/Authentication-API.md), [API меню](../50-interfaces/Menu-API.md), [API заказов](../50-interfaces/Orders-API.md), [API back-office](../50-interfaces/Back-office-API.md), [Модель ошибок и идемпотентность](../50-interfaces/Error-model-and-idempotency.md) | DOC-03 |
| 523–580 | 12. Требования к front-office | [Интерфейс front-office](../50-interfaces/Front-office-UI.md), [Push-уведомления](../50-interfaces/Push-notifications.md) | DOC-03 |
| 581–625 | 13. Требования к back-office | [Интерфейс back-office](../50-interfaces/Back-office-UI.md), [Push-уведомления](../50-interfaces/Push-notifications.md) | DOC-03 |
| 626–699 | 14–15. Снятые требования к каталогу UI | [Удаление Storybook](../20-architecture/ADR/ADR-004-remove-storybook.md), [Push-уведомления](../50-interfaces/Push-notifications.md) | DOC-03 |
| 700–726 | 16. Архитектура backend | [Архитектура backend](../20-architecture/Backend-architecture.md) | DOC-01 |
| 727–762 | 17. Архитектура front-office и back-office | [Архитектура клиентов](../20-architecture/Client-architecture.md) | DOC-01 |
| 763–832 | 18. Требования к качеству | [Требования к качеству и уровни тестирования](../95-testing/Test-strategy.md), [Покрытие и контрольные требования качества](../95-testing/Coverage-and-quality-gates.md), [Проверка готовности и выпуска](../95-testing/Release-verification.md), [Надёжность, резервное копирование и восстановление](../70-deployment/Backup-and-restore.md), [Наблюдаемость](../70-deployment/Observability.md) | DOC-04 |
| 833–874 | 19. Тестирование | [Требования к качеству и уровни тестирования](../95-testing/Test-strategy.md), [Обязательные сценарии](../95-testing/Mandatory-scenarios.md), [Покрытие и контрольные требования качества](../95-testing/Coverage-and-quality-gates.md) | DOC-04 |
| 875–952 | 20. CI/CD и среды | [Среды](../70-deployment/Environments.md), [CI/CD](../70-deployment/CI-CD.md), [Версионирование, выпуск и совместимость](../70-deployment/Release-and-version-compatibility.md) | DOC-04 |
| 953–968 | 21. Документация как часть задачи | [Протокол обновления](Update-protocol.md) | DOC-01 |
| 969–998 | 22. Definition of Ready; 23. Definition of Done | [Проверка готовности и выпуска](../95-testing/Release-verification.md) | DOC-04 |
| 999–1017 | 24. Эпики и порядок реализации | [Эпики и порядок реализации](../10-overview/Epic-roadmap.md) | DOC-04 |
| 1018–1038 | 25. Критерии приёмки MVP | [Проверка готовности и выпуска](../95-testing/Release-verification.md) | DOC-04 |
| 1039–1048 | 26. Внешние входные данные к выпуску | [Проверка готовности и выпуска](../95-testing/Release-verification.md) | DOC-04 |

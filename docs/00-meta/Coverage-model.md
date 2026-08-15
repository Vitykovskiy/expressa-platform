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
| 1–22 | 1. Основание и цель | [[../10-overview/Project-overview\|Обзор проекта]] | DOC-01 |
| 23–38 | 2.1. Репозитории | [[../20-architecture/Repository-boundaries\|Границы репозиториев]], [[../20-architecture/Cross-repository-contracts\|Межрепозиторные контракты]], [[../20-architecture/System-context\|Контекст системы]] | DOC-01 |
| 39–50 | 2.2. Управление пакетами | [[../10-overview/Project-overview\|Обзор проекта]] | DOC-01 |
| 51–89 | 2.3. Документация | [[How-to-use-this-vault\|Как пользоваться базой знаний]], [[Naming-conventions\|Соглашения об именовании]], [[Source-precedence\|Приоритет источников]], [[Update-protocol\|Протокол обновления]], [[Glossary\|Словарь терминов]], [[../90-agents/Project-instructions\|Проектные инструкции]] | DOC-01 |
| 90–100 | 2.4. Снятый каталог UI | [[../20-architecture/ADR/ADR-004-remove-storybook\|Удаление Storybook]] | DOC-03 |
| 101–105 | 2.5. Каталог инженерных требований | [[../20-architecture/Backend-architecture\|Архитектура backend]], [[../20-architecture/Client-architecture\|Архитектура клиентов]] | DOC-01 |
| 106–106 | 2.5. Каталог инженерных требований | [[../50-interfaces/HTTP-API-conventions\|Соглашения HTTP API]] | DOC-03 |
| 107–107 | 2.5. Каталог инженерных требований | [[../20-architecture/Backend-architecture\|Архитектура backend]] | DOC-01 |
| 108–117 | 2.5. Каталог инженерных требований | [[../50-interfaces/Front-office-UI\|Интерфейс front-office]], [[../50-interfaces/Back-office-UI\|Интерфейс back-office]] | DOC-03 |
| 118–134 | 2.5. Каталог инженерных требований | [[../70-deployment/Environments\|Среды]], [[../70-deployment/CI-CD\|CI/CD]], [[../70-deployment/Release-and-version-compatibility\|Версионирование, выпуск и совместимость]] | DOC-04 |
| 135–147 | 3. Состав MVP | [[../10-overview/MVP-scope\|Границы MVP]] | DOC-01 |
| 148–161 | 4. За рамками MVP | [[../10-overview/MVP-scope\|Границы MVP]] | DOC-01 |
| 162–178 | 5. Роли и права | [[../10-overview/Roles-and-access\|Роли и доступ]] | DOC-01 |
| 179–244 | 6. Пользовательские сценарии | [[../40-features/Browse-menu-and-build-cart\|Просмотр меню и сбор корзины]], [[../40-features/Authenticate-and-place-order\|Авторизация и оформление заказа]], [[../40-features/Track-history-and-repeat-order\|Текущий заказ, история и повтор]], [[../40-features/Prepare-and-hand-off-order\|Приготовление и выдача заказа]], [[../40-features/Manage-menu\|Управление меню]], [[../40-features/Manage-availability\|Управление доступностью]] | DOC-02 |
| 245–269 | 7. Бизнес-правила | [[../30-domain/Identity-and-access\|Идентификация и доступ]], [[../30-domain/Catalog-and-menu\|Каталог и меню]], [[../30-domain/Product-configuration\|Конфигурация товара]], [[../30-domain/Pricing\|Цены]], [[../30-domain/Availability\|Доступность]], [[../30-domain/Order-lifecycle\|Жизненный цикл заказа]], [[../30-domain/Order-snapshots\|Снимки заказа]], [[../30-domain/Audit\|Аудит]], [[../40-features/Browse-menu-and-build-cart\|Просмотр меню и сбор корзины]], [[../40-features/Track-history-and-repeat-order\|Текущий заказ, история и повтор]] | DOC-02 |
| 270–388 | 8. Функциональные требования | [[../30-domain/Identity-and-access\|Идентификация и доступ]], [[../30-domain/Catalog-and-menu\|Каталог и меню]], [[../30-domain/Product-configuration\|Конфигурация товара]], [[../30-domain/Pricing\|Цены]], [[../30-domain/Availability\|Доступность]], [[../30-domain/Order-lifecycle\|Жизненный цикл заказа]], [[../30-domain/Order-snapshots\|Снимки заказа]], [[../30-domain/Audit\|Аудит]], [[../40-features/Browse-menu-and-build-cart\|Просмотр меню и сбор корзины]], [[../40-features/Authenticate-and-place-order\|Авторизация и оформление заказа]], [[../40-features/Track-history-and-repeat-order\|Текущий заказ, история и повтор]], [[../40-features/Prepare-and-hand-off-order\|Приготовление и выдача заказа]], [[../40-features/Manage-menu\|Управление меню]], [[../40-features/Manage-availability\|Управление доступностью]] | DOC-02 |
| 389–404 | 9. Модель состояний заказа | [[../30-domain/Order-lifecycle\|Жизненный цикл заказа]] | DOC-02 |
| 405–456 | 10. Доменная модель | [[../30-domain/Domain-model\|Доменная модель]], [[../30-domain/Identity-and-access\|Идентификация и доступ]], [[../30-domain/Catalog-and-menu\|Каталог и меню]], [[../30-domain/Product-configuration\|Конфигурация товара]], [[../30-domain/Pricing\|Цены]], [[../30-domain/Availability\|Доступность]], [[../30-domain/Order-lifecycle\|Жизненный цикл заказа]], [[../30-domain/Order-snapshots\|Снимки заказа]], [[../30-domain/Audit\|Аудит]] | DOC-02 |
| 457–522 | 11. HTTP API | [[../50-interfaces/HTTP-API-conventions\|Соглашения HTTP API]], [[../50-interfaces/Authentication-API\|API аутентификации]], [[../50-interfaces/Menu-API\|API меню]], [[../50-interfaces/Orders-API\|API заказов]], [[../50-interfaces/Back-office-API\|API back-office]], [[../50-interfaces/Error-model-and-idempotency\|Модель ошибок и идемпотентность]] | DOC-03 |
| 523–580 | 12. Требования к front-office | [[../50-interfaces/Front-office-UI\|Интерфейс front-office]], [[../50-interfaces/Push-notifications\|Push-уведомления]] | DOC-03 |
| 581–625 | 13. Требования к back-office | [[../50-interfaces/Back-office-UI\|Интерфейс back-office]], [[../50-interfaces/Push-notifications\|Push-уведомления]] | DOC-03 |
| 626–699 | 14–15. Снятые требования к каталогу UI | [[../20-architecture/ADR/ADR-004-remove-storybook\|Удаление Storybook]], [[../50-interfaces/Push-notifications\|Push-уведомления]] | DOC-03 |
| 700–726 | 16. Архитектура backend | [[../20-architecture/Backend-architecture\|Архитектура backend]] | DOC-01 |
| 727–762 | 17. Архитектура front-office и back-office | [[../20-architecture/Client-architecture\|Архитектура клиентов]] | DOC-01 |
| 763–832 | 18. Требования к качеству | [[../95-testing/Test-strategy\|Требования к качеству и уровни тестирования]], [[../95-testing/Coverage-and-quality-gates\|Покрытие и контрольные требования качества]], [[../95-testing/Release-verification\|Проверка готовности и выпуска]], [[../70-deployment/Backup-and-restore\|Надёжность, резервное копирование и восстановление]], [[../70-deployment/Observability\|Наблюдаемость]] | DOC-04 |
| 833–874 | 19. Тестирование | [[../95-testing/Test-strategy\|Требования к качеству и уровни тестирования]], [[../95-testing/Mandatory-scenarios\|Обязательные сценарии]], [[../95-testing/Coverage-and-quality-gates\|Покрытие и контрольные требования качества]] | DOC-04 |
| 875–952 | 20. CI/CD и среды | [[../70-deployment/Environments\|Среды]], [[../70-deployment/CI-CD\|CI/CD]], [[../70-deployment/Release-and-version-compatibility\|Версионирование, выпуск и совместимость]] | DOC-04 |
| 953–968 | 21. Документация как часть задачи | [[Update-protocol\|Протокол обновления]] | DOC-01 |
| 969–998 | 22. Definition of Ready; 23. Definition of Done | [[../95-testing/Release-verification\|Проверка готовности и выпуска]] | DOC-04 |
| 999–1017 | 24. Эпики и порядок реализации | [[../10-overview/Epic-roadmap\|Эпики и порядок реализации]] | DOC-04 |
| 1018–1038 | 25. Критерии приёмки MVP | [[../95-testing/Release-verification\|Проверка готовности и выпуска]] | DOC-04 |
| 1039–1048 | 26. Внешние входные данные к выпуску | [[../95-testing/Release-verification\|Проверка готовности и выпуска]] | DOC-04 |

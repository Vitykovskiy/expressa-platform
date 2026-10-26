---
title: "Архитектурные решения"
type: index
owner: root
knowledge_role: navigation
scope: system
---

# Архитектурные решения

Вернуться к [архитектуре](../INDEX.md).

| Задача или вопрос                                     | Маршрут                                                                                                 | Роль результата                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| ADR-001: структура корневого репозитория              | [ADR-001: структура корневого репозитория](ADR-001-Root-repository-structure.md)                        | Принятое решение; проверить границы применения                              |
| ADR-002: топология поставки                           | [ADR-002: топология поставки](ADR-002-delivery-topology.md)                                             | Принятое решение; проверить границы применения                              |
| ADR-003: локальная документация и Storybook           | [ADR-003: локальная документация и Storybook](ADR-003-local-application-documentation-and-storybook.md) | Историческое; заменено [решением](ADR-004-remove-storybook.md)              |
| ADR-004: изолированный каталог интерфейса             | [ADR-004: изолированный каталог интерфейса](ADR-004-remove-storybook.md)                                | Для front-office; back-office заменён ADR-011                               |
| ADR-005: связь customer-уведомлений с установкой      | [ADR-005: связь customer-уведомлений с установкой](ADR-005-customer-notification-association.md)        | Историческое; заменено [решением](ADR-009-explicit-logout-push-contract.md) |
| ADR-006: одна цена и варианты цены товара             | [ADR-006: одна цена и варианты цены товара](ADR-006-product-variant-portions.md)                        | Историческое; заменено [решением](ADR-008-v3-catalog-orders-cutover.md)     |
| ADR-007: одноразовые базы и текущая схема             | [ADR-007: одноразовые базы и текущая схема](ADR-007-disposable-database-bootstrap.md)                   | Решение; статус в метаданных не указан                                      |
| ADR-008: v3 cutover каталога и заказов                | [ADR-008: v3 cutover каталога и заказов](ADR-008-v3-catalog-orders-cutover.md)                          | Принятое решение; проверить границы применения                              |
| ADR-009: явный logout и push-контракт                 | [ADR-009: явный logout и push-контракт](ADR-009-explicit-logout-push-contract.md)                       | Принятое решение; проверить границы применения                              |
| ADR-010: граница доступности и управления back-office | [ADR-010: граница доступности и управления back-office](ADR-010-back-office-interaction-boundary.md)    | Историческое; заменено [ADR-011](ADR-011-back-office-clean-slate.md)        |
| ADR-011: back-office 2.0 с нуля                       | [ADR-011](ADR-011-back-office-clean-slate.md)                                                           | Принятое решение для новой версии                                           |
| ADR-012: полный back-office по макету                 | [ADR-012](ADR-012-back-office-source-contract.md)                                                       | Целевой source-контракт и ограниченные расширения API/данных                |
| ADR-013: организация features back-office             | [ADR-013](ADR-013-back-office-feature-organization.md)                                                  | Прежнее размещение; целевая замена в ADR-015                                |
| ADR-014: композиция back-office и текущий вход        | [ADR-014](ADR-014-back-office-composition-and-current-entry.md)                                         | Размещение заменяется ADR-015; текущий вход/API/native сохраняются          |
| ADR-015: предметная структура back-office             | [ADR-015](ADR-015-back-office-domain-structure.md)                                                      | Целевые app/layouts/modules/shared; независимое review до переноса          |

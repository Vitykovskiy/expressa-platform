---
title: "Сквозной путь заказа через домен"
type: moc
owner: root
last_verified: 2026-10-07
sources:
  - ../../backend/openapi/openapi.json
knowledge_role: navigation
scope: system
---

# Сквозной путь заказа через домен

Карта раздела — [INDEX.md](INDEX.md). Этот маршрут связывает понятия, нужные для одного заказа:

1. [Идентификация и доступ](Identity-and-access.md) определяют актор и сессию.
2. [Каталог](Catalog-and-menu.md) и [конфигурация товара](Product-configuration.md) задают состав позиции.
3. [Доступность](Availability.md) и [цены](Pricing.md) участвуют в серверной повторной проверке.
4. [Снимки](Order-snapshots.md) фиксируют принятый состав и сумму.
5. [Жизненный цикл](Order-lifecycle.md) задаёт последовательность стадий.
6. [Аудит](Audit.md) описывает след изменений; [модель данных](Domain-model.md) ведёт к схеме.

Точный HTTP-контракт находится в [OpenAPI](../../backend/openapi/openapi.json); эта карта не устанавливает статус реализации пользовательских экранов.

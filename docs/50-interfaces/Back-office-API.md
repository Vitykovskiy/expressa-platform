---
title: API back-office
sources: [Expressa_MVP_Техническое_задание.md]
---

# API back-office

| Метод и путь | Роль | Назначение |
|---|---|---|
| `GET /backoffice/catalog` | Administrator | Полный рабочий каталог |
| `POST /backoffice/catalog/categories` | Administrator | Создание категории |
| `PATCH /backoffice/catalog/categories/{categoryId}` | Administrator | Изменение категории |
| `POST /backoffice/catalog/categories/reorder` | Administrator | Полная перестановка категорий |
| `DELETE /backoffice/catalog/categories/{categoryId}` | Administrator | Архивирование категории |
| `POST /backoffice/catalog/products` | Administrator | Создание товара с ценой или вариантами размеров |
| `PATCH /backoffice/catalog/products/{productId}` | Administrator | Изменение товара |
| `POST /backoffice/catalog/products/reorder` | Administrator | Полная перестановка товаров категории |
| `DELETE /backoffice/catalog/products/{productId}` | Administrator | Архивирование товара |
| `POST /backoffice/catalog/modifier-groups` | Administrator | Создание группы добавок |
| `PATCH /backoffice/catalog/modifier-groups/{groupId}` | Administrator | Изменение агрегата группы и вариантов |
| `DELETE /backoffice/catalog/modifier-groups/{groupId}` | Administrator | Архивирование группы |
| `POST /backoffice/catalog/modifier-groups/{groupId}/options` | Administrator | Создание варианта добавки |
| `PATCH /backoffice/catalog/modifier-groups/options/{optionId}` | Administrator | Изменение варианта добавки |
| `POST /backoffice/catalog/modifier-groups/{groupId}/options/reorder` | Administrator | Полная перестановка вариантов |
| `DELETE /backoffice/catalog/modifier-groups/options/{optionId}` | Administrator | Архивирование варианта |
| `PUT /backoffice/catalog/categories/{categoryId}/modifier-groups` | Administrator | Замена упорядоченных назначений групп категории |
| `GET /backoffice/orders` | Staff | Очередь и фильтры |
| `GET /backoffice/orders/{id}` | Staff | Детали заказа |
| `POST /backoffice/orders/{id}/accept` | Staff | Стадия `Принят` |
| `POST /backoffice/orders/{id}/start-preparing` | Staff | Стадия `Готовится` |
| `POST /backoffice/orders/{id}/mark-ready` | Staff | Стадия `Готов` |
| `POST /backoffice/orders/{id}/issue` | Staff | Стадия `Выдан` |
| `PATCH /backoffice/availability/{type}/{id}` | Staff | Оперативная доступность |
| `PATCH /backoffice/service/intake` | Staff | Включение и выключение приёма новых заказов |

Все пути таблицы имеют префикс `/api/v1`. Для ошибок правил каталога API
возвращает `400 VALIDATION_ERROR`; `details.fields` содержит `path` и `reason`,
а общий envelope — диагностический `requestId`. Полный контракт тел и ответов —
[OpenAPI](../../backend/openapi/openapi.json).

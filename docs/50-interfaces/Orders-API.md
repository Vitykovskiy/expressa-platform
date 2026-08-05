---
title: API заказов
sources: [Expressa_MVP_Техническое_задание.md]
---

# API заказов

| Метод и путь | Роль | Назначение |
|---|---|---|
| `POST /api/v1/orders` | Customer | Идемпотентное создание заказа из актуализированной корзины |

`POST /api/v1/orders` требует Bearer-сессию customer и UUID в заголовке
`Idempotency-Key`. Тело содержит ожидаемый итог в копейках и непустой список
конфигураций: товар, nullable-вариант размера, выбранные добавки и количество.
Ответ `201` содержит `id`, номер `YYYYMMDD-NNN`, стадию `CREATED`, серверный итог
и снимки позиций с добавками.

Повтор того же customer, ключа и тела возвращает исходный заказ. Тот же ключ с
другим телом возвращает `IDEMPOTENCY_KEY_REUSED`. Актуализация может вернуть
`ORDER_TOTAL_CHANGED`, `MENU_ITEM_UNAVAILABLE`, `ORDER_INTAKE_CLOSED` или
`VALIDATION_ERROR` без создания заказа.

`GET /orders` и `GET /orders/{id}` в E07 не реализованы. Актуальная машинная
схема запроса и ответа находится в [OpenAPI](../../backend/openapi/openapi.json).

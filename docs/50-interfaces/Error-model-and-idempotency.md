---
title: Модель ошибок и идемпотентность
sources: [Expressa_MVP_Техническое_задание.md]
---

# Модель ошибок и идемпотентность

## Ключевые коды ошибок

| Код | Смысл |
|---|---|
| `VALIDATION_ERROR` | Ошибка входных данных |
| `AUTH_CODE_INVALID` | Ошибка одноразового кода |
| `AUTH_CODE_EXPIRED` | Завершён срок кода |
| `AUTH_RATE_LIMITED` | Достигнут лимит запросов |
| `ACCESS_DENIED` | Роль ограничивает действие |
| `MENU_ITEM_UNAVAILABLE` | Позиция выключена из продажи |
| `ORDER_TOTAL_CHANGED` | Сервер пересчитал стоимость |
| `ORDER_INTAKE_CLOSED` | Приём новых заказов выключен |
| `RESOURCE_ARCHIVED` | Объект архивирован |

---
title: API back-office
sources: [Expressa_MVP_Техническое_задание.md]
---

# API back-office

| Метод и путь | Роль | Назначение |
|---|---|---|
| `GET /backoffice/orders` | Staff | Очередь и фильтры |
| `GET /backoffice/orders/{id}` | Staff | Детали заказа |
| `POST /backoffice/orders/{id}/accept` | Staff | Стадия `Принят` |
| `POST /backoffice/orders/{id}/start-preparing` | Staff | Стадия `Готовится` |
| `POST /backoffice/orders/{id}/mark-ready` | Staff | Стадия `Готов` |
| `POST /backoffice/orders/{id}/issue` | Staff | Стадия `Выдан` |
| `PATCH /backoffice/availability/{type}/{id}` | Staff | Оперативная доступность |
| `PATCH /backoffice/service/intake` | Staff | Включение и выключение приёма новых заказов |

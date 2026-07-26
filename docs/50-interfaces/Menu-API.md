---
title: API меню
sources: [Expressa_MVP_Техническое_задание.md]
---

# API меню

| Метод и путь | Роль | Назначение |
|---|---|---|
| `GET /public/menu` | Public | Публичное меню и состояние приёма новых заказов |
| `GET /backoffice/catalog/*` | Administrator | Чтение структуры меню |
| `POST/PATCH/DELETE /backoffice/catalog/*` | Administrator | Управление структурой меню |

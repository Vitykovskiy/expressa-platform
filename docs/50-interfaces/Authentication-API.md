---
title: API аутентификации
sources: [Expressa_MVP_Техническое_задание.md]
---

# API аутентификации

| Метод и путь | Роль | Назначение |
|---|---|---|
| `POST /auth/otp/request` | Public | Запрос кода |
| `POST /auth/otp/verify` | Public | Проверка кода и создание сессии |
| `POST /auth/refresh` | Session | Обновление access token |
| `POST /auth/logout` | Session | Завершение сессии |
| `GET /me` | Session | Текущий пользователь |

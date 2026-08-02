# Среды

| Среда | Назначение | Текущее состояние |
| --- | --- | --- |
| `local` | Разработка одного приложения с его локальной конфигурацией. | доступна по файлам приложений |
| `development` | Общий совместимый стенд команды; оба клиента обращаются к backend через same-origin `/api/v1`. | топология и runtime подготовлены; образов и контейнеров приложений нет |
| `staging` | Демонстрация и приёмка согласованного набора выпусков. | топология и runtime подготовлены; манифест, тег, образы и контейнеры приложений отсутствуют |
| `production` | Рабочая среда кофейни после MVP. | не реализована и не разворачивается |

Отдельной среды поставки `test` нет: тесты выполняются в CI и в локальном окружении.

## Изоляция на VPS

Санитизированный контролируемый аудит VPS подтверждает, что bootstrap успешно применён дважды, а последующая read-only приёмка подтвердила топологию и runtime-файлы. Один VPS содержит независимые Docker-сети `expressa-development-edge`/`expressa-development-data` и `expressa-staging-edge`/`expressa-staging-data`. Сеть `data` каждой среды внутренняя; PostgreSQL не публикует порт на хост. Shared Caddy подключён только к обеим `edge`-сетям и направляет HTTPS-трафик в контейнеры. Nginx принимает HTTP и перенаправляет его на HTTPS. Аудит не выявил образов или контейнеров приложений.

| Среда | Front-office | Back-office | API |
| --- | --- | --- | --- |
| development | `https://dev.expressa.vitykovskiy.ru` | `https://admin.dev.expressa.vitykovskiy.ru` | `https://api.dev.expressa.vitykovskiy.ru` |
| staging | `https://staging.expressa.vitykovskiy.ru` | `https://admin.staging.expressa.vitykovskiy.ru` | `https://api.staging.expressa.vitykovskiy.ru` |

Маршруты `/api/v1` на UI-доменах проксируются в backend той же среды. API-домены проксируют backend целиком. Caddy-блок создан [[Operations-runbook|bootstrap VPS]], но без контейнеров приложений эти адреса не являются доказательством доступности приложения.

## Конфигурация запуска

На VPS секрет базы лежит только в `/srv/expressa/development/runtime.env` или `/srv/expressa/staging/runtime.env`. В каждом файле ровно `POSTGRES_PASSWORD`; владелец `root`, группа deploy-пользователя, режим `0640`. Скрипт поставки проверяет эти инварианты до запуска Compose. Значения, доступы SSH и параметры GitHub Secrets в документации не хранятся.

Образы и состояние развёртывания разделены каталогами `/srv/expressa/{development,staging}`. `deploy.sh` создаёт digest-состояния `state/current` и `state/previous` с режимом `0600` и локальные архивы базы в `backups/`.

Правила образов и выпуска — в [[Release-and-version-compatibility]].

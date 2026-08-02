# Среды

| Среда | Назначение | Текущее состояние |
| --- | --- | --- |
| `local` | Разработка одного приложения. | доступна по файлам приложений |
| `development` | Совместимый стенд команды. | развёрнут и проверен |
| `staging` | Демонстрация и приёмка зафиксированного набора выпусков. | развёрнут и проверен |
| `production` | Рабочая среда кофейни после MVP. | не реализована |

Отдельной среды поставки `test` нет: тесты выполняются в CI и локально.

## Топология VPS

Один VPS содержит независимые сети `expressa-development-edge`/`expressa-development-data` и `expressa-staging-edge`/`expressa-staging-data`. Bootstrap владеет созданием обеих сетей; Compose подключает их как external, а Docker задаёт data-сетям `Internal=true`. Поэтому PostgreSQL и межсредовой трафик не получают хостовые порты.

Shared Caddy подключён к edge-сетям, Nginx перенаправляет HTTP на HTTPS. UI-домены проксируют `/api/v1` в backend той же среды; API-домены проксируют backend целиком.

| Среда | Front-office | Back-office | API |
| --- | --- | --- |
| development | `https://dev.expressa.vitykovskiy.ru` | `https://admin.dev.expressa.vitykovskiy.ru` | `https://api.dev.expressa.vitykovskiy.ru` |
| staging | `https://staging.expressa.vitykovskiy.ru` | `https://admin.staging.expressa.vitykovskiy.ru` | `https://api.staging.expressa.vitykovskiy.ru` |

Клиенты собраны с `VITE_API_BASE_URL=/`; browser-проверки после поставки подтвердили same-origin `/api/v1` и health backend на обоих стендах.

## Runtime и образы

Секрет базы хранится отдельно в `/srv/expressa/development/runtime.env` и `/srv/expressa/staging/runtime.env`; значение и доступы не документируются. Состояния `state/current` и `state/previous` содержат только immutable digest-ссылки.

Docker Distribution постоянно хранит registry-data в `/srv/expressa/registry/data`, доступен только на loopback `127.0.0.1:5000` и запрещает удаление. CI достигает его исключительно через SSH-tunnel. Версии и выпуск — в [[Release-and-version-compatibility]].

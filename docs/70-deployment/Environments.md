# Environments

| Среда | Назначение |
| --- | --- |
| development | автоматическая проверка совместимого набора с main |
| staging | приёмка трёх digest из `deploy/staging.env` |
| production | не реализована |

Development и staging используют независимые Docker-сети, Compose-проекты и PostgreSQL volumes.

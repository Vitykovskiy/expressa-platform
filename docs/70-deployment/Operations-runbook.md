# Операционный порядок VPS

Этот runbook описывает подготовленные артефакты E01. Санитизированный контролируемый аудит VPS подтверждает два успешных применения bootstrap и последующую read-only приёмку топологии/runtime без записи в систему. Сейчас поставка блокируется авторизацией GitHub Actions в GHCR; образов и контейнеров приложений нет.

## Подготовка

Администратор запускает `sudo ./deploy/bootstrap-vps.sh` из проверенного checkout. Скрипт создаёт deploy-пользователя и каталоги `/srv/expressa`, копирует `compose.yml` и `deploy.sh`, создаёт отдельные edge/data сети обеих сред, создаёт закрытые `runtime.env`, добавляет Caddy-маршруты и HTTP→HTTPS redirect Nginx. Перед изменением Caddy и Nginx сохраняются копии в `/var/backups/expressa-infra/<UTC-время>/`; при ошибке скрипт восстанавливает `Caddyfile`, конфигурационный файл Nginx, прежнее состояние ссылки в `sites-enabled` и сетевые подключения, добавленные текущим запуском.

Bootstrap проверяет Caddy и Nginx до reload. Не изменяйте managed-блок Caddy вручную: его источником истины является `deploy/bootstrap-vps.sh`.

## Поставка и откат

Поставка запускается workflow с GitHub environment `development` или `staging`. Временный SSH-ключ, known hosts и GHCR-токен существуют только на время job; на VPS GHCR вход выполняется во временный Docker config. Образы разрешены только по canonical digest и публикуемых портов сервисов нет.

`deploy.sh --environment development|staging deploy all|backend|front|back` берёт блокировку среды, проверяет свободное место и `runtime.env`, создаёт backup базы перед миграцией backend, ожидает health-check и обновляет `state/current` и `state/previous`. При неуспехе текущей поставки скрипт восстанавливает затронутые контейнеры. Ручной откат использует `rollback` с теми же вариантами цели.

После первой успешной поставки оператор проверяет три HTTPS-домена среды, `/health/live`, `/health/ready` и наличие `state/current`. До этого любые проверки URL должны считаться неуспешными.

## Границы

Production отсутствует. Не используйте `latest`, не публикуйте порты PostgreSQL или приложений на хост, не переносите секреты в Git, документацию или state-файлы. Полный restore drill и регулярный backup не входят в этот runbook до реализации E12.

# Операционный порядок VPS

Этот runbook описывает действующую поставку `development` и `staging`. Секреты, host, IP, логины и ключи не записываются в репозиторий или документацию.

## Инфраструктура

`sudo ./deploy/bootstrap-vps.sh` создаёт deploy-пользователя, каталоги `/srv/expressa`, runtime-файлы, bootstrap-owned Docker-сети, локальный registry и маршруты Caddy/Nginx. Registry хранит данные в `/srv/expressa/registry/data`, слушает только `127.0.0.1:5000`, имеет отключённое удаление и проверяется bootstrap до завершения.

Перед изменением маршрутов bootstrap сохраняет Caddyfile, конфигурационный файл Nginx и состояние ссылки в `sites-enabled`. При ошибке он восстанавливает их и отключает сетевые подключения Caddy, добавленные текущим запуском.

## Поставка

`development-delivery.yml` автоматически публикует write-once SHA-образы через временный SSH-tunnel и развёртывает набор digest-ссылок. `staging-deploy.yml` принимает только tagged staging manifest из [deploy/staging.env](../../deploy/staging.env). Локальный registry не открыт сети; CI использует environment-scoped SSH secrets, перечисленные в [[CI-CD]].

В GitHub environments `development` и `staging` оператор задаёт secret `BOOTSTRAP_ADMIN_PHONE` в строгом формате `+7XXXXXXXXXX`. `deploy.sh --environment development|staging deploy all|backend|front|back` проверяет его до любых изменений, затем при backend-поставке берёт блокировку, проверяет `runtime.env`, сохраняет базу, запускает миграции и idempotent seed администратора, после чего запускает backend, ждёт health-check и обновляет `state/current`/`state/previous`. Значение живёт только до завершения seed и не сохраняется в runtime, state, backup или логах. При неуспехе текущей поставки он восстанавливает изменённые сервисы.

## Откат

`development-rollback.yml` запускается вручную только для `backend`, `front` или `back` и возвращает выбранный сервис к digest из `state/previous`. Workflow разделяет concurrency group с development delivery. Выполненный запуск и последующее восстановление приведены в [[CI-CD]].

Production отсутствует. Регулярный backup, restore drill и наблюдаемые alerts остаются работой E12.

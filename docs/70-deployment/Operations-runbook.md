# Operations runbook

VPS содержит runtime-файлы `/srv/expressa/development/runtime.env` и `/srv/expressa/staging/runtime.env` с паролем PostgreSQL. Значения секретов не документируются.

Одноразовые предпосылки VPS: Docker с Compose, локальный registry, deploy-пользователь и SSH-доступ CI, каталоги сред с `runtime.env`; proxy и DNS уже настроены.

Поставка выполняет `docker compose config`, pull, запуск и health PostgreSQL, миграции, idempotent seed, запуск сервисов и их health-check. Production и автоматические резервные копии не реализованы.

Отдельная operator-проверка поставки: три health endpoint development и staging должны отвечать успешно; PostgreSQL каждой среды после seed содержит одну запись и одного administrator.

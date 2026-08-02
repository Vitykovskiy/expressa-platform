# CI/CD

`development-delivery.yml` на `main` вызывает CI backend, front-office и back-office, собирает три образа с SHA коммита и развёртывает их в development.

`staging-deploy.yml` запускается тегом `staging-v*`, читает три immutable digest из [deploy/staging.env](../../deploy/staging.env) и развёртывает их без build. Для обоих путей GitHub environment хранит SSH-параметры VPS и `BOOTSTRAP_ADMIN_PHONE`.

`deploy/run-remote.sh` передаёт текущие `deploy.sh` и `compose.yml` через SCP во временный каталог VPS. Секреты не выводятся.

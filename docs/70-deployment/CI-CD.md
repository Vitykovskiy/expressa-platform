# CI/CD

`development-delivery.yml` на `main` вызывает CI backend, front-office и back-office, собирает три образа с SHA коммита и развёртывает их в development.

`staging-deploy.yml` запускается тегом `staging-v*`, читает три immutable digest из [deploy/staging.env](../../deploy/staging.env) и развёртывает их без build. Для обоих путей GitHub environment хранит SSH-параметры VPS и `BOOTSTRAP_ADMIN_PHONE`.

`deploy/run-remote.sh` передаёт текущие `deploy.sh` и `compose.yml` через SCP во временный каталог VPS. Секреты не выводятся.

Подтверждённый trace: commit `5b3d2bb45841a276d998e4b6bb5e51aed9af462c`, development run `30750587887`, тег `staging-v0.1.2` и staging run `30750840290`. Это разные deployment set: staging использует manifest digest. После runs оператор отдельно выполнил read-only health, same-origin и DB aggregate проверки; агрегат каждой PostgreSQL содержит одну запись и одного administrator без публикации телефона.

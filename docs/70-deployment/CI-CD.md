# CI/CD

`Vitykovskiy/expressa-platform` поставляет три приложения в `development` и `staging` через локальный Docker Distribution на VPS. Контракт workflow находится в `.github/workflows/`; этот документ фиксирует его и подтверждённые запуски.

## Подтверждённые поставки

| Контур | Доказательство | Результат |
| --- | --- | --- |
| Development | [30735364048](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30735364048), [30735790708](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30735790708) | три образа собраны и набор развёрнут по digest |
| Компонентные выпуски | [backend 30735636515](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30735636515), [front-office 30735636307](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30735636307), [back-office 30735636319](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30735636319) | release aliases созданы без пересборки |
| Staging | [30735801548](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30735801548) | набор из `deploy/staging.env` развёрнут по digest |
| Ручной откат development | [30736219164](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30736219164) | откат компонента выполнен; последующее восстановление подтверждено job [91465546760](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30735790708/job/91465546760) |

После поставок browser-проверки подтвердили same-origin `/api/v1` на UI-доменах, а `/health/live` и `/health/ready` backend доступны на обоих стендах.

## Сборка и registry

`development-delivery.yml` на `main` запускает три вызова `delivery-component.yml`. Каждый создаёт SSH-tunnel к Docker Distribution, слушающему только `127.0.0.1:5000` на VPS, и публикует образ как `127.0.0.1:5000/expressa/<компонент>@sha256:…`. Пять environment-scoped SSH secrets: `EXPRESSA_VPS_HOST`, `EXPRESSA_VPS_PORT`, `EXPRESSA_VPS_DEPLOY_USER`, `EXPRESSA_VPS_DEPLOY_SSH_KEY`, `EXPRESSA_VPS_KNOWN_HOSTS`.

Тег `sha-<полный SHA>` write-once: если он уже существует, workflow использует его проверенный canonical digest; иначе строит и сверяет опубликованный digest. Компонентный тег выпуска создаёт alias `vX.Y.Z` того же SHA-digest без пересборки. Проверки приложений остаются в `backend-ci.yml`, `front-office-ci.yml` и `back-office-ci.yml`.

`staging-deploy.yml` принимает тег `staging-vX.Y.Z` и ровно три ссылки из [staging manifest](../../deploy/staging.env). Он не использует изменяемые теги. Production workflow отсутствует.

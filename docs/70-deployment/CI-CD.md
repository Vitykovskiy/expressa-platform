# CI/CD

`Vitykovskiy/expressa-platform` — единственный удалённый репозиторий проекта. Проверки и поставка определены в `.github/workflows/`; этот документ описывает их фактический контракт и не заменяет журналы GitHub Actions.

## Текущее доказательство

| Проверка | Запуск | Состояние |
| --- | --- | --- |
| Backend CI | [30727498998](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30727498998) | успешно |
| Front-office CI | [30727498999](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30727498999) | успешно |
| Back-office CI | [30727499014](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30727499014) | успешно |
| Development delivery | [30727499044](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30727499044) | неуспешно: GitHub Actions не авторизован для записи образов в GHCR |
| Development delivery | [30727857548](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30727857548) | неуспешно: GitHub Actions не авторизован для записи образов в GHCR |

Запуски `main` только пытались собрать и опубликовать образы: авторизация остановила их до публикации GHCR-пакетов. Образов и контейнеров приложений нет, успешной поставки в `development` нет. Нет staging-манифеста и тега `staging-vX.Y.Z`.

## Проверки приложений

- `backend-ci.yml`: `npm ci`, lint, typecheck, модульные и интеграционные тесты PostgreSQL, проверка OpenAPI, production build и Docker build.
- `front-office-ci.yml` и `back-office-ci.yml`: `npm ci`, lint, typecheck, тесты, Storybook interaction и accessibility, визуальная регрессия, Storybook build, application build и Docker build.

Ошибка обязательного шага завершает соответствующий workflow с ошибкой.

## Поставка

`development-delivery.yml` на `main` предназначен для сборки трёх образов и передачи в VPS неизменяемых digest-ссылок. `delivery-component.yml` разрешает только пары component/context/image: `backend`/`expressa-backend`, `front-office`/`expressa-front-office`, `back-office`/`expressa-back-office`.

Имена пакетов двухуровневые и фиксированы: `ghcr.io/vitykovskiy/expressa-backend`, `ghcr.io/vitykovskiy/expressa-front-office`, `ghcr.io/vitykovskiy/expressa-back-office`. При успешной публикации коммит `main` получает тег `sha-<полный SHA>`; развёртывание принимает только `@sha256:…`.

Компонентный тег `backend-vX.Y.Z`, `front-office-vX.Y.Z` или `back-office-vX.Y.Z` не пересобирает образ: workflow проверяет версию и changelog, затем создаёт тег `vX.Y.Z` для уже опубликованного digest. `staging-deploy.yml` принимает только тег `staging-vX.Y.Z`, заголовок changelog и `deploy/staging.env` с тремя digest-ссылками. Манифест и staging-тег пока отсутствуют.

Поставка в `production` не реализована и не запускается. Порядок сред — в [[Environments]], операционный порядок — в [[Operations-runbook]], выпуск — в [[Release-and-version-compatibility]].

---
title: Standalone E2E на VPS
type: operations
owner: root
last_verified: 2026-08-27
sources:
  - ../../.github/workflows/development-delivery.yml
  - ../../deploy/e2e-compose.yml
  - ../../deploy/run-e2e-remote.sh
---

# Standalone E2E на VPS

После каждого push в `main` [Development delivery](../../.github/workflows/development-delivery.yml)
сначала поставляет backend, front-office и back-office в development. Только
после успешной поставки он собирает четвёртый E2E-образ с SHA-тегом, передаёт
все четыре неизменяемых digest на VPS и запускает `JOURNEY-01`—`JOURNEY-05`.
Если поставка или сборка E2E-образа неуспешна, always job
публикует диагностическую страницу без запуска Playwright. Development-стенд
в E2E-запуск не входит.

## Временный стенд

Для GitHub run создаётся Compose project `expressa-e2e-<run-id>` с отдельными
PostgreSQL volume и сетями. Внутренний gateway предоставляет E2E-контейнеру
front-office на `gateway:8081`, back-office на `gateway:8082` и проксирует
`/api/v1` в backend; host-порты временного стенда не публикуются. До браузерных
сценариев runtime выполняет миграции, seed administrator и создание staff,
затем ждёт healthcheck всех сервисов.

После завершения, включая ошибку, runtime удаляет точный Compose project,
containers, networks, volume PostgreSQL и временные test data. HTML-артефакты
переносятся в постоянное хранилище отчётов до этой очистки.

## Отчёт и доступ

Результаты смотрят в двух местах:

- [последний опубликованный Playwright report](http://216.57.105.133:8088/) —
  полный результат последнего завершённого прогона; доступ разрешён только из
  VPN/IP-сетей списка `E2E_REPORT_ALLOWLIST`;
- [Development delivery в GitHub Actions](https://github.com/Vitykovskiy/expressa-platform/actions/workflows/development-delivery.yml) —
  статус сборки, поставки и E2E-job для каждого commit. Ссылка `Re-run jobs` на
  странице конкретного запуска повторяет проверку того же commit вручную.

Постоянный контейнер `expressa-e2e-report-host` слушает `8088`. Корневой URL
сразу отдаёт единственный актуальный Playwright HTML report без служебного
списка и вложенных маршрутов. Новый отчёт или диагностическая страница
сначала записывается в отдельный каталог, после чего ссылка `current`
переключается атомарно. Поэтому незавершённая публикация не заменяет предыдущий
результат. При ошибке до Playwright доступна санитизированная диагностическая
страница с SHA, стадией и ссылкой на GitHub Actions run; секреты, телефоны и OTP
в неё не включаются.

Доступ к report-host разрешён только из CIDR списка
`E2E_REPORT_ALLOWLIST`, передаваемого как GitHub Environment Secret. Runtime
разбирает каждый элемент списка системным `python3` через
`ipaddress.ip_network(..., strict=False)`: допустимы корректные IPv4/IPv6 адреса
или сети с допустимой длиной префикса. Пустой список, некорректный адрес или
префикс отклоняются до создания report host.

## Обязательные входы

GitHub Environment `development` хранит `EXPRESSA_VPS_*` для SSH,
`BOOTSTRAP_ADMIN_PHONE` для administrator, `AUTH_DEVELOPMENT_OTP` для всех
трёх ролей и единственный новый E2E secret `E2E_REPORT_ALLOWLIST`. Временный
стенд создаёт administrator из `BOOTSTRAP_ADMIN_PHONE`, а staff и customer
выбирает из пула `+79990000002…+79990000004`, исключая administrator; workflow до запуска
и VPS runtime до seed проверяют, что все три роли различаются. На VPS должны
быть доступные `/srv/expressa/development/runtime.env`, локальный container registry и
достаточная ёмкость для одного временного Compose-стенда. Remote runtime также
требует process-scoped `DELIVERY_VAPID_SUBJECT`, `DELIVERY_VAPID_PUBLIC_KEY` и
`DELIVERY_VAPID_PRIVATE_KEY`, а VPS — системный `python3` для валидации CIDR.
Значения секретов не записываются в репозиторий, отчёт или документацию.

Новый прогон того же commit запускается оператором через `Re-run jobs` в GitHub
Actions. Настройка workflow сама по себе не служит evidence. Критерий принятия
зафиксирован в [проверке выпуска](../95-testing/Release-verification.md).

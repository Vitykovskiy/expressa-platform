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
`/api/v2` в backend; host-порты временного стенда не публикуются. До браузерных
сценариев runtime выполняет миграции, seed administrator и создание staff,
затем ждёт healthcheck всех сервисов.

После завершения, включая ошибку, runtime удаляет точный Compose project,
containers, networks, volume PostgreSQL и временные test data. HTML-артефакты
переносятся в постоянное хранилище отчётов до этой очистки.

## Изолированные тесты

Runtime запускает каждый тест из явной таблицы
[`run-e2e-remote.sh`](../../deploy/run-e2e-remote.sh) в отдельном Compose
project с PostgreSQL volume, сетями и browser execution. Точный заголовок теста
передаётся Playwright через `--grep`; повтор заголовка, неизвестный профиль или
состояние seed останавливают запуск до создания стенда.

Для каждого теста runner выбирает ровно одно из состояний
`E2E_SEED_SCENARIO`, которое передаётся только команде seed. Пустые сценарии
`CATALOG-01`, `MENU-02`, `AVAIL-12` и `QUEUE-01` используют внутреннее
состояние `no-seed`: после миграций создаются только administrator и barista,
без вызова seed. `E2E_PROFILE=empty|seeded|mutating` управляет `testMatch` и
`testIgnore` в Playwright.

Workflow передаёт разрешённые учётные данные process-scoped в VPS runtime;
runtime передаёт их в Compose, а Compose — в E2E-контейнер.
Контракт E2E-контейнера включает `E2E_ADMIN_PHONE`/`E2E_ADMIN_OTP`,
`E2E_STAFF_PHONE`/`E2E_STAFF_OTP`, `E2E_CUSTOMER_PHONE`/`E2E_CUSTOMER_OTP` и
`E2E_CUSTOMER_2_PHONE`/`E2E_CUSTOMER_2_OTP`. Два customer-набора имеют разные
номера; их учётные записи создаёт первый вход через UI, а не runtime.
Фиксированный OTP существует только в process-scoped окружении временного
профиля.

Эти переменные разрешены E2E-контейнеру только для входа через UI. Доступы к
API, БД, PostgreSQL volume, `DATABASE_URL` и seed-данным ему не передаются.
После каждого теста, включая ошибку, runtime удаляет test-scoped
`E2E_PROFILE`, каталог артефактов, контейнеры, сети, PostgreSQL volume и
временные данные. После каждого изолированного запуска runtime сохраняет его
Playwright blob-артефакт в каталог полного прогона. Seed создаёт только
исходное состояние этого запуска и не участвует в объединении отчётов:
объединяются исключительно blob-артефакты Playwright. Источники контракта —
workflow, `e2e-compose.yml` и `run-e2e-remote.sh`.

## Отчёт и доступ

Результаты смотрят в двух местах:

- последний опубликованный Playwright report — host берётся из приватного
  GitHub Environment Secret `EXPRESSA_VPS_HOST`, report-host слушает порт
  `8088`, доступ разрешён только из VPN/IP-сетей списка
  `E2E_REPORT_ALLOWLIST`;
- [Development delivery в GitHub Actions](https://github.com/Vitykovskiy/expressa-platform/actions/workflows/development-delivery.yml) —
  статус сборки, поставки и E2E-job для каждого commit. Ссылка `Re-run jobs` на
  странице конкретного запуска повторяет проверку того же commit вручную.

Постоянный контейнер `expressa-e2e-report-host` слушает `8088`. Корневой URL
публикует один стандартный объединённый Playwright HTML report всего полного
прогона, а не custom `index.html` и не отдельные HTML-отчёты сценариев.
Счётчики report должны покрывать весь ожидаемый набор сценариев (сейчас 78).

Перед публикацией runtime проверяет полноту: для каждого ожидаемого
изолированного сценария имеется ровно один корректный blob-артефакт. После
этой проверки он объединяет blob-артефакты Playwright в HTML report, санитизирует
его, формирует `summary.txt` из того же полного результата и только затем
атомарно переключает ссылку `current` на новый каталог. Поэтому незавершённая
публикация не заменяет предыдущий результат.

Если из-за инфраструктурной ошибки отсутствует или повреждён обязательный
blob-артефакт, runtime публикует санитизированную диагностическую страницу с
SHA, стадией и ссылкой на GitHub Actions run. Такая страница не является E2E
evidence; секреты, телефоны и OTP в неё не включаются.

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

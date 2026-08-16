---
title: Резервное копирование и восстановление
type: operations
owner: root
last_verified: 2026-08-16
sources:
  - ../../deploy/compose.yml
  - ../../deploy/backup.sh
  - ../../deploy/restore-verify.sh
---

# Резервное копирование и восстановление

PostgreSQL использует именованный Docker volume. Ежедневный GitHub Actions запуск
`operations-verification.yml` вызывает `backup.sh` на development-host: тот
обращается к уже запущенному PostgreSQL через `docker exec` и явный
`POSTGRES_CONTAINER`, создаёт `pg_dump`, шифрует его AES-256-CBC с PBKDF2 и
хранит вне runtime volume. Для каждой копии
создаётся sibling HMAC-SHA-256 с отдельным ключом целостности; restore проверяет
MAC до расшифровки. Копии старше
`BACKUP_RETENTION_DAYS` удаляются. После успеха
скрипт записывает текстовую метрику node-exporter
`expressa_backup_last_success_timestamp_seconds`; её контролирует alert.
[Backup script](../../deploy/backup.sh),
[alert](../../deploy/prometheus/alerts.yml).

Workflow использует user-owned каталоги development
`/srv/expressa/development/state/operations/{backups,backup-metrics}` с режимом
`0700`. Ключи backup и VAPID передаются на host только для запуска: временные
файлы шифрования и целостности backup имеют режим `0600`, а cleanup удаляет их
после проверки. VAPID передаётся NUL-разделённым stdin в окружение и не
записывается во временные файлы или `runtime.env`. Значения ключей, пароля и
`runtime.env` не попадают в логи, Git или evidence-артефакт.

`restore-verify.sh` принимает путь к конкретной копии, ключи шифрования и
целостности, `runtime.env`,
`compose.yml` и три immutable image reference. Он создаёт отдельные Compose
project, volume и сети, проверяет MAC, расшифровывает копию, применяет миграции, ждёт backend
и проверяет `/health/ready` и непустое меню в `/api/v1/public/menu`. Имя
допускаемой копии — `expressa-YYYYMMDDTHHMMSSZ.sql.enc`; выбирается только
новейшая корректная UTC-копия. RPO — разность UTC между началом restore и
временем из имени копии, цель `RPO <= 93600s`. RTO — время от момента
непосредственно перед HMAC-проверкой до успешно проверенного public-menu smoke,
цель `RTO <= 900s`; очистка изолированных ресурсов в RTO не входит. Отсутствие,
некорректное или будущее имя, ошибка restore или menu smoke, а также превышение
любой цели завершают проверку ошибкой. В конце успешный запуск выводит только
evidence-маркер с фактическими значениями и целями. Его запускают только против
непроизводственной копии перед выпуском; фактические RPO/RTO попадают в evidence
только после успешного запуска. [Restore script](../../deploy/restore-verify.sh),
[проверка выпуска](../95-testing/Release-verification.md).

Подтверждённая проверка: run `31928673857` для
`930e71cc06b65bb685635a60621937a97e656087`, artifact
`development-operations-evidence-31928673857`: backup
`expressa-20260816T051813Z.sql.enc` с HMAC и метрикой, RPO `0/93600s`, RTO
`16/900s` и public-menu smoke прошли.

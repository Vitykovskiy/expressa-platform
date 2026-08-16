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

PostgreSQL использует именованный Docker volume. Ежедневная host-задача
`expressa-backup.timer` запускает `backup.sh`: тот обращается к уже запущенному
PostgreSQL через `docker exec` и явный `POSTGRES_CONTAINER`, создаёт `pg_dump`,
шифрует его AES-256-CBC с PBKDF2 и хранит вне runtime volume. Для каждой копии
создаётся sibling HMAC-SHA-256 с отдельным ключом целостности; restore проверяет
MAC до расшифровки. Копии старше
`BACKUP_RETENTION_DAYS` удаляются. После успеха
скрипт записывает текстовую метрику node-exporter
`expressa_backup_last_success_timestamp_seconds`; её контролирует alert.
[Backup script](../../deploy/backup.sh), [timer](../../deploy/expressa-backup.timer),
[alert](../../deploy/prometheus/alerts.yml).

Оператор создаёт каталог backup и каталог текстовых метрик вне `/srv/expressa/*/postgres-data`,
даёт доступ пользователю `expressa`, кладёт ключ шифрования в отдельный файл с
режимом `0600`, а в `/etc/expressa/backup.env` задаёт `BACKUP_DIRECTORY`,
`BACKUP_ENCRYPTION_KEY_FILE`, `BACKUP_INTEGRITY_KEY_FILE`, `BACKUP_METRICS_DIRECTORY`,
`BACKUP_RETENTION_DAYS`, `POSTGRES_CONTAINER`, `POSTGRES_DB` и `POSTGRES_USER`.
`COMPOSE_FILE`, `COMPOSE_PROJECT_NAME`, образы приложений и `runtime.env` для
backup не нужны. Затем устанавливает unit/timer и выполняет
`systemctl enable --now expressa-backup.timer`. Значения ключа, пароля и
`runtime.env` не попадают в логи или Git.

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

# Версионирование, выпуск и совместимость

Backend, front-office и back-office имеют независимые SemVer-версии в `package.json`. Текущие подтверждённые теги: `backend-v0.1.0`, `front-office-v0.0.0`, `back-office-v0.0.0`, `staging-v0.1.0`.

## Выпуск компонента

Компонентный тег должен соответствовать `package.json` и записи в корневом `CHANGELOG.md`. `delivery-component.yml` требует существующий SHA-tag текущего коммита, проверяет его canonical manifest и создаёт новый release alias `vX.Y.Z` с тем же digest. Повторная сборка при выпуске не выполняется.

SHA-tag write-once: `main` создаёт его только при отсутствии, а существующий тег проверяется и переиспользуется. Это сохраняет связь коммита и образа; оператор создаёт тег только после успешной проверки CI на `main`.

## Staging

Staging использует [deploy/staging.env](../../deploy/staging.env) как источник точного набора backend, front-office и back-office. `staging-vX.Y.Z` проверяет changelog и три registry digest-ссылки, затем развёртывает именно этот набор. `latest` не используется.

Совместимость клиентов закреплена `/api/v1`; UI обращаются к backend того же стенда через same-origin `/api/v1`. Production не реализован и требует отдельного решения.

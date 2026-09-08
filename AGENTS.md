# AGENTS.md для Codex

## Skills и оркестрация

- Используй глобально установленные skills; перед применением читай их актуальную версию.
- Для комплексной задачи активируй глобальный `codex-orchestration-pact`. Root только создаёт и хранит состояние задачи, запускает роль из `next_transition`, проверяет envelope и наличие артефакта, атомарно обновляет `state.yaml`, маршрутизирует следующий переход или дословный вопрос роли.
- Root не выполняет предметную работу, не меняет scope, write-set или проверки и не интерпретирует полный отчёт роли.
- Роли: `scout`, `analyst`, `architect`, `decomposer`, `mechanical`, `developer`, `reviewer`, `integration_reviewer`, `quality_owner`.
- Полные отчёты и доказательства хранятся в `.codex/tmp/tasks/<task-id>/`; `state.yaml` содержит только ссылки и состояния.
- Подробный протокол: [Агентная система](docs/80-conventions/Agent-system.md).

## Definition of Done к коду

- Перед реализацией определить затронутые контуры и применять соответствующий DoD: [front-office](docs/80-conventions/Code-Definition-of-Done-front-office.md), [back-office](docs/80-conventions/Code-Definition-of-Done-back-office.md), [backend](docs/80-conventions/Code-Definition-of-Done-backend.md), [e2e](e2e/docs/80-conventions/Definition-of-Done.md).
- Для межконтурной задачи применять DoD всех затронутых приложений.

## Входы контуров

Начинайте с [README](README.md): он ведёт к контурам и [карте документации](docs/INDEX.md).

- Backend: [README](backend/README.md), [AGENTS](backend/AGENTS.md), [docs](backend/docs/INDEX.md).
- Front-office: [README](front-office/README.md), [AGENTS](front-office/AGENTS.md), [docs](front-office/docs/INDEX.md).
- Back-office: [README](back-office/README.md), [AGENTS](back-office/AGENTS.md), [docs](back-office/docs/INDEX.md).
- E2E: [README](e2e/README.md), [AGENTS](e2e/AGENTS.md), [docs](e2e/docs/INDEX.md).

## Принципы

- Приоритеты: корректность, безопасность, проверяемость, сопровождаемость, простота, скорость, лаконичность.
- Соблюдай KISS: не добавляй неподтверждённую функциональность, абстракции, процессы, скрипты или сценарии на будущее.

## Границы автономности

Явное подтверждение пользователя требуется для `git commit`, `git push`, force-push, tag, PR, major-upgrade, крупных архитектурных изменений и удаления публичного API, используемой feature, `core`-сервиса или endpoint из `ApiEndpoint`.

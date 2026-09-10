# AGENTS.md для Codex

## Skills и оркестрация

- Используй глобально установленные skills; перед применением читай их актуальную версию.
- Для комплексной задачи активируй глобальный `codex-orchestration-pact`. Root создаёт и хранит состояние задачи, запускает роль, проверяет envelope и наличие артефакта, атомарно обновляет `state.yaml` и маршрутизирует следующий переход или дословный вопрос роли.
- Для кампании качества действует явное пользовательское исключение, описанное в [goal кампании](docs/40-quality/Expressa-quality-campaign-goal.md): root последовательно ведёт одну предметную задачу и устраняет её рутинные процессные блокеры. Это не изменяет global skills и не разрешает root принимать собственные продуктовые изменения, снижать приёмку, менять бизнес-scope или обходить sandbox и требуемые подтверждения.
- Роли: `scout`, `analyst`, `architect`, `decomposer`, `mechanical`, `developer`, `reviewer`, `integration_reviewer`, `quality_owner`.
- Полные отчёты и доказательства хранятся в `.codex/tmp/tasks/<task-id>/`; `state.yaml` содержит только ссылки и состояния.
- Подробный протокол: [Агентная система](docs/80-conventions/Agent-system.md).

## Маршрут применимых инструкций

До действия и при изменении задачи следуйте
[маршруту применимости](docs/80-conventions/Agent-system.md). Краткую трассу
назначения ведёт [протокол обновления](docs/00-meta/Update-protocol.md), а
решение о version/changelog/tag для поставки —
[правила выпуска](docs/70-deployment/Release-and-version-compatibility.md).

## Definition of Done к коду

- До зависимого кода зафиксируйте в назначении применимые нормы, ожидаемое
  поведение и ответственность изменяемой области по
  [протоколу обновления](docs/00-meta/Update-protocol.md). Это краткая трасса
  решения, а не отдельный процессный артефакт.
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

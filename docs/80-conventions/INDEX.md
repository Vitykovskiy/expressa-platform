# Индекс требований разработки

Вернуться к [карте документации](../INDEX.md).

Это канонический маршрут к требованиям разработки. Он не повторяет нормы:
каждое требование остаётся в указанном источнике. Для задачи применяются общий
набор, наборы всех затронутых контуров и строки по каждому виду изменения.

## Общий набор

| Источник                                                                                                                                        | Что искать                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Корневые инструкции](../../AGENTS.md)                                                                                                          | Абсолютные ограничения, обязательные skills, scout, автономность и общие границы.      |
| [Приоритет источников](../00-meta/Source-precedence.md)                                                                                         | Роль нормы, факта реализации, решения и оперативного состояния; разрешение конфликтов. |
| [Маршрут документации](../00-meta/How-to-use-this-vault.md)                                                                                     | Порядок перехода через `INDEX.md`, `_MOC-*`, `COVERAGE.md` и терминальные источники.   |
| [Протокол обновления](../00-meta/Update-protocol.md)                                                                                            | Трасса применимости и обязательные синхронные изменения документации.                  |
| [Агентная система](Agent-system.md)                                                                                                             | Роли, назначения, refresh применимости и независимая приёмка.                          |
| [Границы репозитория](../20-architecture/Repository-boundaries.md) и [межконтурные контракты](../20-architecture/Cross-repository-contracts.md) | Автономность приложений и допустимые зависимости между ними.                           |
| [Правила выпуска](../70-deployment/Release-and-version-compatibility.md)                                                                        | Version, changelog, tag и границы поставки.                                            |

## Наборы контуров

### Backend

- Входы: [AGENTS](../../backend/AGENTS.md), [README](../../backend/README.md) и
  [карта документации](../../backend/docs/INDEX.md).
- Готовность кода: [backend DoD](Code-Definition-of-Done-backend.md).
- Архитектура и code style: [слои](../../backend/docs/10-architecture/Layers.md) и
  [локальные соглашения](../../backend/docs/80-conventions/INDEX.md).
- По виду изменения: [HTTP API](../../backend/docs/50-api/INDEX.md),
  [данные и схема](../../backend/docs/40-data/INDEX.md) или
  [операции](../../backend/docs/60-operations/INDEX.md).

### Front-office

- Входы: [AGENTS](../../front-office/AGENTS.md),
  [README](../../front-office/README.md) и
  [карта документации](../../front-office/docs/INDEX.md).
- Готовность кода: [front-office DoD](Code-Definition-of-Done-front-office.md) и
  общий [UI DoD](../40-quality/Definition-of-done.md).
- Code style и проверка: [стиль Vue](../40-quality/Vue-code-style.md),
  [доступность и взаимодействие](../40-quality/UI-accessibility.md),
  [стратегия проверки](../40-quality/Validation-strategy.md).
- UI и архитектура: [UI-контракты](../../front-office/docs/30-conventions/UI-contracts.md)
  и [локальная архитектура](../../front-office/docs/20-architecture/INDEX.md).

### Back-office

- Входы: [AGENTS](../../back-office/AGENTS.md),
  [README](../../back-office/README.md) и
  [карта документации](../../back-office/docs/INDEX.md).
- Готовность кода: [back-office DoD](Code-Definition-of-Done-back-office.md) и
  общий [UI DoD](../40-quality/Definition-of-done.md).
- Code style и проверка: [стиль Vue](../40-quality/Vue-code-style.md),
  [доступность и взаимодействие](../40-quality/UI-accessibility.md),
  [стратегия проверки](../40-quality/Validation-strategy.md).
- UI и архитектура: [UI ownership](../../back-office/docs/10-architecture/ui-ownership.md)
  и [размещение кода](../../back-office/docs/80-conventions/code-layout.md).

## Матрица видов изменений

| Вид изменения                    | Когда применяется                                                                    | Обязательный маршрут сверх общего и контурного наборов                                                                                                                                                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UI или пользовательский сценарий | Меняется экран, компонент, состояние, взаимодействие или текст сценария.             | [Сценарии системы](../40-features/INDEX.md), [качество UI](../40-quality/INDEX.md), локальные feature/domain-карты и `COVERAGE.md` затронутого клиента. Для продукта также применяются [charter](../40-quality/Product-quality-charter.md) и [принятые preferences](../40-quality/Product-quality-preferences.md). |
| HTTP API                         | Меняется endpoint, DTO, ошибка, авторизация или клиентское использование API.        | [Интерфейсы](../50-interfaces/INDEX.md), [HTTP API backend](../../backend/docs/50-api/INDEX.md), OpenAPI и карты всех потребляющих клиентов.                                                                                                                                                                       |
| Schema или data                  | Меняется таблица, ограничение, seed, транзакция или модель хранения.                 | [Предметная область](../30-domain/INDEX.md), [данные backend](../../backend/docs/40-data/INDEX.md), `backend/schema.sql` и применимый ADR.                                                                                                                                                                         |
| Архитектура                      | Меняются слои, ownership, направление зависимостей или границы приложений.           | [Архитектура системы](../20-architecture/INDEX.md), применимые локальные architecture-карты и [ADR](../20-architecture/ADR/INDEX.md).                                                                                                                                                                              |
| Документация                     | Меняется долговременная норма, контракт, инструкция или описание текущего состояния. | [Правила документации](../00-meta/INDEX.md), [протокол обновления](../00-meta/Update-protocol.md) и `codex-documentation-pact`.                                                                                                                                                                                    |
| Dependency или framework         | Меняется пакет, версия, API библиотеки, build tool или framework-конфигурация.       | Manifest и lock-файл затронутого приложения, его DoD и официальная документация точной версии; для Vue также [стиль Vue](../40-quality/Vue-code-style.md).                                                                                                                                                         |
| Deploy или release               | Меняется окружение, workflow, команда поставки, version, changelog или tag.          | [Поставка](../70-deployment/INDEX.md), [правила выпуска](../70-deployment/Release-and-version-compatibility.md) и операционная карта затронутого контура.                                                                                                                                                          |
| Межконтурное изменение           | Изменение затрагивает больше одного приложения или общий контракт.                   | Объединить все соответствующие контурные наборы и DoD; дополнительно пройти [межконтурные контракты](../20-architecture/Cross-repository-contracts.md) и общий интерфейс или предметную ноту.                                                                                                                      |

## Правило результата scout

Scout извлекает из выбранных источников применимые требования с их разделами и
областью действия. Голая карта ссылок не заменяет результат. Конфликтующие
нормы, отсутствующий маршрут и неизвестная применимость фиксируются явно и не
разрешаются выбором ближайшего файла.

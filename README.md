# Expressa

Expressa — система заказа кофе: клиентское PWA, рабочее PWA сотрудников и
backend. Репозиторий объединяет поставку системы и межконтурные контракты; у
каждого приложения есть собственные зависимости, команды и документация.

## Контуры

| Контур | Назначение | Вход | Правила | Документация |
| --- | --- | --- | --- | --- |
| [backend](backend/README.md) | HTTP API и PostgreSQL | [README](backend/README.md) | [AGENTS](backend/AGENTS.md) | [docs](backend/docs/INDEX.md) |
| [front-office](front-office/README.md) | клиентское PWA | [README](front-office/README.md) | [AGENTS](front-office/AGENTS.md) | [docs](front-office/docs/INDEX.md) |
| [back-office](back-office/README.md) | рабочее PWA | [README](back-office/README.md) | [AGENTS](back-office/AGENTS.md) | [docs](back-office/docs/INDEX.md) |

Клиенты не импортируют исходный код друг друга или backend. Их общая граница —
версионированный HTTP API и снимки OpenAPI; точное правило —
[межконтурные контракты](docs/20-architecture/Cross-repository-contracts.md).

## Корневая документация

[docs/INDEX.md](docs/INDEX.md) содержит систему, поставку, общие интерфейсы и
бэклог. Локальное устройство, Storybook и команды принадлежат документации
соответствующего контура. Решение о границах: [ADR-003](docs/20-architecture/ADR/ADR-003-local-application-documentation-and-storybook.md).

## Git hooks

```sh
./scripts/install-git-hooks.sh
```

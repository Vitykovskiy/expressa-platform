# Expressa

Expressa — система заказа кофе с клиентским PWA, рабочим интерфейсом сотрудников и единым backend. Текущий Git-репозиторий предназначен для трёх приложений, общей документации и бэклога разработки.

## Структура репозитория

```text
expressa/
├── backend/
│   ├── src/
│   │   ├── platform/              # конфигурация, БД, health и наблюдаемость
│   │   ├── modules/               # предметные модули backend
│   │   └── shared/                # общие серверные механизмы
│   ├── migrations/                # миграции PostgreSQL
│   ├── test/
│   │   ├── integration/
│   │   ├── e2e/
│   │   └── fixtures/
│   └── scripts/                   # эксплуатационные команды
├── front-office/
│   ├── .storybook/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── widgets/
│   │   ├── features/
│   │   ├── entities/
│   │   └── shared/
│   │       ├── api/
│   │       ├── ui/
│   │       ├── lib/
│   │       └── config/
│   └── e2e/
├── back-office/
│   ├── .storybook/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── widgets/
│   │   ├── features/
│   │   ├── entities/
│   │   └── shared/
│   │       ├── api/
│   │       ├── ui/
│   │       ├── lib/
│   │       └── config/
│   └── e2e/
├── docs/
│   ├── 00-meta/                   # правила документации
│   ├── 10-overview/               # обзор, эпики и бэклог
│   │   └── backlog/
│   ├── 20-architecture/           # архитектура и ADR
│   │   └── ADR/
│   ├── 30-domain/                 # предметная модель
│   ├── 40-features/               # пользовательские сценарии
│   ├── 50-interfaces/             # UI- и API-контракты
│   ├── 70-deployment/             # среды и поставка
│   ├── 80-conventions/            # инженерные соглашения
│   ├── 90-agents/                 # инструкции агентам
│   ├── 95-testing/                # стратегия и проверки
│   ├── _journal/                  # журнал существенных изменений
│   └── _sources/                  # исходное ТЗ
├── AGENTS.md
├── README.md
└── .gitignore
```

По [ADR-001](docs/20-architecture/ADR/ADR-001-Root-repository-structure.md) backend, front-office и back-office должны автономно собираться и владеть своими зависимостями, конфигурацией, тестами и Docker-образами. Прямые импорты между приложениями запрещены; клиенты взаимодействуют с backend через HTTP API и снимки OpenAPI-контракта. Общая документация и бэклог хранятся только в `docs/`.

## Документация

- [Карта документации](docs/INDEX.md)
- [Бэклог разработки](docs/10-overview/Backlog.md)
- [Порядок эпиков](docs/10-overview/Epic-roadmap.md)
- [ADR-001: корневая структура репозитория](docs/20-architecture/ADR/ADR-001-Root-repository-structure.md)

# Back-office

- Следуй корневому [AGENTS](../AGENTS.md); ограничения тестов не переопределяются локально.
- Вход и команды: [README](README.md), [карта документации](docs/INDEX.md), [покрытие runtime](docs/COVERAGE.md).
- Применяй [технический DoD](../docs/80-conventions/Code-Definition-of-Done-back-office.md), [чистый код](../docs/80-conventions/Clean-code.md), [Vue style](../docs/40-quality/Vue-code-style.md) и [процесс визуальной работы](../docs/40-quality/Validation-strategy.md).
- Границы текущего входа и незавершённого staff-перехода: [UI ownership](docs/10-architecture/ui-ownership.md). Требования полного продукта: [контракт сотрудника](../docs/50-interfaces/Back-office-UI.md).
- Для npm используй локальный `package-lock.json`; команды проверок бери из `package.json`. Не добавляй тестовые команды или новые проверочные средства без прямого разрешения.
- Не восстанавливай продуктовые файлы из истории Git. Не выдавай отсутствие рабочих разделов за завершённый вход или полный back-office.

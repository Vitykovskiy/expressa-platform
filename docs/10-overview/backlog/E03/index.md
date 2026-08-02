# E03 — Storybook back-office

Статус: complete.

Статус подтверждён полным каталогом, локальными проверками, независимой
приёмкой и [Back-office CI 30765030432](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30765030432)
(verify и Docker) для commit `dbe02dd` в [PR #1](https://github.com/Vitykovskiy/expressa-platform/pull/1).
Артефакт `back-office-storybook` содержит `index.html`; отдельный
`back-office-visual-baselines` содержит три PNG с SHA-256, совпадающими с
эталонами в Git.

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[back-office/BL-0040\|BL-0040]] | complete | Автономные тема и сборка Storybook подтверждены CI. |
| [[back-office/BL-0041\|BL-0041]] | complete | Foundations покрывают плотность и ширины 768, 1280, 1440 px. |
| [[back-office/BL-0042\|BL-0042]] | complete | Канонические controls и состояния представлены в каталоге. |
| [[back-office/BL-0043\|BL-0043]] | complete | Статусы дополнены текстом и покрыты accessibility-проверкой. |
| [[back-office/BL-0044\|BL-0044]] | complete | Карточка очереди и стадии представлены в каталоге. |
| [[back-office/BL-0045\|BL-0045]] | complete | Список, фильтры и состояния очереди покрыты историями. |
| [[back-office/BL-0046\|BL-0046]] | complete | Детали заказа, снимок и журнал событий представлены в композиции. |
| [[back-office/BL-0047\|BL-0047]] | complete | Допустимые переходы стадий покрыты interaction tests. |
| [[back-office/BL-0048\|BL-0048]] | complete | Компоненты доступности представлены в самостоятельных историях. |
| [[back-office/BL-0049\|BL-0049]] | complete | Автор и время изменения представлены в состоянии доступности. |
| [[back-office/BL-0050\|BL-0050]] | complete | Строки каталога и формы меню представлены в каталоге. |
| [[back-office/BL-0051\|BL-0051]] | complete | Формы показывают серверные ошибки отдельным состоянием. |
| [[back-office/BL-0052\|BL-0052]] | complete | Редактор покрывает S/M/L, S и единую цену. |
| [[back-office/BL-0053\|BL-0053]] | complete | Группы и варианты добавок покрывают правила выбора. |
| [[back-office/BL-0054\|BL-0054]] | complete | OrdersPage покрывает пять состояний, поиск и фильтры. |
| [[back-office/BL-0164\|BL-0164]] | complete | AvailabilityPage покрывает состояния, поиск и rollback. |
| [[back-office/BL-0055\|BL-0055]] | complete | MenuPage и редакторы представлены отдельными композициями. |
| [[back-office/BL-0056\|BL-0056]] | complete | StaffLoginPage покрывает роли, ожидание, ошибку и запрет. |
| [[back-office/BL-0057\|BL-0057]] | complete | Interaction и accessibility-проверки проходят в CI. |
| [[delivery/BL-0058\|BL-0058]] | complete | CI собирает и публикует Storybook и visual baselines. |
| [[quality/BL-0059\|BL-0059]] | complete | SB-BO принят: каталог, проверки, визуальные эталоны и делегированная визуальная приёмка подтверждены. |

## back-office

- [[back-office/BL-0040]]
- [[back-office/BL-0041]]
- [[back-office/BL-0042]]
- [[back-office/BL-0043]]
- [[back-office/BL-0044]]
- [[back-office/BL-0045]]
- [[back-office/BL-0046]]
- [[back-office/BL-0047]]
- [[back-office/BL-0048]]
- [[back-office/BL-0049]]
- [[back-office/BL-0050]]
- [[back-office/BL-0051]]
- [[back-office/BL-0052]]
- [[back-office/BL-0053]]
- [[back-office/BL-0054]]
- [[back-office/BL-0164]]
- [[back-office/BL-0055]]
- [[back-office/BL-0056]]
- [[back-office/BL-0057]]
## delivery

- [[delivery/BL-0058]]
## quality

- [[quality/BL-0059]]

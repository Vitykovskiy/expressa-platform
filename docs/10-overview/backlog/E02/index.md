# E02 — Storybook front-office

Статус: complete.

В `front-office` перенесены runtime UI, design tokens, fixtures и истории
готового Customer Storybook. Каталог содержит 146 записей, включая 123 stories;
точное соответствие исходному `index.json` проверяется при каждой сборке.
Локально все stories завершились в Chromium, а полный визуальный прогон не
выявил содержательных отличий от исходного статического Storybook. Финальный
статус подтверждён commit `ba74584` и
[Front-office CI 30770892317](https://github.com/Vitykovskiy/expressa-platform/actions/runs/30770892317)
в [PR #1](https://github.com/Vitykovskiy/expressa-platform/pull/1).

| Карточка | Статус | Доказательство |
| --- | --- | --- |
| [[front-office/BL-0020\|BL-0020]] | complete | Автономные тема и сборка Storybook подтверждены CI. |
| [[front-office/BL-0021\|BL-0021]] | complete | Foundations и контрольные ширины представлены в каталоге. |
| [[front-office/BL-0022\|BL-0022]] | complete | Controls и применимые состояния покрыты историями и interaction tests. |
| [[front-office/BL-0023\|BL-0023]] | complete | PhoneField и OtpInput покрывают ввод, ошибку и загрузку без API-сессии. |
| [[front-office/BL-0024\|BL-0024]] | complete | Навигация, длинный текст и клавиатурный фокус покрыты историями. |
| [[front-office/BL-0025\|BL-0025]] | complete | Карточки напитка, `OTHER` и недоступной позиции представлены в каталоге. |
| [[front-office/BL-0026\|BL-0026]] | complete | Конфигуратор покрывает размеры и границы добавок. |
| [[front-office/BL-0027\|BL-0027]] | complete | Количество, цена и граничные значения покрыты историями. |
| [[front-office/BL-0028\|BL-0028]] | complete | Состав, итог и пустая корзина покрыты историями. |
| [[front-office/BL-0029\|BL-0029]] | complete | Изменение цены и недоступность представлены отдельными состояниями. |
| [[front-office/BL-0030\|BL-0030]] | complete | Стадии и снимок деталей заказа представлены в каталоге. |
| [[front-office/BL-0031\|BL-0031]] | complete | История и полный, частичный, недоступный повтор покрыты историями. |
| [[front-office/BL-0032\|BL-0032]] | complete | Feedback-состояния и клавиатурные действия покрыты историями. |
| [[front-office/BL-0033\|BL-0033]] | complete | MenuPage покрывает рабочее, loading, empty, error и закрытый приём. |
| [[front-office/BL-0034\|BL-0034]] | complete | ProductSheet и CartPage представлены отдельными композициями. |
| [[front-office/BL-0035\|BL-0035]] | complete | Auth-композиции покрывают ввод, loading и ошибку кода. |
| [[front-office/BL-0036\|BL-0036]] | complete | Текущий заказ, уведомления и история представлены в композициях. |
| [[front-office/BL-0037\|BL-0037]] | complete | Interaction и accessibility-проверки проходят в CI. |
| [[delivery/BL-0038\|BL-0038]] | complete | CI собирает и публикует Storybook и visual baselines. |
| [[quality/BL-0039\|BL-0039]] | complete | SB-FO принят: каталог, проверки, визуальные эталоны и делегированная визуальная приёмка подтверждены. |

## front-office

- [[front-office/BL-0020]]
- [[front-office/BL-0021]]
- [[front-office/BL-0022]]
- [[front-office/BL-0023]]
- [[front-office/BL-0024]]
- [[front-office/BL-0025]]
- [[front-office/BL-0026]]
- [[front-office/BL-0027]]
- [[front-office/BL-0028]]
- [[front-office/BL-0029]]
- [[front-office/BL-0030]]
- [[front-office/BL-0031]]
- [[front-office/BL-0032]]
- [[front-office/BL-0033]]
- [[front-office/BL-0034]]
- [[front-office/BL-0035]]
- [[front-office/BL-0036]]
- [[front-office/BL-0037]]
## delivery

- [[delivery/BL-0038]]
## quality

- [[quality/BL-0039]]

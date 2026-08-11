# back-office

- Изменяй только этот автономный Vue-контур; исходные импорты из `front-office` запрещены.
- Runtime-код следует `app -> pages -> widgets -> features -> entities -> shared`.
- Storybook, его истории, fixtures, scripts, тесты и артефакты находятся в `.storybook`; `src` содержит только runtime-код.
- Перед приёмкой запускай команды из `package.json` и сверяй документацию с кодом.

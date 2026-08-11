---
title: Границы и проверки Storybook
type: contract
owner: root
last_verified: 2026-08-11
sources:
  - ../../back-office/.storybook/main.ts
  - ../../front-office/.storybook/main.ts
  - ../../back-office/.storybook/scripts/check-storybook-manifest.mjs
  - ../../front-office/.storybook/scripts/check-manifest.mjs
---

# Границы и проверки Storybook

Back-office задаёт свой glob stories и addon a11y в собственной Storybook
конфигурации. [back-office/.storybook/main.ts:config](../../back-office/.storybook/main.ts).

Front-office задаёт свой glob stories и addon a11y в собственной Storybook
конфигурации. [front-office/.storybook/main.ts:config](../../front-office/.storybook/main.ts).

Back-office manifest checker сравнивает проекцию `index.json` с reference;
reference содержит 96 entries. [back-office/.storybook/scripts/check-storybook-manifest.mjs:projectIndex](../../back-office/.storybook/scripts/check-storybook-manifest.mjs), [back-office/.storybook/scripts/reference-index.json:entries](../../back-office/.storybook/scripts/reference-index.json).

Front-office manifest checker сравнивает проекцию `index.json` с reference;
reference содержит 174 entries. [front-office/.storybook/scripts/check-manifest.mjs:projectIndex](../../front-office/.storybook/scripts/check-manifest.mjs), [front-office/.storybook/artifacts/reference-index.json:entries](../../front-office/.storybook/artifacts/reference-index.json).

Back-office a11y suite запускает Axe для выбранных stories.
[back-office/.storybook/tests/a11y.e2e.ts:storyIds](../../back-office/.storybook/tests/a11y.e2e.ts).

Back-office visual suite снимает заданные stories при viewport 1280×900.
[back-office/.storybook/tests/visual.e2e.ts:visualStories](../../back-office/.storybook/tests/visual.e2e.ts).

Front-office a11y suite запускает Axe для выбранных stories.
[front-office/.storybook/tests/a11y.spec.mjs:storyIds](../../front-office/.storybook/tests/a11y.spec.mjs).

Front-office visual suite проверяет screenshots menu и journey.
[front-office/.storybook/tests/visual.spec.mjs:entry](../../front-office/.storybook/tests/visual.spec.mjs).

Back-office manifest script проверяет его story catalog.
[back-office/.storybook/scripts/check-storybook-manifest.mjs:projectIndex](../../back-office/.storybook/scripts/check-storybook-manifest.mjs).

Front-office manifest script проверяет его story catalog.
[front-office/.storybook/scripts/check-manifest.mjs:projectIndex](../../front-office/.storybook/scripts/check-manifest.mjs).

Back-office runtime routes задаёт `backOfficeRoutes`.
[back-office/src/app/router.constants.ts:backOfficeRoutes](../../back-office/src/app/router.constants.ts).

Front-office runtime routes задаёт `router`.
[front-office/src/app/router.ts:router](../../front-office/src/app/router.ts).

# CI/CD

- **Q-CI-001.** CI backend выполняет `npm ci`, lint, typecheck, модульные и интеграционные тесты, OpenAPI check, production build и Docker build.
- **Q-CI-002.** CI front-office выполняет `npm ci`, lint, typecheck, тесты, Storybook checks, application build и Docker build.
- **Q-CI-003.** CI back-office выполняет `npm ci`, lint, typecheck, тесты, Storybook checks, application build и Docker build.
- **Q-CI-FO-SB.** Каждый pull request front-office публикует Storybook preview и результат визуальной регрессии.
- **Q-CI-BO-SB.** Каждый pull request back-office публикует Storybook preview и результат визуальной регрессии.

## Pipeline backend

1. `npm ci`;
2. lint;
3. typecheck;
4. модульные тесты;
5. интеграционные тесты с PostgreSQL;
6. генерация и проверка OpenAPI;
7. production build;
8. Docker build;
9. развёртывание основной ветки в `development`;
10. миграции `development`;
11. API smoke в `development`;
12. проверка совпадения версии, changelog и Git-тега при выпуске;
13. развёртывание тегированного Docker-образа в `staging`;
14. миграции `staging`;
15. health-check и smoke в `staging`;
16. ручное продвижение проверенного Docker-образа в `production` после приёмки MVP;
17. миграции `production`;
18. health-check и smoke в `production`.

Шаги 9–11 выполняются для основной ветки. Шаги 12–15 запускаются только для Git-тега версии. Шаги 16–18 отключены до завершения разработки и приёмки MVP.

## Pipeline front-office и back-office

1. `npm ci`;
2. lint;
3. typecheck;
4. модульные тесты;
5. Storybook interaction tests;
6. автоматическая проверка доступности;
7. визуальная регрессия;
8. Storybook build;
9. application build;
10. Docker build;
11. развёртывание основной ветки в `development`;
12. E2E против backend в `development`;
13. проверка совпадения версии, changelog и Git-тега при выпуске;
14. развёртывание тегированного Docker-образа в `staging`;
15. E2E и browser smoke в `staging`;
16. ручное продвижение проверенного Docker-образа в `production` после приёмки MVP;
17. browser smoke в `production`.

Шаги 11–12 выполняются для основной ветки. Шаги 13–15 запускаются только для Git-тега версии. Шаги 16–17 отключены до завершения разработки и приёмки MVP.

Правила выпуска: [[Release-and-version-compatibility]].

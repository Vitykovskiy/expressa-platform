---
title: Среды поставки
type: operations
owner: root
last_verified: 2026-09-14
sources:
  - ../../.github/workflows/development-delivery.yml
  - ../../deploy/deploy.sh
---

# Среды поставки

Поддерживается только development: customer — <https://dev.expressa.vitykovskiy.ru/>,
admin — <https://admin.dev.expressa.vitykovskiy.ru/>, API —
<https://api.dev.expressa.vitykovskiy.ru>. Health проверяется по `/health/live`
и `/health/ready`; OpenAPI доступен в development.

База development одноразовая: каждая поддерживаемая поставка пересоздаёт её из
`backend/schema.sql` и заполняет seed. Staging и production не поддерживаются,
пока не принято отдельное решение о постоянных данных.

## Доступ к development

Для единственного оператора локальный файл
`deploy/development-access.env` — источник значений для номера первого
администратора, OTP для development и фиксированного номера клиента development;
он не является источником полномочий. Полномочия и поддерживаемая операция
задаются этой инструкцией и применимыми правилами работы.
Он должен содержать только:

```dotenv
BOOTSTRAP_ADMIN_PHONE=+7XXXXXXXXXX
AUTH_DEVELOPMENT_OTP=XXXXXX
DEVELOPMENT_CUSTOMER_PHONE=+7XXXXXXXXXX
```

Создайте файл копированием `deploy/development-access.env.example` и ограничьте
доступ текущим пользователем:

```bash
chmod 600 deploy/development-access.env
```

Файл игнорируется Git и никогда не коммитится. Не удаляйте его при очистке
рабочего каталога.

Перед поставкой синхронизируйте значения в GitHub Environment `development`:

```bash
sed -n 's/^BOOTSTRAP_ADMIN_PHONE=//p' deploy/development-access.env | gh secret set BOOTSTRAP_ADMIN_PHONE --env development
sed -n 's/^AUTH_DEVELOPMENT_OTP=//p' deploy/development-access.env | gh secret set AUTH_DEVELOPMENT_OTP --env development
```

`DEVELOPMENT_CUSTOMER_PHONE` остаётся только в локальном игнорируемом файле и
не синхронизируется в GitHub Secrets. Для входа customer используйте этот номер
и тот же `AUTH_DEVELOPMENT_OTP`. После каждого пересоздания development-базы
первый успешный вход customer снова создаёт учётную запись; данные customer и
заказы между поставками не сохраняются.

После синхронизации выполните development-поставку. Только
`BOOTSTRAP_ADMIN_PHONE` и `AUTH_DEVELOPMENT_OTP` начинают действовать на стенде
после синхронизации GitHub Secrets и development-поставки.
`DEVELOPMENT_CUSTOMER_PHONE` — локальная справка для ручного входа; ему не
нужны ни синхронизация, ни development-поставка.

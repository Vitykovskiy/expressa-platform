---
title: Управление доступностью
type: feature
owner: root
implementation_status: current
last_verified: 2026-08-26
sources:
  - ../../back-office/src/pages/AvailabilityPage.vue
  - ../../back-office/src/pages/admin/availability/AvailabilityScreen.vue
  - ../../backend/src/catalog/transport/backoffice-availability.controller.ts
---

# Управление доступностью

Barista и administrator управляют доступностью на `/availability`. Экран
показывает приём новых заказов и активные категории с товарами, размерами
напитков и добавками; сотрудник сужает список поиском и категорией, затем
включает или выключает выбранную позицию либо приём новых заказов.
[AvailabilityPage](../../back-office/src/pages/AvailabilityPage.vue),
[AvailabilityScreen](../../back-office/src/pages/admin/availability/AvailabilityScreen.vue),
[маршруты](../../back-office/src/app/router.constants.ts).

Переключатель блокируется на время сохранения. После успешного изменения экран
показывает подтверждённое состояние; при неуспехе восстанавливает предыдущее.
Для приёма заказов экран показывает автора и время последнего изменения, когда
они возвращены сервером. Доступность отдельных позиций в текущем интерфейсе
такую метаинформацию не показывает.
[AvailabilityPage](../../back-office/src/pages/AvailabilityPage.vue),
[Availability API](../../back-office/src/shared/api/availability.api.ts).

Сервер хранит и аудитирует изменения доступности, а создание заказа использует
текущее состояние товара и приёма заказов. [Домен доступности](../30-domain/Availability.md),
[контроллер](../../backend/src/catalog/transport/backoffice-availability.controller.ts).

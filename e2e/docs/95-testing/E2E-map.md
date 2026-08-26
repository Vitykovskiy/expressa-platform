---
title: Карта standalone E2E-сценариев
description: Реестр сквозных браузерных сценариев Expressa.
type: testing
area: e2e
status: active
tags: [e2e, scenarios]
related:
  - ../20-architecture/ADR/ADR-001-standalone-e2e-architecture.md
  - ../80-conventions/Definition-of-Done.md
  - ../../../docs/95-testing/Release-verification.md
---

# Карта standalone E2E-сценариев

Набор связывает действия administrator, customer и сотрудника через отдельно
запущенные front-office и back-office. Подробные пользовательские шаги и
ожидаемые результаты — в JSDoc соответствующего spec; правила их оформления — в
[Code Style](../80-conventions/Code-style.md).

| Spec                                             | Backlog                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `catalog/publish-product.spec.ts`                | [BL-0166](../../../docs/10-overview/backlog/E13/quality/BL-0166.md) |
| `checkout/place-order.spec.ts`                   | [BL-0167](../../../docs/10-overview/backlog/E13/quality/BL-0167.md) |
| `fulfillment/issue-order.spec.ts`                | [BL-0168](../../../docs/10-overview/backlog/E13/quality/BL-0168.md) |
| `order-history/view-issued-order.spec.ts`        | [BL-0169](../../../docs/10-overview/backlog/E13/quality/BL-0169.md) |
| `order-lifecycle/complete-order-journey.spec.ts` | [BL-0170](../../../docs/10-overview/backlog/E13/quality/BL-0170.md) |

Карта фиксирует только границу E13: BL-0166–BL-0170 и пять связанных specs.
Она не является полным реестром сценариев приложения.

## Открытое противоречие по истории заказов

[BL-0169](../../../docs/10-overview/backlog/E13/quality/BL-0169.md) требует,
чтобы customer видел выданный заказ в истории. В
[истории и повторе заказа](../../../docs/40-features/Track-history-and-repeat-order.md)
история обозначена как неподдерживаемая runtime-возможность, а
[TARGET-01](../../../docs/95-testing/Mandatory-scenarios.md#целевые-требования-вне-текущего-runtime-green-gate)
фиксирует её как требование вне текущего runtime green gate.

Карта не выбирает продуктовое ожидание и не ослабляет критерии BL-0169.
Противоречие должно быть разрешено в источниках требований и runtime-контракте
до подтверждения сценария истории как выполненного runtime-поведением.

Все сценарии используют только UI Playwright и обязательные URL окружения.
Подготовка через API, БД, Web Storage или изменение сети не допускается. Место
E2E-набора в release-приёмке определяет
[проверка готовности и выпуска](../../../docs/95-testing/Release-verification.md).

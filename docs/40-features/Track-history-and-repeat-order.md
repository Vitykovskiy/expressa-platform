---
type: feature
owner: root
implementation_status: current
last_verified: 2026-09-20
sources:
  - ../../backend/openapi/openapi.json
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
  - ../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md
---

# Текущий заказ, история и повтор

Customer history, detail and repeat use only v3 order routes. Order snapshot uses current product/price-choice contract; it has no variant/S-M-L fields. Notification association and current-browser logout use the required-body contract in [ADR-009](../20-architecture/ADR/ADR-009-explicit-logout-push-contract.md). Browser permission and local subscription are unchanged by logout.

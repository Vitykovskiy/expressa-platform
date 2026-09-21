---
title: Orders
type: domain
owner: backend
last_verified: 2026-09-20
sources:
  - ../../openapi/openapi.json
  - ../../src/orders/transport/orders-v3.controller.ts
  - ../../src/orders/transport/backoffice-orders-v3.controller.ts
  - ../../src/orders/transport/backoffice-orders.controller.ts
---

# Orders

Customer create/read/repeat и staff read существуют только в v3. Four staff lifecycle transitions остаются current v2 API. Deleted v2 reads/customer commands, variant and S/M/L fields отсутствуют. Exact HTTP schemas принадлежат [OpenAPI](../../openapi/openapi.json).

---
title: Application state and API
type: architecture
owner: front-office
last_verified: 2026-09-20
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/public-menu.api.ts
  - ../../src/shared/api/orders.api.ts
---

# Application state and API

Client consumes v3 public menu and v3 customer orders. Cart key is `expressa.customer.cart.v3`; removed `expressa.customer.cart` is discarded, not migrated. Product configuration uses price choices, not variants/S-M-L. Auth and push routes remain v2 only where present in contract snapshot.

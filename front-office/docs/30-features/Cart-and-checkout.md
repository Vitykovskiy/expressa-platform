---
title: Cart and checkout
type: feature
owner: front-office
last_verified: 2026-09-20
sources:
  - ../../contracts/openapi.json
  - ../../src/entities/customer/model/cart.store.ts
  - ../../src/features/checkout/checkout.store.ts
---

# Cart and checkout

Checkout creates order through `POST /api/v3/orders`. A cart item has product, optional price-choice id and modifier selections; it has no variant or S/M/L state. Server remains authority for total, availability and intake.

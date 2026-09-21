---
title: Orders
type: feature
owner: front-office
last_verified: 2026-09-20
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/orders.api.ts
---

# Orders

History, detail, create and repeat use only `/api/v3/orders`. Order snapshots retain current contract fields, including nullable portion-label and price-choice id; they do not retain variants/S-M-L. v2 order fallback is absent.

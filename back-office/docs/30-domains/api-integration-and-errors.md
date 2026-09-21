---
title: API integration and errors
type: domain
owner: back-office
last_verified: 2026-09-20
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/catalog.api.ts
  - ../../src/shared/api/availability.api.ts
---

# API integration and errors

Client contract snapshot is source of paths and schemas. Catalog/product reads and commands use v3; retained category, modifier, availability, intake and lifecycle operations use v2. Deleted v2 catalog product/order read routes have no retry or fallback path.

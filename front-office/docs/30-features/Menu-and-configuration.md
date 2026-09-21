---
title: Menu and configuration
type: feature
owner: front-office
last_verified: 2026-09-20
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/public-menu.api.ts
  - ../../src/features/menu/product-configuration.ts
---

# Menu and configuration

Menu reads `GET /api/v3/public/menu`. A product has one price or ordered price choices; portion label is display text. Client never interprets a choice as `S/M/L`, and no v2 public menu fallback exists.

---
title: Authentication and returnTo
type: feature
owner: front-office
last_verified: 2026-09-20
sources:
  - ../../contracts/openapi.json
  - ../../src/shared/api/auth.api.ts
  - ../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md
---

# Authentication and returnTo

Client uses current v2 OTP, refresh, `me` and required-body logout routes. Logout sends `pushSubscription: null | object`; no other payload form exists. Exact push/logout behavior belongs to [ADR-009](../../../docs/20-architecture/ADR/ADR-009-explicit-logout-push-contract.md).

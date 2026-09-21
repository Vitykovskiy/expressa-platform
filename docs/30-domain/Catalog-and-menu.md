---
title: Каталог и меню
type: domain
owner: root
last_verified: 2026-09-20
sources:
  - ../../backend/openapi/openapi.json
  - ../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md
---

# Каталог и меню

Публичное меню, чтение admin catalog и product commands работают только через v3 API. Categories и modifier groups — текущие v2 API. Product содержит одну цену с optional display label либо price choices; variant/S-M-L model удалена. [ADR-008](../20-architecture/ADR/ADR-008-v3-catalog-orders-cutover.md) задаёт полную contract boundary.

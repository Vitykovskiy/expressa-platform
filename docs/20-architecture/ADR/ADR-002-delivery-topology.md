---
title: Топология поставки E01
description: Изолированные development и staging на одном VPS с локальным Docker Distribution.
type: adr
area: architecture
status: accepted
tags: [expressa, delivery, deployment, vps]
updated: 2026-08-02
source_mode: normative
owner: root
last_verified: 2026-08-11
sources:
  - ../../../deploy/compose.yml
  - ../../../deploy/deploy.sh
  - ../../../deploy/staging.env
  - ../../../.github/workflows/development-delivery.yml
  - ../../../.github/workflows/staging-deploy.yml
requirements: [BL-0014, BL-0018, BL-0019]
repositories: [expressa-platform]
related: ["[[../Repository-boundaries]]", "[[../../70-deployment/Environments]]", "[[../../70-deployment/CI-CD]]", "[[../../70-deployment/Operations-runbook]]"]
---

# ADR-002. Топология поставки E01

## Контекст

Development и staging должны быть изолированы на одном VPS, а поставка — обходиться без внешнего registry и не раскрывать registry в сети. Обе среды используют единый проверенный набор образов, но staging не должен пересобирать его.

## Решение

Один VPS обслуживает development и staging. Локальный Docker Distribution доступен только на `127.0.0.1:5000`, а CI подключается к нему временным SSH-tunnel.

`main` проверяет три приложения, собирает единый набор immutable digest-образов и автоматически развёртывает development. Тег `staging-v*` развёртывает ровно три digest из [deploy/staging.env](../../../deploy/staging.env) без пересборки. Текущий checkout `deploy.sh` и `compose.yml` передаются SCP во временный каталог VPS и удаляются после запуска.

## Последствия

- Development и staging изолированы на одном VPS.
- Registry не имеет внешней публикации.
- Staging использует те же digest-образы, что были проверены в `main`.
- Production в этой топологии отсутствует.

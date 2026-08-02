---
title: Топология поставки E01
description: Изолированные development и staging на одном VPS с локальным Docker Distribution.
type: adr
area: architecture
status: accepted
tags: [expressa, delivery, deployment, vps]
updated: 2026-08-02
source_mode: normative
requirements: [BL-0014, BL-0018, BL-0019]
repositories: [expressa-platform]
related: ["[[../Repository-boundaries]]", "[[../../70-deployment/Environments]]", "[[../../70-deployment/CI-CD]]", "[[../../70-deployment/Operations-runbook]]"]
---

# ADR-002. Топология поставки E01

## Контекст

Клиентам нужен совместимый backend без локального запуска, а development и staging не должны делить базу, контейнеры или маршруты. Поставка должна обходиться без внешнего registry и не раскрывать registry в сети.

## Решение

Один VPS несёт две Compose-проекции с отдельными edge/data-сетями и runtime-файлами. Bootstrap создаёт сети, включая внутренние data-сети; Compose использует их как external. Shared Caddy подключён к edge-сетям и обслуживает по три HTTPS-домена на среду.

На VPS запущен Docker Distribution, доступный только через `127.0.0.1:5000`; данные размещены в `/srv/expressa/registry/data`, удаление отключено. GitHub Actions подключается к registry временным SSH-tunnel. SHA-образы write-once, а компонентные release aliases ссылаются на существующий digest без пересборки. Staging читает точный набор digest-ссылок из `deploy/staging.env`.

## Последствия

- Данные и контейнеры development/staging изолированы сетями и именами Compose.
- Registry не имеет внешней публикации; в GitHub environments хранятся только пять SSH-параметров доступа.
- Откат development выполняется вручную по `state/previous`; изменения схемы базы автоматически не откатываются.
- Production не является частью решения.

---
title: Топология поставки E01
description: Изолированные development и staging на одном VPS с неизменяемыми GHCR-образами.
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

Три приложения нужно совместно проверять без локального backend у каждого клиента, при этом один VPS уже обслуживает shared Caddy и Nginx. Development и staging не должны смешивать базу, контейнеры или маршруты. Удалённый GitHub-репозиторий проекта — `Vitykovskiy/expressa-platform`; рабочая структура монорепозитория остаётся определённой ADR-001.

## Решение

На одном VPS используются две независимые Compose-проекции: `expressa-development` и `expressa-staging`. У каждой есть внешняя edge-сеть и внутренняя data-сеть, собственный PostgreSQL volume, runtime-секрет и состояние поставки. Shared Caddy подключается к edge-сетям и обслуживает по три HTTPS-домена на среду; Nginx перенаправляет HTTP на HTTPS. Санитизированный контролируемый аудит подтверждает два применения bootstrap и последующую read-only приёмку этой топологии; образов и контейнеров приложений на VPS нет.

Поставка принимает только immutable digest-ссылки трёх фиксированных GHCR-пакетов. При успешной авторизации коммиты `main` создают `sha-<полный SHA>` образы для development. Компонентные SemVer-теги создают aliases существующих SHA-digest, а staging получает фиксированный манифест из трёх digest по тегу `staging-vX.Y.Z`.

## Последствия

- Одна среда не может обращаться к PostgreSQL другой среды через Docker-сеть.
- Клиенты используют backend своей среды через same-origin `/api/v1`, без CORS-конфигурации между UI и API-доменом.
- Откат контейнеров опирается на предыдущее immutable state; миграции не получают автоматического отката.
- Production не является частью этой топологии и требует отдельного ADR и реализации.

## Статус реализации

Bootstrap применён, Compose и GitHub workflows подготовлены. Реальные application deployment и staging release отсутствуют из-за неразрешённой GHCR-авторизации GitHub Actions; это не меняет принятое архитектурное решение.

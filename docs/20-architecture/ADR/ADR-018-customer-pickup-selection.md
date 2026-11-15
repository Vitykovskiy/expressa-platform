---
title: "ADR-018: customer pickup selection"
type: adr
owner: root
status: proposed
date: 2026-11-14
knowledge_role: decision
scope: system
sources:
  - ADR-012-back-office-source-contract.md
  - ../../00-meta/Update-protocol.md
  - ../../../backend/src/orders/adapters/postgres-order-unit-of-work.ts
---

# ADR-018: customer pickup selection

## Context and authority

The current user requests implementation of accepted front-office pages four and five, including pickup selection. This narrowly supersedes the former customer-selection exclusion in ADR-012 and MVP scope. Existing UTC current-day ten-minute windows, configured hours/capacity, active occupancy and atomic order allocation remain required. Accepted Figma examples do not establish a fifteen-minute policy.

This is the pre-code contract decision A01-S1. `proposed` means implementation and independent review are pending; it is not a runtime or user acceptance claim. The bounded additive implementation may proceed under the original request. No framework, storage topology or existing public API is removed.

## Customer API target

Add `GET /api/v3/orders/pickup-slots`, under the same customer authentication/authorization as order creation. Register the static route before `:orderId`. Return 200 with `serviceDay` (`YYYY-MM-DD`, UTC), `timeZone: "UTC"`, `slotMinutes: 10`, `acceptsNewOrders: boolean` and `slots: [{startsAt, endsAt, available}]`. Timestamps use canonical UTC ISO serialization. Read settings, database clock and occupancy in one consistent read snapshot. Send `Cache-Control: no-store`. Do not reserve capacity or expose customer/order identities or counts.

Generate all remaining current-day candidates, sorted by start, using the existing automatic allocation sequence: start at `max(opening, ceil(now / ten minutes) * ten minutes)`, then ten-minute increments whose end does not exceed closing. Availability is active occupancy below configured capacity. Include occupied candidates as unavailable; return an empty list after the day's candidates end. `acceptsNewOrders=false` prevents booking independently of capacity. No query date, timezone, branch or pagination is added.

Extend `POST /api/v3/orders` with optional `pickupSlotStart: string`. Omission means automatic nearest selection. Explicit `null`, malformed or noncanonical UTC timestamp is 400 `VALIDATION_ERROR`. Accept only the start; server derives the end. Both successful paths retain existing response shape, including assigned `pickupSlot`, monetary/item snapshots and status.

For explicit selection, after idempotency replay and existing catalog/total/intake revalidation, acquire the same singleton settings row lock as automatic allocation. Read fresh database time and occupancy after acquiring that lock. Require the start to be a member of the freshly generated candidate sequence and its active count below capacity. Past, different-day, settings-invalidated and occupied candidates return 409 `PICKUP_SLOT_UNAVAILABLE`, with normal error envelope and `details: null`. Never substitute another window. Automatic exhaustion retains 409 `ORDER_CAPACITY_UNAVAILABLE`. Syntax validation precedes replay; temporal/capacity validation follows replay.

## Atomicity and idempotency

Keep the customer/key advisory lock, replay lookup, fingerprint comparison, settings lock, allocation and all order/snapshot/idempotency writes in the existing unit-of-work transaction. A valid replay returns the original order before capacity revalidation, even after the selected time passes. Failure rolls back all writes; no hold/reservation table exists.

Preserve the exact legacy fingerprint serialization when selection is omitted. For explicit selection append canonical `pickupSlotStart` to the fingerprint. Different explicit choices, or automatic versus explicit, therefore conflict under the same key. Canonicalize validated input once at the transport/domain boundary. Repeat-order continues to omit selection and auto-allocate; do not inherit the source order's time.

## Customer state and recovery

The cart proceeds to a protected `/checkout/pickup` page after existing authentication/registration checks; cart action does not submit. Empty cart returns to cart. The slot page owns final `Оформить заказ`, busy `Оформляем…`. Choosing any row never sends POST. The in-memory selection is separate from the immutable submission attempt.

Normal initial successful load with open intake and at least one available candidate selects `Как можно скорее`; explicit rows are mutually exclusive and occupied rows disabled. Loading, read failure, empty capacity and closed intake cannot become a bookable default. On read failure offer the accepted refresh action. A later successful read can establish normal readiness only when not recovering a conflict.

On `PICKUP_SLOT_UNAVAILABLE`, clear selection, retain cart, reload candidates and show transient overlay feedback. Keep the rejected row unavailable if still a current candidate. Submit remains disabled until an explicit choice of an available row or `Как можно скорее`; successful refresh must not silently select. Automatic capacity refusal likewise reloads without silently booking a fallback. Server remains authoritative at final submission.

Network-unknown retry retains the exact body/key and choice of the immutable attempt. Disable preference changes while submission is busy or unresolved retry could create a second order. Retry replays the same attempt without requiring fresh capacity success; otherwise a committed order could become unrecoverable. Definite rejection releases the attempt; corrected selection/body uses a fresh key. Preserve existing changed-total reconfirmation, item correction and closed-intake behavior; never bypass them through the new page. Success clears cart/selection and navigates to the existing order detail. Back navigation does not submit or mutate an order.

Use accepted one-column layout, CTA-only footer, list-owned scrolling and overlay notification. Show date/time using explicit UTC basis, never implicit browser timezone; no readiness guarantee, duplicate footer summary or new scheduling feature is added.

## Compatibility and publication

Reuse existing paired pickup timestamps and ten-minute schema constraint. No schema, migration, seed, stored status or order-read DTO change is required. Existing clients omitting selection and repeats remain automatic. Publish backend OpenAPI and synchronize both client snapshots according to the existing cross-repository contract. Update backend Orders/API notes, consuming checkout/scenario notes, coverage/navigation and the narrow superseded exclusions in the same packet. No back-office runtime change is required.

## Consequences and revision trigger

The list is advisory; races remain normal and produce recoverable conflict. The existing settings lock preserves capacity but also preserves existing serialization cost. Independent review must cover actual transaction ordering, legacy fingerprint bytes, both consumers' snapshots, unresolved-network recovery and final responsive rendering. Automated tests and new verification automation remain prohibited by root AGENTS. Reconsider for an explicit future-day/timezone/hold/branch requirement or a verified conflicting primary contract. Infrastructure recovery follows separate inventory and does not alter this contract.

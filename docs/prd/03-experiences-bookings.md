# PRD — Experiences & bookings

**ID prefix:** `FR-EXP-*`  
**Phase:** 3  
**Master:** [PRD.md](../PRD.md)

## 1. Problem

Experiences are bookable capacity over time. Oversell is a P0 product defect.

## 2. In scope

Experiences tied to places; slots with capacity; bookings; cancel; idempotency; party size.

## 3. Out of scope

Payments capture, refunds, coupons, waitlists, recurring slot templates (v1: explicit slots only), calendar sync.

## 4. Objects

- **Experience:** title, description, `place_id`, `host_user_id`, status (`draft|published|archived`), `attrs jsonb`, price **minor units** + `currency`.
- **Slot:** `during tstzrange`, `capacity` (≥1), `status` (`open|closed`).
- **Booking:** `party_size` ≥1, status `pending|confirmed|cancelled`. v1: `POST` creates `confirmed` immediately (no payment). `pending` reserved for future payment.

## 5. Functional requirements

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FR-EXP-001 | Host/admin creates experience at a place in the same tenant | FK + tenant match |
| FR-EXP-002 | Explorer cannot create experiences | 403 |
| FR-EXP-003 | Published experiences appear in list; drafts owner/admin only | |
| FR-EXP-004 | Host creates slots; overlapping slots for same experience **forbidden** (exclusion) | 409 `SLOT_OVERLAP` |
| FR-EXP-005 | Booking requires published experience, `open` slot, `during` contains now or future (no book in the past) | 400 `SLOT_IN_PAST` |
| FR-EXP-006 | `party_size` ≤ remaining capacity | 409 `BOOKING_CAPACITY` |
| FR-EXP-007 | Concurrent bookings never exceed capacity | TR-TEST-005 |
| FR-EXP-008 | User cannot double-book same slot | 409 `BOOKING_CONFLICT` |
| FR-EXP-009 | `Idempotency-Key` required on POST booking | 400 if missing |
| FR-EXP-010 | Same key + same body → same booking; same key + different body → 409 `IDEMPOTENCY_CONFLICT` | |
| FR-EXP-011 | Cancel by booker or host/admin; cancelled does not count toward capacity | |
| FR-EXP-012 | List bookings: explorer sees own; host sees bookings for their experiences; admin sees tenant | |
| FR-EXP-013 | Price snapshot on booking (`amount_minor`, `currency`) copied from experience at confirm | Experience price change does not mutate old bookings |
| FR-EXP-014 | `externalPaymentId` optional string; no card fields | |

## 6. User stories

- As an explorer, I book 2 seats if 2 remain.
- As an explorer, retrying a dropped connection does not create two bookings.
- As a host, I close a slot (`status=closed`) and new bookings fail.

## 7. Errors

`BOOKING_CAPACITY`, `BOOKING_CONFLICT`, `SLOT_OVERLAP`, `SLOT_IN_PAST`, `IDEMPOTENCY_CONFLICT`, `NOT_FOUND`, `FORBIDDEN`.

## 8. Concurrency

Implement TRD §9 (row lock or xact advisory lock + count). Document in `docs/perf/phase3-bookings.md`.

## 9. Dependencies

Places (FR-GEO). Categories optional: `category_id` nullable in Phase 3.

# PRD — AI recommendations

**ID prefix:** `FR-REC-*`  
**Phase:** 4 (naive), 7 (v2)  
**Master:** [PRD.md](../PRD.md)

## 1. Problem

Explorers should see a personalized ranked list without a separate recs service. Signals live in Postgres (embeddings, bookings, reviews).

## 2. In scope

User preference embedding; similar places/experiences; cache table; Phase 7 collaborative signal (co-booking).

## 3. Out of scope

Bandit algorithms, real-time session RNN, emails as the recs UI, multi-armed testing platform.

## 4. Functional requirements

| ID | Requirement | Phase | Acceptance |
|----|-------------|-------|------------|
| FR-REC-001 | `GET /v1/recommendations` returns published places/experiences | 4 | Array length ≤ `limit` |
| FR-REC-002 | If `user_preferences.embedding` exists, rank by cosine distance | 4 | Mock vectors |
| FR-REC-003 | Else if geo on query/user last point, rank by popularity × distance decay | 4 | |
| FR-REC-004 | Else tenant trending (MV when exists, else booking counts) | 4–5 | |
| FR-REC-005 | Exclude already booked experiences (active/confirmed) | 4 | |
| FR-REC-006 | UNLOGGED cache keyed `(tenant_id, user_id)`; TTL column `expires_at` | 5 | Miss recomputes |
| FR-REC-007 | v2 SQL adds co-occurrence: experiences booked by users who booked what I booked | 7 | Deterministic fixture |
| FR-REC-008 | Blend v2: `0.6 * semantic + 0.4 * collab_norm` (weights in settings) | 7 | |
| FR-REC-009 | Preference PATCH updates JSONB `doc` and marks embedding stale; embed on write like search | 5 | |
| FR-REC-010 | Timeout budget 800ms for live compute; on timeout serve trending + log | 7 | |

## 5. User stories

- As a new explorer, I still see *something* (trending), not an empty list.
- As a repeat explorer, recs resemble my reviews/preferences.
- As ops, truncating rec cache does not 500.

## 6. Privacy

Recommendations never mix tenants. Collaborative query must stay inside `tenant_id` (RLS + explicit join).

## 7. Dependencies

Search embeddings (Phase 4). Cache table (Phase 5). Trending MV (Phase 5). Activity/bookings (Phase 3).

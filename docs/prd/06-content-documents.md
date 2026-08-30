# PRD — Content & semi-structured documents

**ID prefix:** `FR-DOC-*`  
**Phase:** 5  
**Master:** [PRD.md](../PRD.md)

## 1. Problem

Reviews, itineraries, experience attributes, and user preferences are not uniformly relational. They must remain queryable (containment, FTS) inside Postgres.

## 2. In scope

Reviews, itineraries, preference documents, JSONB GIN, experience/place `attrs` filters on list/search.

## 3. Out of scope

Object storage for media blobs. Store **metadata only** (`media[]` with `url`, `mime`, `width`, `alt`). No S3 integration required; URLs are opaque strings.

## 4. JSON schemas (v1)

Version field `_v: 1` required on documents. Unknown `_v` → 400.

**Review `payload`**

```json
{
  "_v": 1,
  "rating": 1,
  "tags": ["family"],
  "media": [{ "url": "https://...", "mime": "image/jpeg" }]
}
```

`rating` also a real column `smallint 1–5` (indexed); payload may duplicate for flexibility.

**Itinerary `doc`**

```json
{
  "_v": 1,
  "title": "48h in Lisbon",
  "days": [
    { "label": "Day 1", "placeIds": [], "experienceIds": [] }
  ]
}
```

IDs must reference same-tenant published entities (validate on write).

**Preferences `doc`**

```json
{
  "_v": 1,
  "interests": ["food", "jazz"],
  "budgetMinorMax": 5000,
  "mobility": "walk"
}
```

**Experience `attrs` (example)**

```json
{ "durationMin": 90, "indoor": false, "language": ["en", "pt"] }
```

## 5. Functional requirements

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FR-DOC-001 | Explorer creates review on published place and/or experience they can see | One review per user per target (partial unique) |
| FR-DOC-002 | `rating` 1–5 required | 400 otherwise |
| FR-DOC-003 | `payload` GIN; filter `payloadTags=family` → `@> '{"tags":["family"]}'` | TR-TEST-007 |
| FR-DOC-004 | Review `fts` includes body | Searchable in Phase 4 endpoint **or** `GET /v1/reviews?q=` — **decision: reviews join hybrid search in a later iteration; Phase 5 is CRUD + filter. Optional: include review text in place fts via trigger — skip in v1 to avoid scope creep.** |
| FR-DOC-005 | Host/admin can hide review (`status=hidden`); explorers don’t see hidden | |
| FR-DOC-006 | Itinerary owner CRUD; list mine only | |
| FR-DOC-007 | Itinerary IDs validated same tenant | 400 `INVALID_ITINERARY_REF` |
| FR-DOC-008 | Preferences GET/PATCH upsert | |
| FR-DOC-009 | Place/experience list/search support `attrs` JSON containment query param | |
| FR-DOC-010 | Media: max 10 items, url ≤ 2048 chars, no file upload | |

## 6. User stories

- As an explorer, I save a weekend itinerary as a document.
- As an explorer, I filter experiences `indoor=true` via attrs.
- As a tenant admin, I hide an abusive review.

## 7. Errors

`INVALID_ITINERARY_REF`, `DUPLICATE_REVIEW`, `VALIDATION`.

## 8. Dependencies

Phase 3 entities. Embeddings on reviews optional Phase 6 backfill (`embedding_stale`).

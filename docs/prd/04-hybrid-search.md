# PRD — Hybrid search

**ID prefix:** `FR-SRCH-*`  
**Phase:** 4  
**Master:** [PRD.md](../PRD.md)

## 1. Problem

Users search with keywords *and* intent (“quiet sunset tasting”). Keyword-only misses synonyms; vector-only misses exact names. Geo must still constrain.

## 2. In scope

`GET /v1/search` over **published** places and experiences; FTS; pgvector; distance; popularity; tenant ranking weights; query embedding in Node.

## 3. Out of scope

Typo-tolerant search beyond `pg_trgm` optional boost; multi-language stemming beyond `english`; federated search across tenants; autocomplete endpoint (can add later as `tsquery` prefix — not Phase 4).

## 4. Functional requirements

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FR-SRCH-001 | `q` uses `websearch_to_tsquery('english', q)` against generated `fts` | Stemming: “tasting” matches “taste” if dict allows; fixture uses a known stem |
| FR-SRCH-002 | Query embedding computed in app; `<=>` cosine against row embeddings | Mock provider deterministic |
| FR-SRCH-003 | Geo: if `lat`/`lng` present, `ST_DWithin` + distance decay in score | |
| FR-SRCH-004 | Default weights 0.35 / 0.30 / 0.20 / 0.15 (text, semantic, geo, popularity) | Overridable via `tenants.settings.ranking` |
| FR-SRCH-005 | `q` empty and no geo → 400 `SEARCH_UNCONSTRAINED` | |
| FR-SRCH-006 | `q` empty + geo → near-me hybrid without text (text_rank=0) | |
| FR-SRCH-007 | Hits include `kind`, `id`, `title`, `score`, optional `distanceM` | |
| FR-SRCH-008 | Only `published` rows | Drafts never appear |
| FR-SRCH-009 | `limit` default 20 max 50; cursor pagination | |
| FR-SRCH-010 | If embedding missing/stale, row still searchable via FTS+geo; semantic term treated as 0 | |
| FR-SRCH-011 | Optional `kind=place\|experience` filter | |
| FR-SRCH-012 | Optional `categoryId` filter on experiences | |
| FR-SRCH-013 | Phrase support via websearch quotes | Test `"exact title fragment"` |

## 5. Ranking (normative defaults)

```
score = w_text * norm(ts_rank_cd)
      + w_sem  * (1 - cosine_distance)     -- 0 if no embedding
      + w_geo  * exp(-distance_m / 5000) -- 1 if no geo query
      + w_pop  * norm(popularity)
```

`norm` is min-max over the **candidate set after filters**, or a fixed cap documented in SQL. Must be in one statement (window functions allowed).

## 6. User stories

- As an explorer, I search “live jazz” and get keyword hits even if embeddings are stale.
- As an explorer, I search “quiet wine tasting” and semantic neighbors appear even if “quiet” is not in the title.
- As a tenant admin, I raise `w_geo` so downtown inventory wins.

## 7. Errors

`SEARCH_UNCONSTRAINED`, `VALIDATION`, `EMBEDDING_UNAVAILABLE` (not used if we degrade — **decision: degrade, no 5xx**).

## 8. Dependencies

Places + experiences. Popularity: at least booking count or `0`.

## 9. Tests

TR-TEST-006. Additional: hybrid vs text-only order on a 3-row fixture (document expected order in test name).

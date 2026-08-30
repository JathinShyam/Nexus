# PRD — Places & geospatial discovery

**ID prefix:** `FR-GEO-*`  
**Phase:** 2  
**Master:** [PRD.md](../PRD.md)

## 1. Problem

Explorers need “what’s near me” with correct distance, not application-side haversine on all rows.

## 2. In scope

Places as first-class locations; radius and bbox queries; distance sort; GeoJSON-ish coordinates in API; optional tenant delivery/city polygon.

## 3. Out of scope

Map tiles, routing, geocoding API, reverse geocode, snapping to roads, PostGIS topology.

## 4. Place lifecycle

| Status | Meaning | Who writes |
|--------|---------|------------|
| `draft` | Not in public lists | Owner host, tenant_admin |
| `published` | Visible to tenant members | Owner/admin publish |
| `archived` | Hidden | Admin/owner |

## 5. Functional requirements

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FR-GEO-001 | Place has `title`, optional `description`, `lat`/`lng` stored as `geography(Point,4326)` | Round-trip within 1e-7 deg |
| FR-GEO-002 | `POST /v1/places` host or tenant_admin; sets `host_user_id` = caller unless admin sets another host | 403 for explorer |
| FR-GEO-003 | `GET /v1/places/:id` published: any member; draft: owner/admin only; other tenant: 404 | TR-TEST-003 |
| FR-GEO-004 | `GET /v1/places` with `lat`,`lng`,`radiusM` returns only `ST_DWithin` hits | TR-TEST-004 |
| FR-GEO-005 | Results include `distanceM` (integer, rounded) and sort ascending distance | |
| FR-GEO-006 | `bbox=w,s,e,n` uses `ST_MakeEnvelope` + `&&` / `ST_Intersects` on geography/geometry cast documented in TRD implementation | Outside points excluded |
| FR-GEO-007 | `radiusM` min 50 max 50_000; default 3000 | 400 if out of range |
| FR-GEO-008 | If tenant has `boundary` polygon, new places must be inside (`ST_Covers`); if null, anywhere | 400 `OUTSIDE_BOUNDARY` |
| FR-GEO-009 | `attrs jsonb` stored; no filter required until Phase 5 | Schema present |
| FR-GEO-010 | List is cursor-paginated, not offset | |
| FR-GEO-011 | Delete is archive (`status=archived`), not physical delete | GET 404 for explorers |

## 6. User stories

- As an explorer, I send my coordinates and see nearby published places.
- As a host, I add a venue in my city.
- As a tenant admin, I reject points outside the city boundary.

## 7. API body (create)

```json
{
  "title": "Old Dock Market",
  "description": "...",
  "lng": -0.12,
  "lat": 51.5,
  "attrs": { "indoor": true }
}
```

Response includes `id`, `distanceM` when query was geo.

## 8. Errors

`OUTSIDE_BOUNDARY`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`.

## 9. Performance

GiST on `geog`. Tests seed ≥100 places and assert `EXPLAIN` contains `gist` / Index Scan (Phase 2 docs).

## 10. Dependencies

Phase 1 RLS wrapper. Search FTS/vectors are Phase 4 (columns may be added later; do not block Phase 2 on embeddings).

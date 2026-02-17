## 2026-01-31 - Faceted Search Optimization
**Learning:** Replacing multiple sequential metadata queries with `$facet` in MongoDB Aggregation reduced DB round trips from 6 to 2 (1 for days + 1 for facets/data). This eliminates N+1 latency for dynamic filter options.
**Action:** Look for "Filter Metadata" patterns in other endpoints to apply `$facet`.

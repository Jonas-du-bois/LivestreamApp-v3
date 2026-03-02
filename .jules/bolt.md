## 2026-01-31 - Faceted Search Optimization
**Learning:** Replacing multiple sequential metadata queries with `$facet` in MongoDB Aggregation reduced DB round trips from 6 to 2 (1 for days + 1 for facets/data). This eliminates N+1 latency for dynamic filter options.
**Action:** Look for "Filter Metadata" patterns in other endpoints to apply `$facet`.

## 2026-02-05 - Server-Side Caching with defineCachedEventHandler
**Learning:** Using `defineCachedEventHandler` with `swr: true` for external API calls (like weather) significantly improves performance and resilience without complex caching logic.
**Action:** Check all external API calls in server routes and wrap them with `defineCachedEventHandler` where appropriate.

## 2026-02-17 - Aggregation Pipeline Projection Optimization
**Learning:** In MongoDB aggregations involving grouping, pushing `$$ROOT` into an array includes all fields from the original document, including large unused arrays (like `history` or `monitors`). This significantly increases memory usage during the aggregation and payload size.
**Action:** Always add a `$project` stage *before* a `$group` stage that pushes `$$ROOT`, to strictly whitelist only the necessary fields. This reduces memory pressure and network transfer.

## 2026-02-18 - Aggregation Pipeline Simplification
**Learning:** Combining `$project` and `$group` stages when transforming data (like date formatting) into a group key avoids creating intermediate documents, saving memory and CPU cycles (~6% faster).
**Action:** Audit aggregation pipelines for sequential `$project` + `$group` stages where the projection is only used for the grouping key.

## 2026-03-05 - Granular Server Function Caching
**Learning:** `defineCachedEventHandler` caches the entire response based on the request URL (including query params). However, internal data dependencies that are query-independent (like "available days") are re-computed on every cache miss for different filter combinations.
**Action:** Extract query-independent data fetching logic into `defineCachedFunction` wrappers to cache them separately with longer TTLs, reducing database load even when the main handler cache misses.

## 2026-03-20 - Batching Database Queries in Scheduler
**Learning:** In a loop iterating over items (e.g., passages to notify), performing a database query inside the loop (N+1 pattern) scales poorly. Batching these into a single `$in` query and filtering in-memory reduced execution time by ~75% (161ms -> 40ms for 50 items).
**Action:** Always audit loops in scheduled tasks or batch processing logic. If a DB query uses an item's ID, extract all IDs first and execute a single batch query.

## 2026-03-30 - Server-side projection for Mongoose populate queries
**Learning:** Mongoose `populate()` will fetch the entire document from the database if no field selection is provided. `Group` and `Passage` documents have unbounded `history` arrays (past scores) and a `monitors` array. Fetching these large arrays on high-frequency loops (like the scheduler running every 30s) or list-heavy endpoints causes excessive memory usage, increased DB payload size, and slower serialization.
**Action:** Mongoose `.populate()` calls on heavily relational models must include explicit field projections (e.g., `.populate('group', 'name')`) to strictly specify which fields should be returned.

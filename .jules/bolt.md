## 2026-01-31 - Faceted Search Optimization
**Learning:** Replacing multiple sequential metadata queries with `$facet` in MongoDB Aggregation reduced DB round trips from 6 to 2 (1 for days + 1 for facets/data). This eliminates N+1 latency for dynamic filter options.
**Action:** Look for "Filter Metadata" patterns in other endpoints to apply `$facet`.

## 2026-02-02 - Aggregation vs Populate
**Learning:** Using `$lookup` and `$group` in MongoDB Aggregation is significantly more performant than `find().populate()` followed by in-memory grouping for large datasets. However, `$unwind` defaults to inner join behavior (dropping documents if the array is empty). Use `preserveNullAndEmptyArrays: true` and `$cond` in projection to replicate `populate`'s left join behavior and avoid data loss.
**Action:** When refactoring to Aggregation, always audit optional relationships and explicitly handle nulls in `$unwind` and `$project`.

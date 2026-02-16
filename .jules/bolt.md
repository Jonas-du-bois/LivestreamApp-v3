## 2024-05-22 - Optimizing Aggregation Pipelines with Grouping
**Learning:** In Mongoose/MongoDB, performing `$lookup` on a referenced field (like `Apparatus`) for *every* document in a large collection (like `Passage`) is inefficient (O(N) lookups).
**Action:** When the goal is to group results by that referenced field anyway (e.g., Results by Apparatus), group by the foreign key (ObjectId) *first*, and then perform the `$lookup` on the grouped results. This reduces lookups from O(N) to O(M) where M is the number of groups (e.g., 5 apparatuses vs 1000 passages).

## 2026-02-15 - MongoDB Aggregation vs Node Processing
**Learning:** Replaced a complex Aggregation with a Covered Index Query + Node.js processing, expecting a speedup. Result was ~4x SLOWER (20ms -> 85ms).
**Action:** Trust MongoDB's C++ aggregation engine over transferring data to Node, even for "simple" groupings, unless the dataset is massive and the aggregation is CPU bound.

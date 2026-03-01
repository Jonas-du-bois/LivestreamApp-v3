## 2023-11-20 - [Mongoose Relational Population Optimization]
**Learning:** Mongoose `.populate()` calls on heavily relational models (like `Group` and `Passage`) must include explicit field projections (e.g., `.populate('group', 'name logo')`) to prevent fetching unbounded arrays (like `history`) into memory, especially in high-frequency background jobs like schedulers.
**Action:** Use `.select()` on queries and explicit field projections in `.populate()` to optimize memory usage when fetching related Mongoose documents.

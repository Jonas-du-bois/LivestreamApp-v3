## 2024-05-18 - Optimize scheduler memory usage and notification dispatch
**Learning:** High-frequency tasks running in the Nitro backend (like the 30s `scheduler.ts`) that query Mongoose without `.lean()` can create significant memory pressure and trigger GC pauses due to massive Document instantation, especially as database arrays grow. Furthermore, batch processing relations via nested array iterations (`O(P * S * F)`) causes main thread spikes.
**Action:** Always append `.lean()` to Mongoose queries inside `setInterval` if you only need to read data. Always use a Map (`O(N + M)`) to index cross-referenced collections before iterating through the batch.
## 2024-05-19 - Bulk Database Operations in Nitro Background Jobs
**Learning:** Performing multiple database mutations (e.g., `findByIdAndUpdate`, `findByIdAndDelete`) inside a `Promise.all()` loop within background tasks (like `setInterval` in Nitro plugins) causes significant N+1 query problems. This spams the database and can stall the connection pool.
**Action:** Always collect target IDs during the loop execution into an array, and perform a single bulk operation (e.g., `updateMany`, `deleteMany`) after the loop concludes to optimize performance to O(1) DB calls.

## 2026-03-31 - O(1) Memory Database Ranking
**Learning:** Calculating rankings by fetching all sorted IDs into memory (`.find().select('_id')`) scales linearly in memory and CPU `O(N)`. It also behaves inconsistently with score ties. Counting documents with a strictly greater score (`.countDocuments({ score: { $gt: currentScore } })`) leverages indexes directly, uses $O(1)$ memory, and mathematically handles ties correctly.
**Action:** Always use `.countDocuments()` with inequality operators for numeric ranking instead of fetching and sorting arrays.

## 2024-05-18 - Optimize scheduler memory usage and notification dispatch
**Learning:** High-frequency tasks running in the Nitro backend (like the 30s `scheduler.ts`) that query Mongoose without `.lean()` can create significant memory pressure and trigger GC pauses due to massive Document instantation, especially as database arrays grow. Furthermore, batch processing relations via nested array iterations (`O(P * S * F)`) causes main thread spikes.
**Action:** Always append `.lean()` to Mongoose queries inside `setInterval` if you only need to read data. Always use a Map (`O(N + M)`) to index cross-referenced collections before iterating through the batch.
## 2024-05-19 - Bulk Database Operations in Nitro Background Jobs
**Learning:** Performing multiple database mutations (e.g., `findByIdAndUpdate`, `findByIdAndDelete`) inside a `Promise.all()` loop within background tasks (like `setInterval` in Nitro plugins) causes significant N+1 query problems. This spams the database and can stall the connection pool.
**Action:** Always collect target IDs during the loop execution into an array, and perform a single bulk operation (e.g., `updateMany`, `deleteMany`) after the loop concludes to optimize performance to O(1) DB calls.

## 2026-11-01 - Cached Intl.DateTimeFormat
**Learning:** Using `toLocaleDateString()` or dynamically creating `new Intl.DateTimeFormat()` inside loops or high-frequency render functions causes significant overhead due to parser instantiation. Also, `Date.parse('invalid')` returns `NaN` which safely defaults to 'Invalid Date' with `new Date()`, but passing `NaN` directly to `Intl.DateTimeFormat.prototype.format(NaN)` throws a fatal `RangeError`.
**Action:** Always cache and reuse `Intl.DateTimeFormat` instances using module-scoped constants or a memoized Map (keyed by locale/options). Always verify parsed dates with `Number.isNaN()` before formatting them with a cached formatter.

## 2026-02-17 - Parallelizing Scheduler Operations
**Learning:** Node.js schedulers processing independent database operations (like notifications or status updates for multiple items) should use `Promise.all` instead of sequential `for...of` loops to minimize latency.
**Action:** Always review cron jobs for sequential `await` calls inside loops that could be parallelized.

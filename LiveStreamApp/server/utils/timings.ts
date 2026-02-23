/**
 * Centralised timing constants for the Nitro server.
 *
 * Every cache maxAge, scheduler interval, and TTL used on the backend
 * is defined here so the whole timing behaviour can be tuned from a single place.
 *
 * Client-side timings live in `app/utils/timings.ts`.
 */

// ─── Nitro SWR cache (seconds) ─────────────────────────────────────
/** /api/schedule – fresh data duration (s) */
export const SCHEDULE_CACHE_MAX_AGE = 5

/** /api/schedule – serve stale while revalidating (s) */
export const SCHEDULE_CACHE_STALE_MAX_AGE = 5

/** /api/results – fresh data duration (s) */
export const RESULTS_CACHE_MAX_AGE = 10

/** /api/weather – fresh data duration (s) – weather rarely changes */
export const WEATHER_CACHE_MAX_AGE = 60 * 15 // 15 minutes

// ─── Scheduler ──────────────────────────────────────────────────────
/** How often the scheduler checks for status transitions (ms) */
export const SCHEDULER_INTERVAL = 30_000

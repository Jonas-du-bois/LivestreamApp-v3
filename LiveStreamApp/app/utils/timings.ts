/**
 * Centralised timing constants for the client-side app.
 *
 * Every TTL, polling interval, and timeout used on the frontend is defined here
 * so the whole timing behaviour can be tuned from a single place.
 *
 * Server-side timings live in `server/utils/timings.ts`.
 */

// ─── Auto-refresh intervals (polling fallback when socket is down) ──
/** Schedule page auto-refresh (ms) */
export const SCHEDULE_AUTO_REFRESH = 45_000

/** Favorites page auto-refresh (ms) */
export const FAVORITES_AUTO_REFRESH = 45_000

/** Home page auto-refresh – shows LIVE data, needs faster updates (ms) */
export const HOME_AUTO_REFRESH = 30_000

// ─── Clock / display refresh ────────────────────────────────────────
/** How often we refresh "now" timestamp for time-based filtering (ms) */
export const NOW_REFRESH_INTERVAL = 60_000

/** Favorites countdown timer tick (ms) */
export const COUNTDOWN_TICK = 1_000

// ─── Socket status overrides ────────────────────────────────────────
/** After receiving a status-update via socket, we wait this long before
 *  clearing the local override and fetching fresh data from the API (ms) */
export const STATUS_OVERRIDE_DEFER = 8_000

// ─── Cache TTLs ─────────────────────────────────────────────────────
/** GroupDetailsModal in-memory cache TTL (ms) */
export const GROUP_DETAILS_CACHE_TTL = 30_000

// ─── Socket.io client config ────────────────────────────────────────
/** Initial reconnection delay (ms) */
export const SOCKET_RECONNECTION_DELAY = 1_000

/** Maximum reconnection delay (ms) – exponential backoff cap */
export const SOCKET_RECONNECTION_DELAY_MAX = 10_000

/** Socket connection timeout (ms) */
export const SOCKET_TIMEOUT = 20_000

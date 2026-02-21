# Core's Refactoring Journal

## 2026-02-21: Stream Service Abstraction

- **Logic Extracted:** Duplicated `$fetch` calls for streams and live data in `pages/stream/[id].vue` and `pages/stream/index.vue`.
- **Destination:** `app/services/public.service.ts`
- **Changes:**
  - Added `fetchStream(id)`, `fetchStreams()`, and `fetchLive()` methods to `PublicService`.
  - Updated `fetchGroupDetails` to use `apiClient` for consistent error/auth handling.
  - Added `PopulatedPassage` and `PopulatedStream` interfaces to `app/types/api.ts`.
  - Refactored `pages/stream/[id].vue` and `pages/stream/index.vue` to use `PublicService`.
- **Outcome:** Removed raw `$fetch` usage and `useRuntimeConfig` boilerplate from components. Centralized stream fetching logic and types.

## 2026-02-21: Passage Filtering & Search Abstraction

- **Logic Extracted:** Complex filtering, searching, and enrichment logic for passages from `pages/admin/dashboard.vue`.
- **Destination:** `app/composables/usePassageFilters.ts`
- **Changes:**
  - Created `app/types/ui.ts` to define `PassageSearchable`.
  - Created `usePassageFilters` composable that handles enrichment (normalization) and multi-criteria filtering (day, apparatus, search query, status, etc.).
  - Refactored `pages/admin/dashboard.vue` to use this composable, removing ~70 lines of local logic (`buildPassageUI`, `filteredPassages`).
- **Outcome:** Decoupled filtering logic from UI component. Logic is now reusable (e.g., for Schedule or Favorites in the future) and strictly typed.

## 2026-02-21: Weather Service Robustness

- **Issue:** Weather data was not displaying ("null" response), refresh was broken, timezone was incorrect, and update time didn't refresh.
- **Root Cause:** Backend potentially caching failed fetches. Frontend caching behavior. Open-Meteo defaulting to UTC. User feedback expectation mismatch on "Last updated".
- **Changes:**
  - **Server:** Switched `server/api/weather.get.ts` to `defineEventHandler` (no cache) and `throw createError` on failure. Added `timezone: 'Europe/Zurich'` parameter.
  - **Client:** Updated `pages/weather.vue` to use `useAsyncData` with `PublicService.fetchWeather()` (imperative fetch). Added error UI and retry logic.
  - **UX:** Changed "Last updated" to display the client-side fetch time (`lastRefreshedAt`) instead of API data time, providing better feedback.
  - **Service:** Added `fetchWeather()` to `PublicService`.
- **Outcome:** Weather page now correctly handles loading, errors, manual refresh, and displays local time of last check.

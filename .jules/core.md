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

## 2026-02-21: Group Details Modal Logic Abstraction

- **Logic Extracted:** Duplicated `provide/inject` pattern and wrapper functions for opening the "Group Details" modal in `app/layouts/default.vue`, `app/pages/schedule.vue`, `app/pages/results.vue`, `app/pages/favorites.vue`, and `app/pages/stream/[id].vue`.
- **Destination:** `app/composables/useGroupDetails.ts`
- **Changes:**
  - Created `useGroupDetails` composable using `useState` for global UI state (`isOpen`, `groupId`, `apparatusCode`).
  - Removed `provide('openGroupDetails')` from `default.vue` layout.
  - Removed `inject('openGroupDetails')` and local `handleGroupClick` wrappers from pages.
  - Updated templates to use `useGroupDetails().open()` directly or via simplified handlers.
- **Outcome:** Eliminated "prop drilling" (via inject) and loose coupling. Enforced strict typing for modal interactions. Centralized modal state management.

## 2026-02-21: First Load Skeleton & Public Service Refactoring

- **Logic Extracted:** Duplicated skeleton loading logic (`hasLoadedOnce`) and direct `useFetch` configuration in `app/pages/results.vue` and `app/pages/schedule.vue`.
- **Destination:** `app/composables/useFirstLoad.ts` and `app/services/public.service.ts`
- **Changes:**
  - Enhanced `PublicService.getResults` and `PublicService.getSchedule` to accept `useFetch` options (`server`, `watch`, `lazy`).
  - Created `useFirstLoad` composable to manage the "show skeleton only on initial load" state, preventing flickering on background refreshes.
  - Refactored `results.vue` and `schedule.vue` to use these abstractions.
- **Outcome:** Removed ~40 lines of boilerplate from components. Centralized API configuration and loading state logic. strictly typed.

## 2026-02-21: Realtime Status Logic Extraction

- **Logic Extracted:** Duplicated logic for handling realtime socket updates (status overrides, scores, versioning, refresh debouncing) in `app/pages/schedule.vue` and `app/pages/favorites.vue`.
- **Destination:** `app/composables/useRealtimeStatus.ts`
- **Changes:**
  - Created `useRealtimeStatus` composable.
  - Extracted `statusOverrides`, `statusVersion`, `handleStatusUpdate`, `handleScoreUpdate`, and debounce logic.
  - Refactored `schedule.vue` and `favorites.vue` to use the composable.
- **Outcome:** Removed ~60 lines of duplicated code. Centralized tricky debounce logic and map management.

## 2026-02-21: Passage Timing & Status Abstraction

- **Logic Extracted:** Duplicated date parsing, time-based status calculation (LIVE/FINISHED/SCHEDULED), and upcoming/past list filtering from `app/pages/schedule.vue` and `app/pages/favorites.vue`.
- **Destination:** `app/composables/usePassageTiming.ts`
- **Changes:**
  - Created `usePassageTiming` composable.
  - Implemented `PassageTimeEnriched` interface.
  - Centralized `now` timestamp management (reactive).
  - Centralized logic for `upcomingPassages`, `pastPassages`, `nextEvent`, and `timeToNext`.
  - Refactored `schedule.vue` to use the composable for status calculation (preserving overrides).
  - Refactored `favorites.vue` to use the composable, removing manual timer logic.
- **Outcome:** Removed ~40 lines of code from `favorites.vue` and simplified `schedule.vue`. Standardized "Live" status logic across the app.

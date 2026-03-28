# Warden's Refactoring Journal

## 2026-02-21: Streams and Plan Strict Typing & Auto-Imports Cleanup

- **Target:** `app/pages/stream/index.vue`, `app/pages/stream/[id].vue`, `app/pages/plan.vue`
- **Risks Mitigated:**
    - **Weak Typing:** Replaced implicit and explicit `any` usages with strict `PassageEnriched`, `Stream`, `PopulatedStream`, and Leaflet types to prevent runtime data manipulation errors.
    - **Code Noise / Fragility:** Removed explicit Nuxt 4 auto-imports (Vue primitives like `ref`, `computed`, `watch`, `onMounted`) according to best practices.
- **Solution:**
    - Refactored `liveData` and mapped functions (`mapStreamToDisplay`, `liveStreams`, `offlineStreams`) to use proper interfaces from `app/types/api.ts`.
    - Protected Leaflet map interactions with strict `import('leaflet').Map` casting instead of `any`.

## 2026-02-21: Admin Dashboard Security & Stability

- **Target:** `app/pages/admin/dashboard.vue`
- **Risks Mitigated:**
    - **Memory Leaks:** 3 uncleaned `setTimeout` timers (`searchDebounceTimer`, `notificationTimer`, `scoreSaveTimer`) could have caused state updates on unmounted components.
    - **Weak Typing:** Replaced `any` in socket event handlers (`handleStreamUpdate`, `handleScoreUpdate`) with strict `StreamUpdatePayload` and `ScoreUpdatePayload` interfaces.
    - **SSR Safety:** Replaced `typeof window` check with `import.meta.client`.
- **Solution:**
    - Created `app/types/socket.ts` for shared socket payload definitions.
    - Implemented strict timer management with `clearTimeout` in `onBeforeUnmount`.
    - Leveraged Nuxt auto-imports by removing explicit Vue imports.

## 2026-02-21: Group Details Strict Typing & SSR Safety

- **Target:** `app/components/overlays/GroupDetailsModal.vue`
- **Risks Mitigated:**
    - **Weak Typing:** Replaced pervasive `any` usage in `details` ref, `detailsCache`, and socket payload handlers with strict `GroupDetailsResponse` and `ScoreUpdatePayload` interfaces.
    - **SSR Safety:** Wrapped `window` event listeners in `onMounted`/`onUnmounted` with `import.meta.client` check to ensure SSR compatibility.
- **Solution:**
    - Defined `GroupDetailsResponse` and `TimelineEntry` in `app/types/api.ts`.
    - Updated `PublicService` to return typed responses.
    - Refactored `GroupDetailsModal` to use strict types and removed all `any` casts.

## 2026-02-21: Results Page Strict Typing & SSR Safety

- **Target:** `app/pages/results.vue`
- **Risks Mitigated:**
    - **Weak Typing:** Replaced `any` in socket event handlers (`handleScoreUpdate`, `handleStatusUpdate`) with strict `ScoreUpdatePayload` interface.
    - **SSR Safety:** Wrapped `document.getElementById` access in `import.meta.client` check to prevent server-side crashes.
    - **Performance/Fragility:** Replaced `JSON.parse(JSON.stringify(newData))` with `structuredClone(toRaw(newData))` for efficient and robust deep cloning.
- **Solution:**
    - Defined `ScoreUpdatePayload` and `StatusUpdatePayload` in `app/types/socket.ts` with optional fields for dynamic entries.
    - Refactored `results.vue` to use these types and `structuredClone`.
    - Ensured explicit handling of optional `score` with null coalescing.

## 2026-02-21: Search Overlay Strict Typing & SSR Safety

- **Target:** `app/components/overlays/SearchOverlay.vue`
- **Risks Mitigated:**
    - **Weak Typing:** Replaced `any` casts on `PassageEnriched` properties (`group`, `apparatus`) with strict typing. Fixed mismatched expectations between `Group` and `EnrichedGroup` interfaces.
    - **SSR Safety:** Wrapped `window.addEventListener` in `import.meta.client` check to prevent server-side execution.
- **Solution:**
    - Updated `EnrichedGroup` in `app/types/api.ts` to include `canton` and `logo`.
    - Updated `server/api/schedule.get.ts` to return these fields.
    - Refactored `SearchOverlay.vue` to use correct types and remove casts.

## 2026-02-21: FilterSheet and Event Listeners SSR Safety & Strict Typing

- **Target:** `app/components/overlays/FilterSheet.vue`, `app/pages/results.vue`, `app/pages/admin/dashboard.vue`, `app/types/socket.ts`
- **Risks Mitigated:**
    - **Weak Typing:** Implicit `any` used for schedule meta state prevented build-time validation. Extracted missing explicit interfaces (`ScheduleMeta`) for proper type safety. Replaced `any` in error handlers.
    - **Nuxt API Misuse / Over-engineering:** Redundant Nuxt `useState` local state copies tied to watch events caused messy reactivity flows. Replaced with simpler reactive `ref` synced properly.
    - **SSR Safety:** Native `window.addEventListener` in `onMounted`/`onUnmounted` risks crashing SSR hydration if not strictly guarded.
- **Solution:**
    - Created `ScheduleMeta` typing and properly bounded explicit refs in `FilterSheet.vue`.
    - Wrapped window listeners in `import.meta.client` check.
    - Ensured `ScoreUpdatePayload` included `apparatusCode` to stop `any` usage.
    - Updated catch blocks from `catch (e: any)` to `catch (e: unknown)` and properly parsed `Error` instances.

# Warden's Refactoring Journal

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

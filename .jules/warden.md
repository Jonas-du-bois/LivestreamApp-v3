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

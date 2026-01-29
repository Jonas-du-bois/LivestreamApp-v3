# Full Stack Sync & Integrity Audit Report

**Date:** October 26, 2023
**Role:** Senior Lead Architect
**Scope:** Deep Code Analysis of `app/` (Frontend) vs `server/` (Backend)

---

## 🔴 PRIORITY 1: CRITICAL (App Broken / Security Risk)

These issues prevent core functionality (Real-Time, Filtering) from working as intended.

### 1. 🔗 Real-Time Scores Broken (`results.vue`)
-   **Issue:** The `results.vue` component listens for the `score-update` event but **does not join** the required Socket.io room `live-scores`.
-   **Mismatch:** The Frontend expects a full `Passage` object in the event payload (checking `updatedPassage.apparatus.code`), but the Backend (`score.put.ts`) sends a minimal payload:
    ```typescript
    { passageId, groupName, apparatusCode, totalScore, rank }
    ```
-   **Impact:** Live scores will **never** appear on the client without a manual page refresh.

### 2. 🔗 Real-Time Streams Broken (`stream/[id].vue`)
-   **Issue:** The Backend (`stream.put.ts`) emits updates to a specific room: `stream-{streamId}`.
-   **Gap:** The Frontend component **never emits** `join-room` for this specific room. It listens globally, so it will receive nothing.
-   **Impact:** If an Admin changes a stream from "YouTube" to "External Link" or updates the "Live" status, users watching the page will see no change.

### 3. 🧩 Disconnected Filter Logic (`FilterSheet.vue`)
-   **Issue:** The `FilterSheet.vue` component manages its own local state (`selectedDivision`, `selectedSalle`, etc.). When "Appliquer" is clicked, it merely emits a `close` event.
-   **Gap:** `schedule.vue` has its own isolated `selectedDay` and `selectedFilter` (Apparatus) state. It does not listen to or share state with the Filter Sheet.
-   **Impact:** The sophisticated filters in the Sheet (Division, Salle) are **UI-only** and have zero effect on the schedule list.

---

## 🟠 PRIORITY 2: IMPORTANT (UX / Missing Features)

These features are implemented on the Backend but missing or potentially buggy on the Frontend.

### 1. 🧩 Missing Real-Time Status in Schedule (`schedule.vue`)
-   **Issue:** The Backend (`status.put.ts`) emits a `status-change` event to the `schedule-updates` room when a passage moves to `LIVE` or `FINISHED`.
-   **Gap:** `schedule.vue` has **no socket listener** for this event.
-   **Impact:** Users scrolling the schedule will not see which group is currently passing (pulsing red "LIVE" indicator) unless they refresh.

### 2. 🛡️ Potential Admin Dashboard Bug (`dashboard.vue`)
-   **Issue:** In `fetchData`, the code assumes `refresh()` returns the data:
    ```typescript
    const [scheduleData, streamsData] = await Promise.all([scheduleRes.refresh(), ...])
    ```
    Depending on the Nuxt/UseFetch version, `refresh()` often returns a Promise that resolves to `void` (updating the reactive `data` ref side-effectually).
-   **Risk:** If `scheduleData` is `undefined`, the dashboard will fail to load passages, showing an empty list.

---

## 🟢 PRIORITY 3: POLISH (Code Quality / UI)

Minor cleanups and type safety improvements.

### 1. 🔗 Missing Types in Services
-   **PublicService:** `getGroupDetails` returns `any`.
    -   *Recommendation:* Create a `GroupDetails` interface in `types/api.ts` matching the populated backend response.
-   **NotificationService:** `syncFavorites` casts the body to `any`.
    -   *Recommendation:* Use the typed `Subscription` interface.

### 2. 🧩 Untyped Global State
-   **FilterSheet:** Uses `useState<any>('scheduleMeta')`.
    -   *Recommendation:* Explicitly type this state to avoid "Member 'availableApparatus' implicitly has an 'any' type" errors.

### 3. 🛡️ Admin Token UX
-   **Observation:** The Admin Dashboard correctly implements the token injection via `useAdminAuth`.
-   *Recommendation:* Ensure the token is persisted (e.g., in `localStorage` or `pinia-plugin-persistedstate`) so the admin doesn't have to re-login on every refresh (currently handled by `useState`, which resets on refresh).

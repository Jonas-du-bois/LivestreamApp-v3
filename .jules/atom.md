# Atom Architecture Journal

## UI Component Abstraction

**Decision:**
All generic, reusable UI components (buttons, badges, cards) will be placed in `app/components/ui/` and prefixed with `Ui` (e.g., `UiGlassBackButton`).

**Component Created:**
*   `UiGlassBackButton.vue`
    *   **Purpose:** Standardize the "Back" button styling across the app.
    *   **Features:**
        *   Supports both `NuxtLink` (via `to` prop) and `<button>` (default).
        *   Includes glassmorphism styles (`glass-panel`).
        *   Standardizes hover/active states.
        *   Allows class overrides.

**Refactoring:**
Replaced duplicated code in:
*   `app/pages/afterparty.vue`
*   `app/pages/plan.vue`
*   `app/pages/food.vue`
*   `app/pages/infos.vue`
*   `app/pages/weather.vue`

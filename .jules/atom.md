# Atom's Architecture Journal ⚛️

## 03/11 - Création de `<UiBackButton>`

- **Component:** `app/components/ui/BackButton.vue`
- **Pattern:** Abstracted the "Back Button" logic (Glassmorphism, Icon, Text) into a reusable component.
- **Rule:** All generic UI components (buttons, badges, cards) must be prefixed with `Ui` and placed in `app/components/ui/`.
- **Logic:** The component handles both `NuxtLink` (via `to` prop) and history navigation (via `router.back()`).

## 19/02 - Création de `<UiStatusBadge>`

- **Component:** `app/components/ui/StatusBadge.vue`
- **Pattern:** Abstracted the status indicators (Open/Closed, Live, Coming Soon) with their pulse/ping animations.
- **Rule:** Use slots for label content to allow internationalization and flexibility.
- **Logic:** Centralizes variant mapping (colors/borders) and consistent animation timings.

## 19/02 - Création de `<UiInfoTile>`

- **Component:** `app/components/ui/InfoTile.vue`
- **Pattern:** Standardized info cards with icons (used for stats, links, highlights).
- **Rule:** Supports both static `div` and `NuxtLink` via the `to` prop.
- **Logic:** Dynamic sizing (`sm`, `md`, `lg`) and themeable accent colors.

## 19/02 - Création de `<UiIconButton>`

- **Component:** `app/components/ui/IconButton.vue`
- **Pattern:** Unified icon-only buttons with Glassmorphism and hover states.
- **Rule:** Mandates `label` for accessibility (renamed from ariaLabel to avoid TS conflicts). Supports variants (`ghost`, `glass`, `dark`).
- **Logic:** Centralizes click animations (`active:scale-90`) and feedback (badges, active state).
- **UX Note:** For modals, preferred position is top-left for navigation consistency in this app.

## 19/02 - Création de `<UiEmptyState>`

- **Component:** `app/components/ui/EmptyState.vue`
- **Pattern:** Abstracted "No Results" or "Empty List" containers.
- **Rule:** Uses slots for actions (`#actions`) to allow custom buttons/links.
- **Logic:** Centralizes the iconic circle style and consistent spacing/typography for empty states.

## 19/02 - Création de `<UiFilterChips>`

- **Component:** `app/components/ui/FilterChips.vue`
- **Pattern:** Horizontal scrolling list of buttons for filtering or tab switching.
- **Rule:** Uses `v-model` for two-way binding. Unifies the scrollbar hiding and accessibility attributes.
- **Logic:** Centralizes the active/inactive state styling and hover/active animations.

## 19/02 - Création de `<UiGlassCard>`

- **Component:** `app/components/ui/GlassCard.vue`
- **Pattern:** Standardized container for content using the Glassmorphism theme.
- **Rule:** Automatically handles interaction states (`hover`, `active scale`) and correctly wraps as a `NuxtLink` if the `to` prop is provided.
- **Logic:** Centralizes the visual feedback consistency across the app while allowing flexible padding and content.

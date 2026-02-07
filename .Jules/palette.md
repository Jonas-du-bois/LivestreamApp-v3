## 2024-05-22 - Modal Accessibility Pattern
**Learning:** Custom overlay components (like `GroupDetailsModal` and `FilterSheet`) are manually implemented with `Teleport` and `Transition` but systematically lack basic accessibility features (ARIA roles, label, keyboard support).
**Action:** When touching any overlay component in this codebase, immediately check for and add `role="dialog"`, `aria-modal="true"`, `aria-label` on close buttons, and `Escape` key listeners.

## 2024-05-23 - Toggle Button Accessibility
**Learning:** Filter toggle buttons were visually indicating state with color changes but lacked semantic state for screen readers.
**Action:** Use `aria-pressed="true|false"` on button elements that function as toggles, especially when they are part of a filter set.

## 2024-05-24 - Dynamic Action Labels
**Learning:** Icon-only buttons (like Favorites) in lists are common but lack context for screen readers.
**Action:** Always bind a dynamic `aria-label` to these buttons that includes the item's name (e.g., `Retirer ${group.name} des favoris`), rather than a static label.

## 2024-05-25 - Header Navigation & Action Accessibility
**Learning:** Important navigation and action buttons in the global header and drawers are frequently icon-only for aesthetic minimalism but completely invisible to screen readers.
**Action:** Systematically add `aria-label` to all icon-only buttons in `layouts/` and `components/overlays/`, and consider adding `title` for mouse hover tooltips as a bonus.

## 2024-05-26 - Custom Tab Interfaces
**Learning:** Custom navigation elements like the Day Switcher are visually tabs but implemented as buttons. Screen readers need `role="tablist"` on the container and `role="tab"` + `aria-selected` on the buttons to understand the relationship.
**Action:** When implementing custom segmented controls or day pickers, use the `tablist` pattern instead of just independent buttons.

## 2026-02-07 - Interactive List Item Pattern
**Learning:** Schedule and Result items are implemented as `div`s with `@click` handlers, making them inaccessible to keyboard users and screen readers.
**Action:** Convert interactive list items to `role="button"` with `tabindex="0"`, add `@keydown.enter` and `@keydown.space` handlers, and ensure a descriptive `aria-label` is provided that summarizes the item's content.

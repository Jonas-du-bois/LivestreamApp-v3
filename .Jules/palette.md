## 2024-05-22 - Modal Accessibility Pattern
**Learning:** Custom overlay components (like `GroupDetailsModal` and `FilterSheet`) are manually implemented with `Teleport` and `Transition` but systematically lack basic accessibility features (ARIA roles, label, keyboard support).
**Action:** When touching any overlay component in this codebase, immediately check for and add `role="dialog"`, `aria-modal="true"`, `aria-label` on close buttons, and `Escape` key listeners.

## 2024-05-23 - Toggle Button Accessibility
**Learning:** Filter toggle buttons were visually indicating state with color changes but lacked semantic state for screen readers.
**Action:** Use `aria-pressed="true|false"` on button elements that function as toggles, especially when they are part of a filter set.

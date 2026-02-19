## 2024-05-23 - Notification Drawer Focus Management
**Learning:** Icon-only buttons in overlays (like "Clear Read" or "Close") are easy to miss with keyboard navigation if they don't have explicit focus states. Standard `outline-none` removes the browser default, so we must add `focus-visible:ring` to maintain accessibility.
**Action:** Always pair `outline-none` with `focus-visible:ring-2` and `focus-visible:ring-{color}` on interactive elements in custom UI components. Added `aria-label` to the new "Clear all read" button to ensure screen reader users understand the destructive action.

## 2025-02-09 - Focus Ring Contrast on Active Elements
**Learning:** Using `ring-{color}` on an element with the same `bg-{color}` (e.g., active tab) makes the focus indicator invisible.
**Action:** Always use `ring-offset-2` and `ring-offset-{background}` when the focus ring color matches the element's background color.

## 2025-02-18 - Accessibility of Custom List Items
**Learning:** List items implemented as `div`s with `click` handlers (like notifications or search results) are completely inaccessible to keyboard users unless explicitly managed. Adding `role="button"` is not enough; they need `tabindex="0"` and `@keydown.enter`/`space` handlers.
**Action:** Always wrap interactive list items in `<button>` tags if possible, or add full ARIA/keyboard support (role, tabindex, keydown) to the container `div`. Ensure nested interactive elements (like "delete" buttons) have `.stop` propagation modifiers.

## 2025-05-27 - Empty States as Navigation Drivers
**Learning:** Empty states (like "No Favorites") without actions create dead ends in the user flow. Users may not know where to go next.
**Action:** Always include a primary Call-to-Action (CTA) button in empty state components that directs users to the place where they can populate that content (e.g., "Browse Schedule").

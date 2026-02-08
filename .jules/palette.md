## 2024-05-23 - Notification Drawer Focus Management
**Learning:** Icon-only buttons in overlays (like "Clear Read" or "Close") are easy to miss with keyboard navigation if they don't have explicit focus states. Standard `outline-none` removes the browser default, so we must add `focus-visible:ring` to maintain accessibility.
**Action:** Always pair `outline-none` with `focus-visible:ring-2` and `focus-visible:ring-{color}` on interactive elements in custom UI components. Added `aria-label` to the new "Clear all read" button to ensure screen reader users understand the destructive action.

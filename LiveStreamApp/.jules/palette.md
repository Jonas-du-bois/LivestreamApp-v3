## 2025-02-19 - Ensure accessibility and tooltip context for non-interactive state placeholders

**Learning:** When displaying disabled or unavailable items (e.g., offline streams in a list of live streams), using `cursor-not-allowed` visually indicates the element is unclickable, but it fails to communicate the *reason* to the user or support assistive technologies. Without proper ARIA roles (like `role="group"`) and labels, screen readers simply read the inner text, losing the context that this item is a disabled stream.
**Action:** Always pair `cursor-not-allowed` with semantic ARIA roles, `aria-label` (to explain what it is and its unavailable state), and a native `title` attribute (to provide a hover tooltip for mouse users explaining why it is unavailable).

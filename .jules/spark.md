# Spark's Journal

## Staggered List Animations
- **Learning:** Applying `transition-delay` via inline styles on an element that also has `transition-all` (e.g., for hover effects) causes the hover effect to be delayed as well.
- **Solution:** Use a CSS variable (e.g., `--enter-delay`) for the delay value in the inline style, and then apply `transition-delay: var(--enter-delay)` strictly within the `.v-enter-active` (or `.list-enter-active`) CSS class. This ensures the delay only applies during the entrance animation.

## Lockfiles
- **Learning:** Be careful not to commit large lockfiles (`pnpm-lock.yaml`) if they were not present before, especially when the task requires small changes.

## Glassmorphism & Tactile Feedback (food.vue)
- **Learning:** Using `backdrop-blur-xl` combined with a semi-transparent dark background (`bg-gray-900/30`) creates a much more premium feel than solid colors, especially for overlay cards.
- **Interaction:** Adding `active:scale-[0.98]` to clickable cards provides immediate, satisfying feedback on touch devices without the need for complex ripple effects.
- **Performance:** Staggering list items with a simple CSS animation delay (based on index) is performant and adds significant polish compared to all items appearing at once.

## 2025-05-01 - Tactile Refresh Micro-interaction
**Learning:** When adding a custom rotating icon on a button (like a 'pull-to-refresh' sync icon) to replace a generic loading prop, using the Tailwind `group` class on the parent and `group-active:rotate-180` on the explicitly declared child `<Icon>` allows the animation to be perfectly synchronized with the user's touch, regardless of where they tap on the button.
**Action:** Use `group` and `group-active` modifiers for touch-synchronized child animations instead of relying on default component props that might override or mask custom behavior.

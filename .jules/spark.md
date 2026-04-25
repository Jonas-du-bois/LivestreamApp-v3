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

## 2026-04-25 - Custom tactile micro-interactions on generic components
**Learning:** When replacing a generic loading prop (like `:loading="pending"`) with a custom animated icon on generic components, it's necessary to ensure the animation is reactively bound to the component's loading state rather than only animating on touch events.
**Action:** Use the Tailwind `group` class and `group-active` utilities on a custom `<Icon>` inside the component's default slot, and reactively bind a class like `:class="{ 'animate-spin': pending }"` for the loading state, while maintaining `:disabled="pending"`.

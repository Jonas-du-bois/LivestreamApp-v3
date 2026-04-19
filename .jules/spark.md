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

## 2024-04-19 - Tactile Micro-Interactions on Generic Components
**Learning:** When using generic components like `<UiButton>` that have built-in `loading` or `icon` props, they often override or mask custom interactions by showing a generic spinner or simple icon.
**Action:** To implement synchronized tactile micro-interactions on buttons without JavaScript (like a scaling button with a spinning refresh icon), apply the Tailwind `group` class to the parent element, use `:disabled="pending"` instead of `:loading="pending"`, and use `group-active` utilities (e.g., `group-active:rotate-180`, `duration-300`) on an explicit child `<Icon>` element placed in the default slot. Combine this with `:class="{ 'animate-spin': pending }"` to seamlessly transition from touch interaction to actual background processing.

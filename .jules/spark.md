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

## 2024-04-26 - Tactile Feedback with Nuxt Icon
**Learning:** When adding a rotate or tactile micro-interaction using Tailwind's 'group' and 'group-active' to a component with a generic spinner, replace the built-in generic loading state prop (which may mask or replace the custom icon) with a custom explicit icon inside the slot. This guarantees the rotate animation can co-exist visually with the loading animation.
**Action:** When asked to create a pull-to-refresh animation, use group-active:rotate-180 combined with an explicitly injected <Icon> component. Ensure the button's built-in loading state is disabled and replaced by binding the disabled attribute and animating the icon itself on pending.

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

## 2024-05-18 - Animated Map Style Toggle
**Learning:** Using native HTML `<button>` elements with `active:scale-x` combined with a simple Vue `<Transition>` component (`mode="out-in"`) allows for creating very fluid, tactile interactive buttons that feel instant and responsive without needing complex custom Javascript logic or heavy CSS keyframes. This was implemented for the map style toggle button in `plan.vue`.
**Action:** When an interactive UI element needs to toggle states with completely different icons (e.g. Earth vs Map), wrap the icons in a custom transition inside a button component and apply scaling/shadow feedback classes to the parent.

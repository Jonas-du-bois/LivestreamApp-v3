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

## 2024-04-28 - Tactile Refresh Animations for UiButton
**Learning:** Using generic generic loading states (like `:loading="pending"`) on custom UI buttons (like `UiButton`) overrides or masks custom tactile animations, such as a spinning refresh icon, and can lead to minor layout shifts.
**Action:** Instead of relying on the built-in `loading` and `icon` props, insert custom animated icons (e.g., `<Icon>`) directly inside the default slot. Use Tailwind's `group`, `group-active`, and Vue transitions (e.g., `group-active:rotate-180 duration-300`) alongside reactive loading states (`:class="{ 'animate-spin': pending }"`) to create snappy, tactile feedback and handle background states reactively without altering layout sizes. Ensure the parent button explicitly uses `:disabled="pending"`.

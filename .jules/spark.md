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

## 2024-05-19 - Tactile Loading Buttons
**Learning:** When replacing a generic generic `loading` prop/spinner on a custom component (like `UiButton`) with a custom animated icon (like a spinning sync icon), `group-active` combined with `transition-transform` is an excellent way to provide immediate tactile feedback (< 300ms) upon press without layout shifts. However, to fully reflect the background process, the animation must *also* be reactively bound to the component's loading state (e.g., `:class="{ 'animate-spin': pending }"`). Also, it's critical to preserve the disabled state (`:disabled="pending"`) to prevent multiple submissions.
**Action:** Use `group`, `group-active`, and conditional `animate-spin` on custom slotted icons to create fluid "pull-to-refresh"-style buttons instead of relying on generic, blocking loading states.

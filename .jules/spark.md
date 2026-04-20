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
## 2024-05-24 - Pull-to-refresh tactile interaction in results page

**Learning:** When applying custom animated micro-interactions on UI components like `UiButton` that handle asynchronous actions, relying on their built-in `:loading` and `icon` properties can override or obscure the custom transition. Furthermore, the generic "loading" prop may act as a mechanism to disable the button during requests, which needs to be handled manually if the prop is stripped.

**Action:** When implementing custom interactive icons (e.g., using `group` and `group-active` on the parent and `transition` with `animate-spin` on the child `<Icon>`), explicitly insert the `<Icon>` into the component's default `<slot>`. Additionally, ensure to manually pass `:disabled="pending"` (or the respective loading state boolean) back to the parent `<UiButton>` to preserve proper button state protection (preventing spam clicks) while retaining full control over the visual animation.

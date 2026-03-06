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

## Tactile Button Interactions without Layout Shifts
- **Learning:** Applying `active:scale-95` to a button container while also applying `transition-transform active:scale-90` to the inner icon can cause small layout shifts.
- **Solution:** Use the `group` class on the button container and apply `group-active:scale-90` to the inner icon. This way, the icon shrinks relative to the button container's state, preventing layout shifts.
- **Bonus:** For refresh buttons, use `group-active:-rotate-180` for a satisfying physical rotation effect. Keep animations under 300ms.
- **Day Switcher Tabs:** Static navigation tabs (e.g. `UiDaySwitcher` buttons) must include `active:scale-95` unconditionally to remain touch-responsive, even for the currently active tab.

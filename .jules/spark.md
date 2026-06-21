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

## 2026-06-21 - Interaction de rafraîchissement tactile
**Learning:** L'utilisation de la prop `icon` par défaut sur les boutons limite les micro-interactions. En utilisant le slot par défaut et la classe `group` sur le bouton, on peut cibler l'icône enfant pour déclencher des rotations fluides (`group-active:rotate-180`) au toucher.
**Action:** Pour tout bouton nécessitant un effet "Pull-to-Refresh" ou un feedback de synchronisation, insérer l'icône manuellement et lui appliquer une transition de rotation (`duration-500`) activée par le parent via `group-active`.

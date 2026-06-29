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

## 2026-06-29 - Feedback tactile sur les boutons de rafraîchissement
**Learning:** L'ajout d'une rotation subtile (maximum 300ms) sur les icônes de synchronisation améliore grandement le ressenti de réactivité sans créer de distraction ou de lenteur perçue, particulièrement lors de l'utilisation de `group-active:rotate-180` couplé à la classe `group` sur le bouton parent.
**Action:** Toujours s'assurer que les icônes représentant une action de rafraîchissement ont un retour tactile immédiat (rotation ou scale) avec une durée `duration-200` ou `duration-300` au maximum.

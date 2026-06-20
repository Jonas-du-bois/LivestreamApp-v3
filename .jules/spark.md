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
## 2025-02-13 - Feedback tactile sur le rafraîchissement météo
**Learning:** Pour créer une micro-interaction de rotation fluide sur un bouton de rafraîchissement (< 300ms) sans JavaScript, il est efficace d'utiliser la classe `group` sur le composant bouton parent et d'appliquer `group-active:rotate-180` avec `duration-200` sur une icône explicite (`<Icon>`) insérée dans le slot, plutôt que d'utiliser la prop `icon` du bouton.
**Action:** Lors de l'amélioration de composants génériques (comme `<UiButton>`), toujours vérifier si l'utilisation d'un slot explicite permet un meilleur contrôle des états (comme le maintien du spinner de chargement natif avec `v-if` conditionnel) pour injecter des animations "Spark".

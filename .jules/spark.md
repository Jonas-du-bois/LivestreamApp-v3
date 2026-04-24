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
## 2024-04-24 - Effet tactile et rotation sur les boutons de rafraîchissement
**Learning:** L'utilisation de la prop générique `:loading` sur des composants comme `UiButton` affiche un spinner standard qui masque l'icône originale et ne permet pas d'avoir un retour tactile agréable (ex: rotation de l'icône au clic).
**Action:** Pour créer une micro-interaction de "Pull-to-Refresh" sur les boutons, il faut désactiver le composant via `:disabled="pending"`, appliquer une classe `.group`, et insérer manuellement un `<Icon>` dans le `<slot>` avec les classes Tailwind de transition : `transition-transform duration-500 group-active:rotate-180` et `:class="{ 'animate-spin': pending }"`. Cela préserve l'icône originale tout en ajoutant du jus lors du clic.

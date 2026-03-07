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

## 2024-03-07 - Double Feedback Tactile et Boutons d'Action (Refresh)

**Learning:** Retirer le `active:scale-95` global des boutons pour le limiter uniquement à l'icône crée une régression d'expérience : les boutons ne contenant que du texte perdent leur effet tactile. De plus, les actions spécifiques (comme rafraîchir) gagnent énormément à avoir un effet visuel dédié (rotation).

**Action:** Maintenir `active:scale-95` sur le conteneur `button` global pour garantir que *tous* les boutons (texte compris) donnent un feedback physique. Combiner cela avec la classe `group` sur le conteneur et appliquer `group-active:-rotate-180` (pour les icônes de synchronisation/rafraîchissement) ou `group-active:scale-90` (pour les autres icônes) via des classes calculées. Cela offre une double-profondeur premium ("jus") sans introduire de bugs d'expérience utilisateur.

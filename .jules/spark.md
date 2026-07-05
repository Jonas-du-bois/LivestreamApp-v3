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
## 2026-07-05 - Feedback tactile sur les boutons de rafraîchissement et les onglets

**Learning:** Les icônes statiques lors d'actions de rafraîchissement (comme sur les boutons de synchronisation) manquent de retour visuel, et les boutons de sélection (comme ceux des rondes de qualification/finale) manquent de feedback tactile au clic.

**Action:** Ajouter conditionnellement la classe Tailwind `group-active:rotate-180` sur les icônes de rafraîchissement (`sync` ou `refresh`) à l'intérieur des composants de boutons génériques (en utilisant la classe `group` sur le parent). Pour les boutons natifs, ajouter les classes `transition-all duration-200 active:scale-95` pour un feedback tactile immédiat.

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

## 2025-03-08 - Ajout du "double tactile feedback" global sur UiButton

**Learning:** Les boutons avec un texte et une icône manquent de "jus" (retour tactile visuel au clic) sur les icônes si seule la directive `active:scale-95` est sur le conteneur du bouton.

**Action:** Ajout de la classe `group` sur le bouton (`UiButton`), et des classes `transition-transform duration-300 group-active:scale-90` sur les `<Icon>` enfants (ou `group-active:-rotate-180` pour les icônes de type "refresh", et `group-active:translate-x-1` pour les icônes droites). Cela apporte un double retour tactile subtil sur l'ensemble de l'application sans créer de surcharges CSS.

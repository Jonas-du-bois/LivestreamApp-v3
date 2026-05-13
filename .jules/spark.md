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

## 2026-05-13 - Feedback tactile sur les boutons de rafraîchissement
**Learning:** Lors du remplacement de la prop générique `:loading` par une icône animée personnalisée pour le retour tactile (`group-active:rotate-180`), il faut s'assurer d'ajouter explicitement `:disabled="pending"` pour préserver la sécurité de l'interaction, et lier l'animation de rotation à l'état de chargement (`:class="{ 'animate-spin': pending }") pour refléter correctement le processus d'arrière-plan sans masquer l'animation tactile.
**Action:** Utiliser le slot par défaut de `UiButton` pour insérer l'icône, au lieu des props `icon` et `:loading`, afin d'avoir un contrôle total sur les interactions CSS (via la classe `group` sur le bouton parent).

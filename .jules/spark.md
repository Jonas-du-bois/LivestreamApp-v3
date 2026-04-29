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
## 2024-04-29 - Feedback tactile sur les boutons d'actualisation
**Learning:** Pour ajouter une interaction tactile satisfaisante sur un bouton de rafraîchissement avec une icône (comme dans `weather.vue` ou `results.vue`), éviter d'utiliser la prop `icon` ou `:loading` générique si elle remplace l'icône par un spinner qui casse l'animation personnalisée.
**Action:** Utiliser la classe `group` sur le bouton parent, y insérer manuellement le composant `<Icon>`, et lui appliquer `group-active:rotate-180`, `transition-transform`, et `duration-200`. L'état de chargement réactif peut être conservé via une classe conditionnelle `:class="{ 'animate-spin': isRefreshing }"`.

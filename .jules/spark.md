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

## 2024-04-09 - Feedback tactile sur les boutons de rafraîchissement
**Learning:** Lors du remplacement de l'icône statique d'un `<UiButton>` (définie via la prop `icon`) par un composant `<Icon>` explicite dans le but d'ajouter une animation de rotation (e.g. `group-active:rotate-180`), l'icône perd le style et l'espacement par défaut gérés en interne par `UiButton`. De plus, il faut faire attention à ne pas modifier les fichiers `.lock` de dépendances de manière non intentionnelle.
**Action:** Utiliser les classes utilitaires Tailwind telles que `transition-transform duration-300 group-active:rotate-180` sur l'icône, combinées avec la classe `group` sur le bouton parent. S'assurer de toujours nettoyer l'arborescence git (`git restore pnpm-lock.yaml`) pour éviter de polluer les pull requests avec de gros fichiers non pertinents.

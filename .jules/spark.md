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
## 2026-06-18 - Feedback Tactile sur Cartes statiques et Boutons génériques

**Learning:** J'ai remarqué que les composants purement statiques (comme les cartes "food" non cliquables) manquent de jus tactile, ce qui donne une impression de "mort" sous le doigt. De plus, les icônes à l'intérieur de composants génériques (comme `UiButton.vue`) ne s'animent pas naturellement quand l'utilisateur appuie sur la zone entière du bouton.

**Action:** Toujours ajouter `active:scale-[0.98]` couplé avec `active:bg-white/5` ou un retour visuel similaire pour toute carte "Glass", même non interactive. Pour les boutons contenant des icônes via slots ou props, appliquer la classe Tailwind `group` au conteneur principal et `group-active:scale-90` (ou équivalent) à l'icône enfant pour garantir que l'animation au toucher s'active depuis toute la surface interactive du conteneur parent.

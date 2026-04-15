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
## 2024-04-15 - Feedback tactile et micro-interactions sur les boutons
**Learning:** J'ai remarqué que bien que les boutons génériques (`<UiButton>`) bénéficient grandement d'un comportement tactile commun via `.group` sur le composant parent et des effets d'échelle sur ses icônes internes (`group-active:scale-90`), des actions plus spécifiques (comme "Rafraîchir" ou "Synchroniser") demandent un retour visuel distinct (comme une rotation ou "spin") qui reflète spécifiquement leur but sémantique pour augmenter le "jus" et la sensation de réactivité au toucher.
**Action:** Lors de la refactorisation des boutons d'actions spécifiques (rafraîchissement), au lieu de passer une icône statique via une prop `icon="…"`, déclare explicitement un enfant `<Icon>` à l'intérieur du slot du bouton avec des classes `group-active:` personnalisées (ex: `group-active:rotate-180 duration-300`) tout en s'assurant que l'état de chargement en arrière-plan continue d'utiliser l'animation `:class="{ 'animate-spin': isRefreshing }"` pour un feedback parfait.

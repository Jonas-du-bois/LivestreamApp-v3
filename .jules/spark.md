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
## 2026-05-20 - Effet Nouveau Score
**Learning:** L'utilisation d'un watcher Vue couplé à une animation CSS dédiée (keyframes sur l'échelle et la couleur de fond) permet de créer un retour visuel fort et immédiat lors de la réception de nouvelles données temps réel, sans impacter les performances.
**Action:** Toujours s'assurer que les boutons interactifs ont un retour tactile immédiat (active:scale-95) pour les utilisateurs sur mobile, et utiliser des animations CSS pour notifier des changements importants de données.

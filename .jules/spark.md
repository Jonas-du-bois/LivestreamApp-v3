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
## 2026-04-03 - Feedback tactile sur les cartes Food
**Learning:** L'utilisation de `duration-300` avec une échelle modérée (`scale-[0.98]`) sur des éléments interactifs comme des cartes manque parfois du "jus" tactile attendu d'une app Premium. Passer à une durée plus courte (`duration-200`) et une échelle plus marquée (`scale-95`) accompagnées d'un effet visuel (comme `backdrop-blur`) rend le retour tactile instantané et beaucoup plus satisfaisant, respectant la limite des < 300ms requise pour les interactions sur terminaux mobiles.
**Action:** Systématiquement privilégier `duration-200` et `active:scale-95` (au lieu de 300ms ou de diminutions de scale trop subtiles) pour les micro-interactions d'état "enfoncé" sur des cartes de type Glassmorphism dans cette PWA.

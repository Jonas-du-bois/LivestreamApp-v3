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
## 2024-05-15 - Feedback tactile sur les cartes Glass
**Learning:** L'ajout d'un retour visuel rapide et net (`active:scale-[0.98]`, `duration-200`, `active:border-white/30`, `active:bg-white/5`) sur les éléments interactifs comme les cartes de Glassmorphism améliore considérablement la sensation de réactivité et de qualité premium de l'application sur mobile. Une durée de transition de 300ms peut sembler légèrement trop molle pour des tapotements répétés ; 200ms offre un meilleur compromis entre fluidité et immédiateté.
**Action:** Utiliser systématiquement `duration-200` (ou moins) pour les micro-interactions tactiles (`active:` state) afin de garantir une sensation de rapidité, tout en conservant des transitions plus longues (`duration-300` ou `duration-500`) uniquement pour les éléments de survol (`hover:`) ou d'apparition.

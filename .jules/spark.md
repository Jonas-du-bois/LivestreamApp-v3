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
## 2026-06-11 - Feedback tactile sur HomeQuickActionButton

**Learning:** Les boutons d'action rapide sur l'accueil utilisaient une petite transformation CSS basique au clic (`transform: scale(0.985)`). Pour donner plus de "jus" sur mobile, l'utilisation de la classe `group` de Tailwind sur le parent permet de déclencher des micro-interactions sur les enfants (comme la rotation de l'icône) en synchronisation avec le scale du conteneur.

**Action:** Toujours coupler le `active:scale-95` du conteneur parent (avec la classe `group`) à une micro-animation enfant (ex: `group-active:rotate-180`) pour accentuer le retour tactile sans surcharger la mise en page.

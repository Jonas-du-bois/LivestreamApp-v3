# Atom ⚛️ - Architecture Log

## 03/11 - Standardisation des États Vides (Empty States)

**Problème :** Plusieurs pages (`results.vue`, `food.vue`) implémentaient des blocs HTML "Empty State" dupliqués avec de légères variations (icônes, textes, animations).

**Solution :**
- Amélioration de `<UiEmptyState>` pour supporter :
  - `title` optionnel (pour les cas où seul le texte de description suffit).
  - `pulse` prop (animation de l'icône).
  - Flexbox centering par défaut.
- Extraction de l'animation `animate-pulse-slow` de `afterparty.vue` vers `main.css` (Global).
- Refactoring de `results.vue` et `food.vue` pour utiliser `<UiEmptyState>`.

**Règle établie :**
Tout état "vide" (liste vide, aucun résultat, etc.) DOIT utiliser le composant `<UiEmptyState>`.
- Si c'est une carte en verre : `<UiEmptyState>` (défaut).
- Si c'est juste du texte/icône sans fond : `<UiEmptyState :glass="false">`.

## 03/11 - Création de `<UiButton>`

**Problème :** Plusieurs pages (`weather.vue`, `results.vue`, `plan.vue`) implémentaient des boutons avec des styles "Glassmorphism" dupliqués (classes Tailwind répétitives comme `bg-white/10`, `hover:bg-white/20`, etc.).

**Solution :**
- Création de `<UiButton>` (`app/components/ui/Button.vue`).
- Support des variantes : `glass` (défaut), `primary` (cyan), `secondary`, `ghost`, `outline`.
- Support des tailles : `sm`, `md` (défaut), `lg`, `icon`.
- Support de la forme : `rounded` (`xl` par défaut, `full` optionnel).
- Gestion intégrée du spinner de chargement (`loading` prop) et des icônes (`icon`, `iconRight`).
- Gestion automatique du tag HTML (`<button>` ou `<NuxtLink>` via prop `to`).

**Règle établie :**
Tous les boutons d'action génériques DOIVENT utiliser `<UiButton>`.
- Bouton principal : `<UiButton variant="primary">`.
- Bouton secondaire/glass : `<UiButton variant="glass">` ou `<UiButton variant="secondary">`.
- Lien ressemblant à un bouton : `<UiButton to="/page">`.

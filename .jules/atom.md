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

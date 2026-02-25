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

## 03/11 - Standardisation des Skeletons de Liste

**Problème :** Les pages `schedule.vue`, `favorites.vue` et `results.vue` dupliquaient manuellement le HTML des skeletons de chargement (blocs gris animés) à l'intérieur de `CascadeSkeletonList`, rendant le code verbeux et difficile à maintenir en cas de changement de style.

**Solution :**
- Création de `<UiSkeletonCard>` : Un composant atomique flexible qui gère les variations de layout.
  - Props : `layout` (time/avatar), `content` (text/pills), `action` (circle/box), `align` (start/center).
- Refactoring des 3 pages pour utiliser ce composant.

**Règle établie :**
Tout chargement de liste (CascadeSkeletonList) DOIT utiliser `<UiSkeletonCard>` ou un dérivé atomique au lieu de réécrire les `div` et classes `premium-skeleton-*` manuellement.
- Cela garantit une cohérence visuelle sur toute l'app.
- Cela centralise la structure HTML des "loading cards".

## 03/11 - Uniformisation des Cartes de Résultat

**Problème :** La page `results.vue` utilisait des blocs `UiGlassCard` avec une structure HTML ad-hoc qui différait visuellement des `SchedulePassageCard` (alignement, padding, taille des colonnes), créant une incohérence dans l'UI.

**Solution :**
- Création de `<ResultCard>` (`app/components/results/ResultCard.vue`) :
  - Encapsule la logique d'affichage des médailles, rangs, scores et bordures de podium.
  - Utilise la même structure Flexbox et les mêmes paddings que `SchedulePassageCard` pour l'uniformité.
  - Intègre l'animation "Flash" lors de la mise à jour des scores.
- Refactoring de `results.vue` pour utiliser ce composant.

**Règle établie :**
Les listes de résultats doivent utiliser `<ResultCard>` pour garantir l'uniformité avec le reste de l'application (notamment le Programme).

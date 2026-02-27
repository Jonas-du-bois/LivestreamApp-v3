# Atom's Architectural Journal ⚛️

## 2026-05-24
*   **Creation of `<UiIconBox>`**: Identified repetitive patterns for icon containers across `food.vue`, `afterparty.vue`, `plan.vue`, and `UiInfoTile.vue`. These containers shared properties like glassmorphism, solid backgrounds, gradients, borders, and shadows.
    *   **Rule Established**: "Icon containers with specific shapes (circle/square), variants (glass/solid/gradient), and effects (glow/pulse) must be implemented using `<UiIconBox>`."
    *   **Refactoring**: Extracted logic into `app/components/ui/IconBox.vue`.
    *   **Usage**: Used in `UiInfoTile` for consistency, and directly in pages where standalone icons or icon buttons are needed. Supports polymorphic rendering via `as` prop (e.g., `as="button"`).

## 2026-05-25
*   **Standardization of UI Components**: Identified opportunities to enforce consistency in filtering, status indicators, and glassmorphism containers.
    *   **UiFilterChips**: Enhanced to support a `color` prop (default `'cyan'`, added `'blue'`).
    *   **UiStatusBadge**: Enhanced with a `solid-red` variant for high-visibility "Live" indicators.
    *   **Refactoring**: Updated `food.vue`, `index.vue`, `infos.vue`, and `afterparty.vue` to utilize `UiFilterChips`, `UiStatusBadge`, `UiGlassCard`, and `UiSectionTitle`.
    *   **Rule Established**: "All category filters/tabs must use `UiFilterChips`. All 'Live' indicators must use `UiStatusBadge`. Content containers must use `UiGlassCard` for consistent padding and glassmorphism."

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
- Création de `<ResultsResultCard>` (`app/components/results/ResultCard.vue`) :
  - Encapsule la logique d'affichage des médailles, rangs, scores et bordures de podium.
  - Utilise la même structure Flexbox et les mêmes paddings que `SchedulePassageCard` pour l'uniformité.
  - Intègre l'animation "Flash" lors de la mise à jour des scores.
- Refactoring de `results.vue` pour utiliser ce composant.

**Règle établie :**
Les listes de résultats doivent utiliser `<ResultsResultCard>` pour garantir l'uniformité avec le reste de l'application (notamment le Programme).

## 03/11 - Centralisation de la Réactivité Temporelle

**Problème :** Plusieurs composants recalculaient le statut "Live" des passages (SCHEDULED -> LIVE -> FINISHED) à l'aide de timers locaux, créant une désynchronisation et une duplication de logique (ex: `schedule.vue` vs `GroupDetailsModal.vue`). De plus, le modal ne mettait pas à jour les statuts passés.

**Solution :**
- Création du composable `useNow()` : Fournit un timestamp réactif partagé, mis à jour toutes les 2 secondes.
- Création du composant `<GroupTimelineItem />` : Extrait la structure visuelle des passages dans la timeline du groupe.
- Refactorisation de `GroupDetailsModal.vue` pour calculer les statuts côté client via `useNow()`, garantissant une mise à jour instantanée sans attendre le serveur.

**Règle établie :**
Tout calcul basé sur l'heure actuelle (pour les changements de statut en temps réel) DOIT passer par le composable `useNow()`.
Les items de timeline complexes doivent être extraits en composants atomiques dans `app/components/domain/`.

## 03/11 - Abstraction du Sélecteur de Jour

**Problème :** La logique de sélection de jour était codée en dur dans `schedule.vue` et devait être répliquée dans `results.vue` pour séparer les podiums par jour (Actifs vs Jeunesse).

**Solution :**
- Création de `<UiDaySwitcher>` (`app/components/ui/DaySwitcher.vue`) : Un composant atomique gérant l'affichage horizontal scrollable des jours et la sélection.
- Mise à jour de l'API `/results` pour supporter le filtrage par jour.
- Refactoring de `schedule.vue` et `results.vue` pour utiliser ce composant commun.

**Règle établie :**
Toute navigation temporelle par jour au sein des listes DOIT utiliser `<UiDaySwitcher>`.
L'état du jour sélectionné doit être géré via `useState` pour persister lors de la navigation entre les onglets si nécessaire.

## 03/11 - Gestion Globale de la Connectivité

**Problème :** L'application pouvait "planter" de manière inattendue ou afficher des états illogiques lors de la perte de réseau. L'utilisateur n'était pas notifié que les flux vidéos ou les résultats en direct étaient compromis.

**Solution :**
- Création du composable réutilisable `useNetworkStatus.ts` pour centraliser l'écoute des événements `online`, `offline` et de la qualité de connexion (`navigator.connection`).
- Création du composant atomique `<UiNetworkToast>` (`app/components/ui/NetworkToast.vue`) pour afficher une bannière non-intrusive.
- Ajout de `<UiNetworkToast />` à la racine de l'application (`app.vue`) pour une couverture globale continue.

**Règle établie :**
Les événements liés au système ou à l'environnement global du navigateur (comme le réseau, la visibilité de la fenêtre) DOIVENT être extraits dans des composables (`useNetworkStatus`, `useNow`, etc.) pour éviter la duplication des listeners (EventListener) dans chaque composant de page.
Les alertes globales de ce type doivent se placer à la racine (`app.vue`) avec `Teleport` si nécessaire.

## 03/11 - Standardisation des Composants UI de Base

**Problème :** Forte duplication de classes Tailwind et de structures HTML pour les cartes "Glass", les titres de section, les badges de statut et les puces de filtres à travers `index.vue`, `food.vue`, `infos.vue` et `afterparty.vue`.

**Solution :**
- Création de composants atomiques génériques :
  - `<UiGlassCard>` : Conteneur standard pour l'effet de verre, supportant des variantes de bordure et d'interaction.
  - `<UiSectionTitle>` : Titre de section uniformisé avec effets de lueur (glow) et sous-titre optionnel.
  - `<UiStatusBadge>` : Badge normalisé pour les statuts (Live, Finished, etc.) avec support d'icônes.
  - `<UiFilterChips>` : Liste de sélection horizontale (pills) avec gestion de l'état actif et animations.
- Refactoring des 4 pages principales pour utiliser ces composants.

**Règle établie :**
- Tout conteneur nécessitant l'effet "Glassmorphism" doit utiliser `<UiGlassCard>`.
- Les titres de sections doivent utiliser `<UiSectionTitle>` pour garantir la cohérence des marges et des styles de texte.
- Les indicateurs d'état doivent utiliser `<UiStatusBadge>`.
- Les listes de filtres ou de sélection doivent utiliser `<UiFilterChips>`.

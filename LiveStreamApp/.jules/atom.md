# Journal d'Atom ⚛️

## 13/06/2026 - Extraction du composant `DomainResultRow`

**Contexte :**
La page `results.vue` utilisait deux boucles `v-for` distinctes pour afficher les résultats (Podium vs Full Ranking), mais avec une logique visuelle très similaire (classement, nom du groupe, catégorie, note). La logique de "border color" et "medal icon" était mélangée dans le script de la page.

**Décision :**
Création de `<DomainResultRow>` dans `app/components/domain/ResultRow.vue`.
Ce composant encapsule toute la logique visuelle liée au rang (1er, 2e, 3e vs autres).

**Props :**
- `rank` (number) : Détermine si c'est un podium (médaille + bordure) ou non.
- `groupName` (string) : Nom du groupe.
- `category` (string) : Catégorie du groupe.
- `score` (number) : Note finale.
- `id` (string, optionnel) : Pour l'animation flash.

**Règles établies :**
- Les composants liés à la logique métier (Score, Groupe, Passage) doivent aller dans `app/components/domain/`.
- Les composants purement UI (Boutons, Cards génériques) vont dans `app/components/ui/`.
- `UiGlassCard` doit être utilisé comme conteneur de base pour les éléments de liste interactifs.

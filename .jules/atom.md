# Journal d'Atom ⚛️ - Architecture UI

## 2024-05-24 - Création de `UiMediaCard`

**Problème identifié :**
Duplication du pattern "Carte avec Image" (Hero Card, Food Spot Card) dans `index.vue` et `food.vue`. Les implémentations variaient légèrement (background image vs image tag, overlay gradient).

**Solution :**
Extraction d'un composant flexible `<UiMediaCard>`.

**Caractéristiques :**
- **Variantes :**
  - `split` (défaut) : Image en haut, contenu en bas (ex: Food spots).
  - `cover` : Image en background complet, contenu en overlay (ex: Hero Live).
- **Slots :**
  - `image-top` : Pour les badges ou actions en haut de l'image.
  - `image-bottom` : Pour les titres ou infos sur l'image (overlay bas).
  - `default` : Pour le contenu principal (sous l'image en mode split).
- **Intégration :** Utilise `<UiGlassCard>` en interne pour maintenir la cohérence visuelle (Glassmorphism).

**Règles d'utilisation :**
1. Utiliser `<UiMediaCard>` pour tout élément de liste ou de mise en avant contenant une image principale.
2. Préférer le mode `cover` pour les éléments "Hero" ou immersifs.
3. Préférer le mode `split` pour les listes d'objets (produits, lieux).

**Convention de nommage :**
Tous les composants UI génériques doivent être préfixés par `Ui` et placés dans `app/components/ui/`.

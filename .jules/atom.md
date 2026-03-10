## 2024-05-24 - Extraction des listes de clés/valeurs (UiKeyValueList)

**Décision Architecturale :**
Création du composant `<UiKeyValueList>` pour uniformiser l'affichage de données de type "clé - valeur" (ex: tarifs, menus, horaires) récurrentes dans l'application.

**Règle établie :**
Toutes les listes de paires clé-valeur présentant des séparateurs ou espacements récurrents doivent utiliser le composant générique `<UiKeyValueList>`. Cela garantit l'homogénéité du design "Liquid Glassmorphism" et prévient la duplication de code (boilerplate HTML/Tailwind). Ce composant gère la mise en forme via des variantes (`divider`, `dashed`, `boxed`) et des couleurs, tout en restant flexible grâce aux `<slot>` pour injecter les données textuelles.

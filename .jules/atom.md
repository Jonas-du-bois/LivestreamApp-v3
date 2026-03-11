## 2024-05-24 - Création de `<UiKeyValueList>`

**Décision d'architecture :**
Création du composant générique `UiKeyValueList` pour unifier l'affichage des listes de clés/valeurs (comme les infos de contact, les prix, les détails pratiques).

**Règle établie :**
Toutes les listes affichant des paires clé/valeur avec un style récurrent (espacement, séparateur, alignement) doivent utiliser le composant générique `<UiKeyValueList>` pour garantir l'homogénéité visuelle et éviter la duplication du markup HTML et des classes Tailwind associées.

## 2024-05-18 - Extraction de `UiKeyValueList`

Création du composant `<UiKeyValueList>` dans `app/components/ui/KeyValueList.vue`.
Règle établie : Toutes les listes de type "clé-valeur" (ex: infos de contact, horaires, tarifs) avec des séparateurs et espacements récurrents doivent utiliser le composant générique `<UiKeyValueList>` pour garantir l'homogénéité du style et éviter la duplication du boilerplate (markup HTML + classes Tailwind).

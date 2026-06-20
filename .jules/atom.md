## 2024-03-19 - Création de `<UiGlassEmptyState>`
**Décision :** Extraction des états vides simples (messages avec icône, titre et texte) récurrents dans les panneaux (glass-panel / glass-card) sous forme d'un composant réutilisable pour garantir l'homogénéité visuelle.
**Action :** Règle établie : Tous les composants d'interface génériques doivent être préfixés par 'Ui' et placés dans 'app/components/ui/'. Remplacement du code dupliqué dans `stream/index.vue`, `stream/[id].vue` et `weather.vue`.

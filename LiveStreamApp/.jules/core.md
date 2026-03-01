# Core: Refactoring Log

## 1. Extraction de la logique de formatage de dates (utils/date.ts)
- **🧹 Nettoyage** : Remplacement de 5 blocs de logique dupliquée dans les pages et composants (PhotosGridItem, PhotosLightbox, SearchOverlay, GroupDetailsModal, photos.vue) par un utilitaire centralisé.
- **🧩 Architecture** : Utilisation du dossier `app/utils/` (pur, sans réactivité). Fonctions `formatTime` et `formatDateTime` exportées, supportant les timestamps, les objets Date et les ISO strings, tout en résolvant automatiquement les locales (`fr`, `de`, `it` vers `fr-CH`, `de-CH`, `it-CH`).
- **🎛️ Typage** : Les arguments acceptent `string | number | Date` pour une compatibilité maximale avec les différents formats de retour API et composants. Le retour est strictement de type `string`.

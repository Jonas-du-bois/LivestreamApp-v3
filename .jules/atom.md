## 2024-05-18 - Création de `UiGlassBadge`

**Règle établie :** Tous les petits badges d'information présentant un effet "glassmorphism" (bordure, fond semi-transparent, icône optionnelle) doivent utiliser le composant générique `<UiGlassBadge>` situé dans `app/components/ui/GlassBadge.vue`.
Cela permet de maintenir la cohérence visuelle et d'éviter la duplication des classes Tailwind complexes (`inline-flex items-center gap-2 rounded-full border transition-all ...`) à travers l'application.

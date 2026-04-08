# Atom's Journal ⚛️

## 2024-05-24 - Création de `<UiStatCard>`
**Règle établie :** Les cartes statistiques verticales ("Stat Cards") contenant une icône, une valeur et un libellé, très présentes dans les détails des groupes (Modal, Page), doivent être extraites en tant que composants d'interface génériques. Elles sont préfixées par 'Ui' et placées dans `app/components/ui/StatCard.vue`.

**Règle établie :** "Si c'est utilisé une fois, laisse-le. Si c'est utilisé deux fois ou plus, fais-en un composant." Les composants très génériques doivent résider dans `app/components/ui/` et non dans `app/components/domain/`. Les composants UI doivent offrir des props personnalisables (comme `iconColor`, `bgClass`, et des `slots`) pour être réutilisables dans des contextes légèrement différents (ex: cartes interactives avec hover vs statique avec fond différent).

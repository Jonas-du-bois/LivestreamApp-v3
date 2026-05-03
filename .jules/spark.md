## 2024-05-03 - Feedback tactile sur les toggle buttons

**Learning:** Les boutons de type "toggle" ou sélecteur (comme le Round Selector dans la page de résultats) n'avaient qu'un effet de survol (`hover:text-white/60`) qui ne se ressentait pas sur mobile. Pour que l'application garde un côté premium et "Touch-friendly", chaque élément de navigation cliquable doit avoir un retour visuel instantané et léger.

**Action:** Toujours ajouter `duration-200 active:scale-95` pour l'effet de pression, ainsi qu'un léger changement de background avec `active:bg-white/5` (ou équivalent) sur les boutons de navigation, même s'ils ne sont pas de type `UiButton`.

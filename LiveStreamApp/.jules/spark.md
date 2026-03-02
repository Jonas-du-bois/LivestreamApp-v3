# Journal de Spark ✨

## Micro-Interaction : Feedback tactile sur le Back Button (`UiBackButton`)

**Problème observé :**
Le bouton de retour (`UiBackButton`) est utilisé dans toutes les sous-pages de l'application (Plan, Food, Infos, Weather, Photos, Afterparty). Son interaction était basique (`duration-200`, `active:scale-95`, léger `group-hover:-translate-x-0.5`). L'expérience manquait de profondeur et de "jus", surtout pour une application PWA sur mobile où le retour tactile est crucial.

**La Solution "Spark" :**
1. **Timing & Easing :** Augmentation de la durée de transition globale de `duration-200` à `duration-300` pour un effet plus doux.
2. **Glassmorphism Renforcé :** Ajout de `backdrop-blur-md` explicite, `hover:border-white/20`, et d'un changement d'opacité plus marqué au clic (`active:bg-white/30`).
3. **Lueur Subtile (Glow) :** Ajout d'une lueur cyan qui réagit à l'interaction (`hover:shadow-cyan-500/20`, `active:shadow-cyan-500/40`), renforçant l'aspect premium et "Dark Mode" de la Coupe des Bains.
4. **Motion Design de l'Icône :** L'icône (Chevron) effectue un mouvement de "tirage" satisfaisant au clic. Sur le hover, elle recule légèrement (`group-hover:-translate-x-1`), et au moment du press/touch (`active:`), elle recule encore plus et se réduit (`group-active:-translate-x-2 group-active:scale-90`). Cela imite l'action physique de presser un bouton en tirant vers l'arrière.

**Apprentissages (LiveStreamApp) :**
- L'utilisation de pseudo-classes `group-active` sur les éléments internes (comme les icônes) est un moyen extrêmement puissant et léger d'ajouter du "jus" aux composants réutilisables, sans Javascript additionnel.
- Ces micro-interactions modifient les `transform`, `opacity` et `box-shadow`, évitant ainsi tout "Layout Shift" ou ralentissement (60fps fluide garanti sur mobile).
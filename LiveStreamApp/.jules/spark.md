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

## Micro-Interaction : Transition en fondu de la Map (`plan.vue`)

**Problème observé :**
Le bouton de basculement ("Toggle") entre la vue "Sombre" et la vue "Satellite" de la carte Leaflet dans `plan.vue` fonctionnait par suppression immédiate (`map.removeLayer`) puis ajout de la nouvelle couche. Cela provoquait un effet de clignotement brutal ("flash") très peu premium lors du changement de style, en rupture avec le reste du design "Liquid Glassmorphism" et fluide de l'application.

**La Solution "Spark" :**
1. **Ajout de transition CSS :** Application d'une transition CSS sur `opacity` de `.leaflet-layer` (`transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);`).
2. **Animation par étapes (Cross-fade) :** La nouvelle couche `newLayer` est initialement injectée avec `opacity: 0`.
3. **Trigger de Reflow :** Un court délai `setTimeout` permet d'appliquer ensuite `newLayer.setOpacity(1)` pour déclencher la transition CSS d'apparition. L'ancienne couche reste visible en arrière-plan pendant la durée de l'animation.
4. **Nettoyage asynchrone :** Un deuxième `setTimeout` supprime l'ancienne couche du DOM (avec `leafletMap.removeLayer`) uniquement *après* que la transition d'apparition de la nouvelle soit terminée (environ `300ms`). Les timers sont proprement détruits dans le hook `onUnmounted`.

**Apprentissages (LiveStreamApp) :**
- L'API de base de LeafletJS ne gère pas les fondus enchaînés par défaut entre deux "TileLayers", mais combiner `setOpacity()`, un délai pour laisser le navigateur peindre, et une simple transition CSS sur la classe générique `.leaflet-layer` permet d'obtenir un effet luxueux (cross-fade) sans dépendance supplémentaire.
- L'utilisation d'une courbe `cubic-bezier(0.25, 0.8, 0.25, 1)` pour l'opacité accompagne parfaitement les autres animations "Premium" de l'application (type `premium-swap`).
- Il est crucial de limiter la durée des transitions à 300ms maximum pour respecter les contraintes de performance/réactivité et de bien nettoyer les timeouts stockés (`ReturnType<typeof setTimeout>`) via `onUnmounted` pour éviter des fuites mémoires si l'utilisateur change de page pendant la transition.
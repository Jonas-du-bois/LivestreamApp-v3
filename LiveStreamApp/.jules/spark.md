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

## Micro-Interaction : Feedback tactile sur les filtres et sélecteurs de jours (`UiDaySwitcher` et `UiFilterChips`)

**Problème observé :**
Les composants de filtrage horizontaux (`UiDaySwitcher` et `UiFilterChips`), massivement utilisés dans l'application pour naviguer entre les jours et les agrès (Schedule, Results, Food), possédaient une interaction basique. Bien qu'un léger "active:scale-95" ait été présent dans certains cas, le ressenti global manquait du côté "premium" et satisfaisant, surtout pour des éléments touchés très fréquemment sur mobile.

**La Solution "Spark" :**
1. **Timing & Easing Premium :** Application d'une `duration-300` couplée avec `ease-[cubic-bezier(0.25,0.8,0.25,1)]` pour un retour visuel à la fois réactif au clic mais très fluide au relâchement.
2. **Effet "Glow" Réactif :** Ajout d'une ombre portée (`box-shadow`) douce et colorée (cyan ou bleu) qui s'intensifie lors de l'interaction (`hover:shadow-cyan-500/20` puis `active:shadow-cyan-500/40` ou équivalent via le CSS inline Tailwind). Cela simule une émission de lumière sous l'élément pressé, très cohérent avec le "Dark Mode" de la Coupe des Bains.
3. **Contraste de Fond (Glass) :** Lors du `active:` (toucher), l'arrière-plan devient très légèrement plus opaque (`active:bg-white/15`) pour donner une sensation physique d'enfoncement dans le "verre" (Glassmorphism), en complément du `scale`.

**Apprentissages (LiveStreamApp) :**
- L'utilisation combinée de `active:scale`, d'un léger changement de background (`bg-white/10` -> `bg-white/15`) et d'une augmentation de l'ombre colorée crée une illusion de profondeur (Z-axis) extrêmement efficace pour les boutons "Glass".
- Appliquer ces styles directement sur les items inactifs (`text-white/60`) rend l'exploration de l'interface par l'utilisateur plus ludique, incitant à cliquer.

## Micro-Interaction : Feedback tactile sur les listes de liens (`infos.vue`)

**Problème observé :**
La liste statique "Liens utiles" dans la page `/infos` utilisait de simples ancres (`<a>`) enveloppées dans une `.glass-card`. Bien que le fond réagisse au survol (`hover:bg-white/10`), l'interaction manquait cruellement de répondant tactile pour une application mobile.

**La Solution "Spark" :**
1. **Feedback Tactile Base :** Ajout de `active:scale-[0.98]` et `active:bg-white/15` sur le conteneur du lien pour un effet de pression physique direct au toucher.
2. **Chorégraphie de Groupe (`group`) :** Utilisation de la classe `group` sur le conteneur parent pour animer simultanément les éléments internes.
3. **Motion Design Typographique :** Le texte change de couleur au survol (`group-hover:text-cyan-300`) et s'assombrit légèrement au clic (`group-active:text-cyan-200`), donnant une impression d'éclairage réactif.
4. **Micro-mouvement Icône :** L'icône de lien externe ("open") bouge légèrement vers le haut et la droite (`group-hover:-translate-y-0.5 group-hover:translate-x-0.5`) pour indiquer son action. Au clic, elle se compresse (`group-active:scale-90`), ajoutant un côté très élastique et satisfaisant.

**Apprentissages (LiveStreamApp) :**
- Les listes statiques, même simples (comme des liens sortants), bénéficient énormément de la classe `group` couplée aux états `active:`. Cela transforme un lien web classique en un véritable bouton d'application native, sans ajouter la moindre complexité Javascript.
- Utiliser de minuscules translations (ex: `0.5` = `2px` via Tailwind) suffit à donner une direction à une interaction. Un lien sortant doit pointer "vers l'extérieur".
## 2024-05-15 - Feedback tactile sur les cartes Glass
**Learning:** L'ajout d'un retour visuel rapide et net (`active:scale-[0.98]`, `duration-200`, `active:border-white/30`, `active:bg-white/5`) sur les éléments interactifs comme les cartes de Glassmorphism améliore considérablement la sensation de réactivité et de qualité premium de l'application sur mobile. Une durée de transition de 300ms peut sembler légèrement trop molle pour des tapotements répétés ; 200ms offre un meilleur compromis entre fluidité et immédiateté.
**Action:** Utiliser systématiquement `duration-200` (ou moins) pour les micro-interactions tactiles (`active:` state) afin de garantir une sensation de rapidité, tout en conservant des transitions plus longues (`duration-300` ou `duration-500`) uniquement pour les éléments de survol (`hover:`) ou d'apparition.

# 🛡️ Warden Log

Journal de bord de l'agent Warden.
Suivi des refactorisations, sécurisations et améliorations de qualité de code.

## Sécurisation de LiveStreamApp/app/pages/index.vue

**Cible :** `app/pages/index.vue`

**Problèmes identifiés :**
*   Utilisation extensive de `any` dans les computed properties (`happeningNow`, `firstLivePassage`, `firstLiveStream`).
*   Typage faible du timer `autoRefreshTimer` (`any`).
*   Risque de fuite de mémoire (cleanup incomplet de `setInterval`).
*   Code mort/bugué dans `heroSubtitle` (calculait des valeurs mais retournait une string statique vide).

**Actions correctives :**
*   🛡️ **Typage Strict :** Remplacement de `any` par `PassageEnriched`, `Stream`, `Passage` importés depuis `~/types/api`.
*   🛡️ **Cycle de vie :** Typage correct de `autoRefreshTimer` (`ReturnType<typeof setInterval> | null`) et nettoyage robuste dans `onUnmounted`.
*   🐛 **Bugfix :** Correction de `heroSubtitle` pour afficher correctement la localisation et l'agrès.
*   🔒 **Sécurité :** Vérification stricte des propriétés imbriquées (`s.currentPassage` peut être string ou objet) et ajout de l'optional chaining (`?.`) pour la résilience runtime face aux données partielles.

**Règle appliquée :**
> "Toujours typer strictement les timers et nettoyer les intervalles dans onUnmounted pour éviter les fuites de mémoire."

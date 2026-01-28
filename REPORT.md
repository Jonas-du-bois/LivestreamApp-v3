# Rapport d'Audit API & Recommandations - LiveStreamApp

## 1. Vue d'ensemble
L'architecture actuelle repose sur une stack solide et moderne :
- **Framework** : Nuxt 3 avec moteur serveur Nitro.
- **Base de données** : MongoDB via Mongoose.
- **Temps Réel** : Socket.io intégré via plugin Nitro.
- **Documentation** : OpenAPI (`openapi.yaml`) présent.

Cependant, plusieurs points critiques nécessitent une attention immédiate, notamment en ce qui concerne la sécurité et la performance.

## 2. Analyse de la Sécurité (🔴 CRITIQUE)

### Problème
Les routes d'administration (ex: `server/api/admin/score.put.ts`, `status.put.ts`) ne sont **pas protégées**.
Actuellement, n'importe qui peut envoyer une requête `PUT` vers `/api/admin/score` s'il devine ou obtient un `passageId`. Il n'y a aucune vérification de session, de token ou de mot de passe.

### Recommandation
- Implémenter un **Middleware d'Authentification** pour toutes les routes commençant par `/api/admin`.
- Utiliser `nuxt-auth-utils` ou une simple vérification de mot de passe (Basic Auth ou Token Bearer) stocké dans `runtimeConfig`.

## 3. Performance & Scalabilité (🟠 IMPORTANT)

### Problème : `server/api/schedule.get.ts`
L'API de l'horaire charge **l'intégralité de la collection `Passage`** en mémoire, effectue des `populate` (jointures) sur tout, puis filtre les résultats via JavaScript (côté serveur Node.js).
```typescript
// Actuel (Problématique)
const allPassages = await PassageModel.find()... // Charge tout
let filtered = allPassages.filter(...) // Filtre en RAM
```
Avec l'augmentation du nombre de passages, cette requête deviendra de plus en plus lente et consommera toute la mémoire du serveur.

### Recommandation
- Déplacer la logique de filtrage **dans la requête MongoDB**.
- Utiliser les index MongoDB pour `startTime`, `group`, `apparatus`.
```typescript
// Recommandé
const filter: any = {};
if (apparatus) filter.apparatus = apparatusId;
const passages = await PassageModel.find(filter)...
```

## 4. Qualité du Code & Maintenance

### Typage TypeScript
L'utilisation de `any` est trop fréquente, ce qui annule les bénéfices de TypeScript.
- *Exemple* : `(passage.group as any)?.name` dans `score.put.ts`.
- *Solution* : Utiliser les interfaces générées ou définies dans `server/models` (ex: `IPassage`, `IGroup`).

### Validation des Données
La validation est faite manuellement (`if (!body.passageId)...`).
- *Solution* : Utiliser une librairie comme **Zod** (`h3-zod`) pour valider strictement les entrées API et renvoyer des erreurs 400 claires automatiquement.

### Architecture
La logique métier (calcul des rangs, formatage) est mélangée avec la logique de contrôleur (gestion des requêtes HTTP) dans les fichiers `defineEventHandler`.
- *Solution* : Extraire la logique métier dans des **Services** (ex: `server/services/ScoreService.ts`).

## 5. Gestion des Dates et Locales
L'API `schedule.get.ts` formate les dates en français (`toLocaleDateString('fr-FR')`).
- C'est une mauvaise pratique de lier l'API à une locale spécifique. L'API devrait renvoyer des dates au format ISO (UTC), et le Frontend devrait se charger de l'affichage (Samedi, Dimanche, etc.).

## 6. Plan d'Action Suggéré

1.  **SÉCURITÉ** : Mettre en place un middleware pour protéger `/api/admin/*`.
2.  **OPTIMISATION** : Réécrire `schedule.get.ts` pour utiliser les requêtes MongoDB natives.
3.  **ROBUSTESSE** : Ajouter Zod pour la validation des entrées admin.
4.  **NETTOYAGE** : Typer correctement les modèles Mongoose et retirer les `any`.

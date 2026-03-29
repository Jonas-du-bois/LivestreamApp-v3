# Core Daily Log

## Party Countdown Logic Refactoring
- **Action**: Extracted duplicate logic for calculating the party countdown (`new Date('2026-05-09T22:00:00')`) into a new composable `app/composables/usePartyCountdown.ts`.
- **Files Affected**: `app/pages/afterparty.vue`, `app/components/home/HomeHeroCarousel.vue`.
- **Reasoning**: To adhere to DRY principles and centralize configuration (Party Date) and countdown calculations so any changes in the future apply across all instances.

## Time Formatting Refactoring
- **Action**: Replaced manual date time formatting utilizing `.toLocaleTimeString()` and custom locale conditionals with the centralized `formatLocalizedTime` function from `useTranslatedData` composable.
- **Files Affected**: `app/pages/photos.vue`, `app/components/photos/PhotosGridItem.vue`, `app/components/overlays/SearchOverlay.vue`, and `app/components/overlays/GroupDetailsModal.vue`.
- **Reasoning**: Ensure that date time formatting respects the single source of truth for locale resolution and time zone configuration defined in `useTranslatedData`.

## Stream Thumbnail URL Extraction
- **Action**: Extracted duplicate regular expression logic for generating thumbnail URLs for streams (YouTube, Twitch) into a new pure utility function `getStreamThumbnailUrl`.
- **Files Affected**: `app/pages/stream/index.vue`, `app/components/home/HomeHeroCarousel.vue`, `app/utils/stream.ts`.
- **Reasoning**: Adhere to DRY principles by separating pure string parsing and formatting logic out of Vue components and into a testable utility file (`app/utils/stream.ts`).

## 2026-03-29 - Extraction de la logique aggregateHistoryByYear
**Learning:** L'agrégation de l'historique d'un groupe par année (calcul de la note moyenne par an à partir des `HistoryEntry`) était dupliquée dans `GroupDetailsModal.vue` et `GroupInfoCard.vue`. Cette logique pure (ne dépendant pas de Vue ni de la réactivité) encombrait le setup des composants.
**Action:** Création de la fonction `aggregateHistoryByYear` et de l'interface `HistoryPoint` dans `app/utils/history.ts`. La logique a été extraite car elle n'utilise pas la réactivité de Vue. Nuxt 4 auto-importe cette fonction, ce qui permet de nettoyer les composants tout en gardant une logique réutilisable et typée.

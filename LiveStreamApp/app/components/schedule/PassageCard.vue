<script setup lang="ts">

/**
 * ⚛️ SchedulePassageCard
 * Carte atomique pour afficher un passage dans le programme.
 * Taille fixe, hiérarchie visuelle claire, espacement cohérent.
 */

import type { PassageEnriched } from '~/types/api'

interface Props {
  passage: PassageEnriched
  isFavorite?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFavorite: false
})

const emit = defineEmits<{
  'click:group': [groupId: string, apparatusCode?: string]
  'toggle:favorite': [passageId: string, event: Event]
}>()

const { t } = useI18n()
const { translateApparatus, formatLocalizedTime } = useTranslatedData()

const groupName = computed(() => props.passage.group?.name ?? '')
const groupId = computed(() => props.passage.group?._id ?? '')
const apparatusCode = computed(() => props.passage.apparatus?.code ?? '')
const apparatusName = computed(() => props.passage.apparatus?.name ?? '')
const translatedApparatus = computed(() => translateApparatus(apparatusCode.value, apparatusName.value))
const formattedTime = computed(() => formatLocalizedTime(props.passage.startTime))
const location = computed(() => props.passage.location ?? '')
const passageId = computed(() => props.passage._id ?? '')

const statusClass = computed(() => {
  switch (props.passage.status) {
    case 'LIVE': return 'is-live'
    case 'FINISHED': return 'is-finished'
    default: return ''
  }
})

const isLive = computed(() => props.passage.status === 'LIVE')

const ariaLabel = computed(() =>
  t('schedule.openGroupDetails', {
    group: groupName.value,
    apparatus: translatedApparatus.value,
    time: formattedTime.value
  })
)

const handleClick = () => {
  if (groupId.value) {
    emit('click:group', groupId.value, apparatusCode.value || undefined)
  }
}

const handleFavoriteToggle = (event: Event) => {
  event.stopPropagation()
  if (passageId.value) {
    emit('toggle:favorite', passageId.value, event)
  }
}
</script>

<template>
  <UiGlassCard
    :interactive="true"
    :aria-label="ariaLabel"
    class="passage-card"
    :class="statusClass"
    @click="handleClick"
  >
    <div class="passage-inner">

      <!-- Colonne gauche : Heure + Lieu -->
      <div class="passage-time-col">
        <span class="passage-time">{{ formattedTime }}</span>
        <span v-if="location" class="passage-location">{{ location }}</span>
        <span v-else class="passage-location-placeholder" aria-hidden="true" />
      </div>

      <!-- Séparateur vertical -->
      <div class="passage-divider" aria-hidden="true" />

      <!-- Colonne centrale : Nom + Engin -->
      <div class="passage-content">
        <h4 class="passage-group">{{ groupName }}</h4>
        <span class="passage-apparatus">{{ translatedApparatus }}</span>
      </div>

      <!-- Colonne droite : Live badge + Favori -->
      <div class="passage-actions" :class="{ 'has-live': isLive }">
        <span v-if="isLive" class="passage-live-badge" role="status">
          <span class="live-dot" aria-hidden="true" />
          {{ t('home.live') }}
        </span>

        <SparkHeart
          :active="isFavorite"
          :label="isFavorite
            ? t('schedule.removeFromFavorites', { name: groupName })
            : t('schedule.addToFavorites', { name: groupName })"
          @click.stop="handleFavoriteToggle"
        />
      </div>

    </div>
  </UiGlassCard>
</template>

<style scoped>
/* ── Taille fixe de la carte ─────────────────────────────────────── */
.passage-card {
  height: 80px;
  min-height: 80px;
  max-height: 80px;
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.35s ease,
    box-shadow   0.35s ease,
    opacity      0.35s ease;
}

/* ── Layout interne flex centré ──────────────────────────────────── */
.passage-inner {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
}

/* ── Colonne Heure / Lieu ────────────────────────────────────────── */
.passage-time-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  width: 64px;
  text-align: center;
}

.passage-time {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  color: #22d3ee;
  letter-spacing: -0.01em;
}

.passage-location {
  font-size: 0.6875rem;
  line-height: 1;
  color: rgba(255,255,255,0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Maintient l'espace même sans lieu pour ne pas faire bouger la ligne du temps */
.passage-location-placeholder {
  display: block;
  height: 11px;
}

/* ── Séparateur ──────────────────────────────────────────────────── */
.passage-divider {
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.1);
  flex-shrink: 0;
  margin: 0 14px;
}

/* ── Colonne Groupe / Engin ──────────────────────────────────────── */
.passage-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.passage-group {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.passage-apparatus {
  font-size: 0.8125rem;
  line-height: 1;
  color: #a78bfa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Colonne Actions ─────────────────────────────────────────────── */
.passage-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* centré par défaut (sans badge) */
  gap: 6px;
  flex-shrink: 0;
  margin-left: 12px;
  width: 52px;
}

/* Quand le badge live est présent, espace badge + cœur verticalement */
.passage-actions.has-live {
  justify-content: space-between;
  padding: 14px 0;
}

/* Badge LIVE */
.passage-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.18);
  color: #f87171;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f87171;
  animation: pulse-dot 1.8s ease-in-out infinite;
}

/* Placeholder même hauteur que le badge → pas de saut de layout */
.passage-live-placeholder {
  display: block;
  height: 18px;
}

/* ── États de la carte ───────────────────────────────────────────── */
.is-live {
  border-color: rgba(239, 68, 68, 0.35) !important;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.12);
  animation: pulse-card 2.2s ease-in-out infinite;
}

.is-finished {
  opacity: 0.55;
}

/* ── Animations ──────────────────────────────────────────────────── */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.75); }
}

@keyframes pulse-card {
  0%, 100% { box-shadow: 0 0 14px rgba(239, 68, 68, 0.12); }
  50%       { box-shadow: 0 0 22px rgba(239, 68, 68, 0.28); }
}

@media (prefers-reduced-motion: reduce) {
  .is-live  { animation: none; }
  .live-dot { animation: none; }
}

/* ── Transition interne du glass-card ───────────────────────────── */
:deep(.glass-card) {
  transition:
    border-color 0.35s ease,
    box-shadow   0.35s ease,
    opacity      0.35s ease;
}
</style>
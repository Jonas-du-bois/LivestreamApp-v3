<script setup lang="ts">
const { t } = useI18n()

const eventInfo = {
  name: 'Coupe des Bains - 39e edition',
  location: 'Yverdon-les-Bains',
  dates: 'Samedi 9 mai et dimanche 10 mai 2026',
  venues: 'Centre sportif des Isles et salle Leon-Michaud'
}

const weekendOrganization = [
  {
    day: 'Samedi 9 mai 2026',
    title: 'Concours actifs-actives',
    details: 'Tour qualificatif puis finales selon le nombre de groupes.'
  },
  {
    day: 'Dimanche 10 mai 2026',
    title: 'Concours jeunesse et mixte',
    details: 'Categories jeunesse A/B confirmees, et volet mixte a confirmer selon horaires officiels.'
  }
]

const parkingInfo = [
  {
    label: 'Prix du parking',
    value: 'A completer (tarification communale, places blanches).'
  },
  {
    label: 'Acces parking',
    value: 'Consulter le plan officiel pour les zones recommandees et le cheminement a pied.'
  },
  {
    label: 'Conseil',
    value: 'Prevoir une marge pour se garer et rejoindre les salles avant le passage.'
  }
]

const samaritansInfo = [
  {
    label: 'Poste samaritain',
    value: 'A completer (emplacement exact sur site).'
  },
  {
    label: 'Acces samaritains',
    value: 'A completer (point de rendez-vous / signaletique / procedure).'
  },
  {
    label: 'Urgence',
    value: 'En cas de besoin, s adresser au staff de salle ou au speaker pour orientation immediate.'
  }
]

const importantInfo = [
  'Entree spectateurs: a completer selon la communication officielle.',
  'Restauration sur place pendant le week-end.',
  'Presence de deux sites de competition (Les Isles / Leon-Michaud).',
  'Suivre les horaires officiels pour les passages et mises a jour.',
  'Verifier les annonces de derniere minute (organisation, acces, meteo).'
]

const usefulLinks = [
  {
    label: 'Site officiel Coupe des Bains',
    href: 'https://agy.ch/cdb/'
  },
  {
    label: 'Programme competition',
    href: 'https://agy.ch/cdb/competition/'
  },
  {
    label: 'Plan d acces / Parking',
    href: 'https://agy.ch/cdb/nous-trouver/'
  },
  {
    label: 'Prescriptions 2026 (PDF)',
    href: 'https://agy.ch/wp-content/uploads/2025/10/PrescriptionsCdB2026.pdf'
  }
]
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <div class="px-2 pt-2">
      <UiGlassBackButton to="/">
        {{ t('common.back') }}
      </UiGlassBackButton>
    </div>

    <section class="glass-card relative overflow-hidden p-5">
      <div class="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-cyan-500/20 blur-2xl" />
      <div class="relative">
        <p class="text-cyan-400 text-xs uppercase tracking-[0.2em] font-bold mb-2">Infos concours</p>
        <h2 class="text-white text-2xl font-black leading-tight mb-4">{{ eventInfo.name }}</h2>
        <div class="space-y-2 text-sm text-white/80">
          <p class="flex items-start gap-2">
            <Icon name="fluent:calendar-24-regular" class="w-4 h-4 mt-0.5 text-cyan-400" />
            <span>{{ eventInfo.dates }}</span>
          </p>
          <p class="flex items-start gap-2">
            <Icon name="fluent:location-24-regular" class="w-4 h-4 mt-0.5 text-cyan-400" />
            <span>{{ eventInfo.location }} - {{ eventInfo.venues }}</span>
          </p>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-white text-lg font-bold px-1">Organisation du week-end</h3>
      <div class="grid grid-cols-1 gap-3">
        <article
          v-for="item in weekendOrganization"
          :key="item.day"
          class="glass-card p-4 border border-white/10"
        >
          <p class="text-cyan-300 text-xs font-bold uppercase tracking-[0.18em] mb-1">{{ item.day }}</p>
          <h4 class="text-white font-bold mb-1">{{ item.title }}</h4>
          <p class="text-white/70 text-sm">{{ item.details }}</p>
        </article>
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-white text-lg font-bold px-1">Acces et parking</h3>
      <div class="glass-card p-4 space-y-3">
        <div
          v-for="line in parkingInfo"
          :key="line.label"
          class="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"
        >
          <p class="text-white/70 text-sm min-w-36">{{ line.label }}</p>
          <p class="text-white text-sm text-right">{{ line.value }}</p>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-white text-lg font-bold px-1">Samaritains et premiers secours</h3>
      <div class="glass-card p-4 space-y-3">
        <div
          v-for="line in samaritansInfo"
          :key="line.label"
          class="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"
        >
          <p class="text-white/70 text-sm min-w-36">{{ line.label }}</p>
          <p class="text-white text-sm text-right">{{ line.value }}</p>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-white text-lg font-bold px-1">Infos importantes</h3>
      <div class="glass-card p-4 space-y-2">
        <p
          v-for="line in importantInfo"
          :key="line"
          class="text-sm text-white/85 flex items-start gap-2"
        >
          <Icon name="fluent:checkmark-circle-24-filled" class="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <span>{{ line }}</span>
        </p>
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-white text-lg font-bold px-1">Liens utiles</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          v-for="link in usefulLinks"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="glass-card p-4 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors"
        >
          <span class="text-white text-sm font-medium">{{ link.label }}</span>
          <Icon name="fluent:open-24-regular" class="w-5 h-5 text-cyan-400 shrink-0" />
        </a>
      </div>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <NuxtLink
        to="/schedule"
        class="glass-card p-4 flex items-center gap-3 hover:bg-white/10 transition-colors"
      >
        <Icon name="fluent:calendar-24-regular" class="w-5 h-5 text-cyan-400" />
        <span class="text-white text-sm">Programme</span>
      </NuxtLink>
      <NuxtLink
        to="/plan"
        class="glass-card p-4 flex items-center gap-3 hover:bg-white/10 transition-colors"
      >
        <Icon name="fluent:location-24-regular" class="w-5 h-5 text-cyan-400" />
        <span class="text-white text-sm">Plan</span>
      </NuxtLink>
      <NuxtLink
        to="/food"
        class="glass-card p-4 flex items-center gap-3 hover:bg-white/10 transition-colors"
      >
        <Icon name="fluent:food-24-regular" class="w-5 h-5 text-cyan-400" />
        <span class="text-white text-sm">Restauration</span>
      </NuxtLink>
    </section>
  </div>
</template>

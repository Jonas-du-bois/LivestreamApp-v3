<script setup lang="ts">
const { t, tm, rt } = useI18n()

const eventInfo = computed(() => ({
  name: t('infos.event.name'),
  location: t('infos.event.location'),
  dates: t('infos.event.dates'),
  venues: t('infos.event.venues')
}))

const weekendOrganization = computed(() => {
  const org = tm('infos.organization')
  return Array.isArray(org) ? org.map((item: any) => ({
    day: rt(item.day),
    title: rt(item.title),
    details: rt(item.details)
  })) : []
})

const parkingInfo = computed(() => {
  const parking = tm('infos.parking')
  return Array.isArray(parking) ? parking.map((item: any) => ({
    label: rt(item.label),
    value: rt(item.value)
  })) : []
})

const samaritansInfo = computed(() => {
  const sam = tm('infos.samaritans')
  return Array.isArray(sam) ? sam.map((item: any) => ({
    label: rt(item.label),
    value: rt(item.value)
  })) : []
})

const importantInfo = computed(() => {
  const imp = tm('infos.important')
  return Array.isArray(imp) ? imp.map((item: any) => rt(item)) : []
})

const usefulLinks = computed(() => {
  const links = tm('infos.links')
  const baseLinks = [
    { href: 'https://agy.ch/cdb/' },
    { href: 'https://agy.ch/cdb/competition/' },
    { href: 'https://agy.ch/cdb/nous-trouver/' },
    { href: 'https://agy.ch/wp-content/uploads/2025/10/PrescriptionsCdB2026.pdf' }
  ]
  return Array.isArray(links) ? links.map((item: any, idx: number) => ({
    label: rt(item.label),
    href: baseLinks[idx]?.href
  })) : []
})
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <div class="px-2 pt-2">
      <UiBackButton to="/">
        {{ t('common.back') }}
      </UiBackButton>
    </div>

    <Transition name="premium-swap" appear>
      <div class="space-y-6">
        <UiGlassCard class="relative overflow-hidden" padding="p-5">
          <div class="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-emerald-500/20 blur-2xl" />
          <div class="relative">
            <p class="text-emerald-300 text-xs uppercase tracking-[0.2em] font-bold mb-2">{{ t('infos.title') }}</p>
            <h2 class="text-white text-2xl font-black leading-tight mb-4">{{ eventInfo.name }}</h2>
            <div class="space-y-2 text-sm text-white/80">
              <p class="flex items-start gap-2">
                <Icon name="fluent:calendar-24-regular" class="w-4 h-4 mt-0.5 text-emerald-300" />
                <span>{{ eventInfo.dates }}</span>
              </p>
              <p class="flex items-start gap-2">
                <Icon name="fluent:location-24-regular" class="w-4 h-4 mt-0.5 text-emerald-300" />
                <span>{{ eventInfo.location }} - {{ eventInfo.venues }}</span>
              </p>
            </div>
          </div>
        </UiGlassCard>

        <section class="space-y-3">
          <UiSectionTitle>{{ t('infos.sections.organization') }}</UiSectionTitle>
          <div class="grid grid-cols-1 gap-3">
            <article
              v-for="item in weekendOrganization"
              :key="item.day"
              class="glass-card p-4 border border-white/10"
            >
              <p class="text-emerald-300 text-xs font-bold uppercase tracking-[0.18em] mb-1">{{ item.day }}</p>
              <h4 class="text-white font-bold mb-1">{{ item.title }}</h4>
              <p class="text-white/70 text-sm">{{ item.details }}</p>
            </article>
          </div>
        </section>

        <section class="space-y-3">
          <UiSectionTitle>{{ t('infos.sections.parking') }}</UiSectionTitle>
          <UiGlassCard class="space-y-3" padding="p-4">
            <div
              v-for="line in parkingInfo"
              :key="line.label"
              class="flex flex-col gap-1 border-b border-white/10 pb-3 last:border-0 last:pb-0"
            >
              <p class="text-white/70 text-sm font-semibold">{{ line.label }}</p>
              <p class="text-white text-sm text-left">{{ line.value }}</p>
            </div>
          </UiGlassCard>
        </section>

        <section class="space-y-3">
          <UiSectionTitle>{{ t('infos.sections.samaritans') }}</UiSectionTitle>
          <UiGlassCard class="space-y-3" padding="p-4">
            <div
              v-for="line in samaritansInfo"
              :key="line.label"
              class="flex flex-col gap-1 border-b border-white/10 pb-3 last:border-0 last:pb-0"
            >
              <p class="text-white/70 text-sm font-semibold">{{ line.label }}</p>
              <p class="text-white text-sm text-left">{{ line.value }}</p>
            </div>
          </UiGlassCard>
        </section>

        <section class="space-y-3">
          <UiSectionTitle>{{ t('infos.sections.important') }}</UiSectionTitle>
          <UiGlassCard class="space-y-2" padding="p-4">
            <p
              v-for="line in importantInfo"
              :key="line"
              class="text-sm text-white/85 flex items-start gap-2"
            >
              <Icon name="fluent:checkmark-circle-24-filled" class="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
              <span>{{ line }}</span>
            </p>
          </UiGlassCard>
        </section>

        <section class="space-y-3">
          <UiSectionTitle>{{ t('infos.sections.links') }}</UiSectionTitle>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              v-for="link in usefulLinks"
              :key="link.href"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="glass-card app-focus-ring p-4 flex items-center justify-between gap-3 transition-all duration-200 hover:bg-white/10 active:bg-white/15 active:scale-[0.98] group"
            >
              <span class="text-white text-sm font-medium transition-colors duration-200 group-hover:text-emerald-200 group-active:text-emerald-100">{{ link.label }}</span>
              <Icon name="fluent:open-24-regular" class="w-5 h-5 text-emerald-300 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-active:scale-90" />
            </a>
          </div>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UiInfoTile
            to="/schedule"
            icon="fluent:calendar-24-regular"
            label="Programme"
            size="sm"
          />
          <UiInfoTile
            to="/plan"
            icon="fluent:location-24-regular"
            label="Plan"
            size="sm"
          />
          <UiInfoTile
            to="/food"
            icon="fluent:food-24-regular"
            label="Restauration"
            size="sm"
          />
        </section>
      </div>
    </Transition>
  </div>
</template>

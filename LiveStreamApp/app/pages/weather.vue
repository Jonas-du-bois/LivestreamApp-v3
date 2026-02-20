<script setup lang="ts">
import { PublicService } from '../services/public.service'

const { t } = useI18n()

type WeatherKind =
  | 'sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'fog'
  | 'windy'
  | 'unknown'

const { data: weatherResp, pending, refresh } = await PublicService.getWeather()

const current = computed(() => weatherResp.value?.raw?.current_weather ?? null)

const temperature = computed(() => {
  const value = weatherResp.value?.temperature
  return typeof value === 'number' ? Math.round(value) : null
})

const windSpeed = computed(() => {
  const value = current.value?.windspeed
  return typeof value === 'number' ? Math.round(value) : null
})

const windDirection = computed(() => {
  const value = current.value?.winddirection
  if (typeof value !== 'number') return null
  return `${Math.round(value)}°`
})

const updatedAt = computed(() => {
  const value = current.value?.time
  if (typeof value !== 'string') return null
  const parts = value.split('T')
  if (parts.length === 2) return parts[1].slice(0, 5)
  return value
})

const weatherKind = computed<WeatherKind>(() => {
  const code = typeof current.value?.weathercode === 'number' ? current.value.weathercode : null
  const wind = typeof current.value?.windspeed === 'number' ? current.value.windspeed : null

  if (code === null) return 'unknown'
  if (code >= 95) return 'thunder'
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code === 45 || code === 48) return 'fog'
  if (wind !== null && wind >= 45) return 'windy'
  if (code === 0) return 'sunny'
  if (code === 1 || code === 2) return 'partly_cloudy'
  if (code === 3) return 'cloudy'
  return 'unknown'
})

const WEATHER_META: Record<WeatherKind, { icon: string; gradient: string; accent: string }> = {
  sunny: {
    icon: 'fluent:weather-sunny-24-regular',
    gradient: 'bg-gradient-to-br from-amber-400/40 via-orange-400/20 to-transparent',
    accent: 'text-amber-300'
  },
  partly_cloudy: {
    icon: 'fluent:weather-partly-cloudy-day-24-regular',
    gradient: 'bg-gradient-to-br from-cyan-400/30 via-slate-500/15 to-transparent',
    accent: 'text-cyan-300'
  },
  cloudy: {
    icon: 'fluent:weather-cloudy-24-regular',
    gradient: 'bg-gradient-to-br from-slate-400/35 via-slate-700/15 to-transparent',
    accent: 'text-slate-200'
  },
  rain: {
    icon: 'fluent:weather-rain-24-regular',
    gradient: 'bg-gradient-to-br from-blue-500/35 via-cyan-500/15 to-transparent',
    accent: 'text-blue-300'
  },
  snow: {
    icon: 'fluent:weather-snow-24-regular',
    gradient: 'bg-gradient-to-br from-sky-300/35 via-cyan-200/15 to-transparent',
    accent: 'text-sky-200'
  },
  thunder: {
    icon: 'fluent:weather-thunderstorm-24-regular',
    gradient: 'bg-gradient-to-br from-violet-500/35 via-purple-500/15 to-transparent',
    accent: 'text-violet-300'
  },
  fog: {
    icon: 'fluent:weather-fog-24-regular',
    gradient: 'bg-gradient-to-br from-gray-400/30 via-slate-600/15 to-transparent',
    accent: 'text-gray-200'
  },
  windy: {
    icon: 'fluent:weather-cloudy-24-regular',
    gradient: 'bg-gradient-to-br from-emerald-400/30 via-teal-500/15 to-transparent',
    accent: 'text-emerald-300'
  },
  unknown: {
    icon: 'fluent:weather-partly-cloudy-day-24-regular',
    gradient: 'bg-gradient-to-br from-white/10 via-slate-600/15 to-transparent',
    accent: 'text-white/80'
  }
}

const weatherMeta = computed(() => WEATHER_META[weatherKind.value])

const tempDisplay = computed(() => {
  if (pending.value) return '--'
  if (temperature.value === null) return '—'
  return `${temperature.value}°C`
})

const conditionLabel = computed(() => {
  if (pending.value) return '--'
  return t(`weather.conditions.${weatherKind.value}`)
})

const humorText = computed(() => {
  if (pending.value) return t('common.loading')
  return t(`weather.humor.${weatherKind.value}`)
})

const windDisplay = computed(() => {
  if (pending.value) return '--'
  if (windSpeed.value === null) return '—'
  const dir = windDirection.value
  return dir ? `${windSpeed.value} km/h • ${dir}` : `${windSpeed.value} km/h`
})

const updatedDisplay = computed(() => {
  if (pending.value) return '--'
  return updatedAt.value || '—'
})

const stats = computed(() => [
  {
    key: 'temp',
    label: t('weather.temperature'),
    value: tempDisplay.value,
    icon: 'fluent:temperature-24-regular'
  },
  {
    key: 'cond',
    label: t('weather.condition'),
    value: conditionLabel.value,
    icon: weatherMeta.value.icon
  },
  {
    key: 'wind',
    label: t('weather.wind'),
    value: windDisplay.value,
    icon: 'fluent:arrow-swap-24-regular'
  },
  {
    key: 'update',
    label: t('weather.updated'),
    value: updatedDisplay.value,
    icon: 'fluent:clock-24-regular'
  }
])
</script>

<template>
  <div class="px-4 space-y-6 pb-6">
    <div class="px-2 pt-2">
      <UiGlassBackButton to="/">
        {{ t('common.back') }}
      </UiGlassBackButton>
    </div>

    <div class="glass-card relative overflow-hidden">
      <div class="absolute inset-0 opacity-70" :class="weatherMeta.gradient" />
      <div class="relative p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center">
              <Icon :name="weatherMeta.icon" class="w-8 h-8" :class="weatherMeta.accent" />
            </div>
            <div>
              <p class="text-white/70 text-sm">{{ t('weather.subtitle') }}</p>
              <h2 class="text-white text-4xl font-bold">{{ tempDisplay }}</h2>
              <p class="text-white/80">{{ conditionLabel }}</p>
            </div>
          </div>

          <button
            class="glass-card px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors"
            :class="{ 'opacity-60 pointer-events-none': pending }"
            @click="refresh"
          >
            <Icon name="fluent:arrow-clockwise-24-regular" class="w-4 h-4 text-white" />
            <span class="text-white text-xs font-semibold">{{ t('weather.refresh') }}</span>
          </button>
        </div>

        <div class="mt-4">
          <p class="text-white font-semibold">{{ humorText }}</p>
          <p class="text-white/70 text-sm mt-2">{{ t('weather.location') }}: Yverdon-les-Bains</p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
          <span class="px-3 py-1.5 rounded-full border border-white/20 bg-white/10">
            {{ t('weather.updated') }}: {{ updatedDisplay }}
          </span>
          <span class="px-3 py-1.5 rounded-full border border-white/20 bg-white/10">
            {{ t('weather.wind') }}: {{ windDisplay }}
          </span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="stat in stats"
        :key="stat.key"
        class="glass-card p-4 flex items-center gap-3"
      >
        <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
          <Icon :name="stat.icon" class="w-5 h-5 text-white/80" />
        </div>
        <div>
          <p class="text-xs text-white/60 uppercase tracking-wide">{{ stat.label }}</p>
          <p class="text-white font-bold">{{ stat.value }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

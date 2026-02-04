<script setup lang="ts">
import { Line } from 'vue-chartjs'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface HistoryPoint {
  year: number
  score: number
}

interface Props {
  data: HistoryPoint[]
  height?: number
  showLegend?: boolean
  title?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: 200,
  showLegend: false,
  title: '',
  compact: false
})


const { t, locale } = useI18n()

// Chart data
const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.data.map(d => d.year.toString()),
  datasets: [
    {
      label: 'Note',
      data: props.data.map(d => d.score),
      fill: true,
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, props.height)
        gradient.addColorStop(0, 'rgba(34, 211, 238, 0.3)')
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)')
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.02)')
        return gradient
      },
      borderColor: (context: any) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, context.chart.width, 0)
        gradient.addColorStop(0, '#22d3ee')
        gradient.addColorStop(1, '#a855f7')
        return gradient
      },
      borderWidth: 3,
      pointBackgroundColor: '#0B1120',
      pointBorderColor: '#22d3ee',
      pointBorderWidth: 2,
      pointRadius: props.compact ? 4 : 6,
      pointHoverRadius: props.compact ? 6 : 8,
      pointHoverBackgroundColor: '#22d3ee',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
      tension: 0.4,
    }
  ]
}))

// Chart options
const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: props.showLegend,
      labels: {
        color: 'rgba(255, 255, 255, 0.6)',
        font: {
          family: 'Segoe UI, sans-serif',
          size: 12
        }
      }
    },
    title: {
      display: !!props.title,
      text: props.title,
      color: 'rgba(255, 255, 255, 0.8)',
      font: {
        family: 'Segoe UI, sans-serif',
        size: 14,
        weight: 'bold'
      },
      padding: {
        bottom: 16
      }
    },
    tooltip: {
      backgroundColor: 'rgba(11, 17, 32, 0.95)',
      titleColor: '#ffffff',
      bodyColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(34, 211, 238, 0.3)',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      displayColors: false,
      titleFont: {
        family: 'Segoe UI, sans-serif',
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        family: 'Segoe UI, sans-serif',
        size: 13
      },
      callbacks: {
        title: (items) => `${t('historyLineChart.edition')} ${items[0]?.label}`,
        label: (item) => t('historyLineChart.note', { score: Number(item.raw).toFixed(2) })
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawTicks: false
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        font: {
          family: 'Segoe UI, sans-serif',
          size: props.compact ? 10 : 12,
          weight: '600'
        },
        padding: 8
      },
      border: {
        display: false
      }
    },
    y: {
      min: 5,
      max: 10,
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawTicks: false
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.4)',
        font: {
          family: 'Segoe UI, sans-serif',
          size: props.compact ? 10 : 11
        },
        padding: 8,
        stepSize: props.compact ? 5 : 2.5,
        callback: (value) => value.toFixed(1)
      },
      border: {
        display: false
      }
    }
  },
  elements: {
    line: {
      capBezierPoints: true
    }
  }
}))

// Compute stats
const maxScore = computed(() => {
  if (!props.data.length) return 0
  return Math.max(...props.data.map(d => d.score))
})

const avgScore = computed(() => {
  if (!props.data.length) return 0
  return props.data.reduce((acc, d) => acc + d.score, 0) / props.data.length
})

const trend = computed(() => {
  if (props.data.length <= 1) return 'stable'
  const first = props.data[0]?.score ?? 0
  const last = props.data[props.data.length - 1]?.score ?? 0
  if (last > first + 0.1) return 'up'
  if (last < first - 0.1) return 'down'
  return 'stable'
})

const trendValue = computed(() => {
  if (props.data.length <= 1) return 0
  const first = props.data[0]?.score ?? 0
  const last = props.data[props.data.length - 1]?.score ?? 0
  return Math.abs(last - first)
})
</script>

<template>
  <div class="history-chart">
    <!-- Chart Container -->
    <div class="relative" :style="{ height: `${height}px` }" :key="locale">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Stats Summary (optional) -->
    <div v-if="!compact" class="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
      <div>
        <div class="text-xs text-white/40 mb-1">{{ t('historyLineChart.best') }}</div>
        <div class="text-cyan-400 font-bold">{{ maxScore.toFixed(2) }}</div>
      </div>
      <div>
        <div class="text-xs text-white/40 mb-1">{{ t('historyLineChart.average') }}</div>
        <div class="text-white font-bold">{{ avgScore.toFixed(2) }}</div>
      </div>
      <div>
        <div class="text-xs text-white/40 mb-1">{{ t('historyLineChart.trend') }}</div>
        <div 
          :class="[
            'font-bold flex items-center justify-center gap-1',
            trend === 'up' ? 'text-green-400' 
              : trend === 'down' ? 'text-red-400'
                : 'text-white/60'
          ]"
        >
          <Icon 
            v-if="trend === 'up'"
            name="fluent:arrow-trending-up-24-filled" 
            class="w-4 h-4" 
          />
          <Icon 
            v-else-if="trend === 'down'"
            name="fluent:arrow-trending-down-24-filled" 
            class="w-4 h-4" 
          />
          <Icon 
            v-else
            name="fluent:arrow-right-24-filled" 
            class="w-4 h-4" 
          />
          {{ trendValue.toFixed(2) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-chart {
  width: 100%;
}
</style>

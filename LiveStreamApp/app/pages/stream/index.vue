<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useSocket } from '../../composables/useSocket'
import type { Stream } from '../../types/api'
import { PublicService } from '../../services/public.service'

interface StreamDisplay {
  id: string
  title: string
  thumbnail?: string
  isLive: boolean
  salle?: string
  currentGroup?: string
}

// Fetch live streams (and passages) in one call
const { data: liveResp, refresh: refreshLive } = await PublicService.getLive()

// Helper to access passages by ID
const livePassagesMap = computed(() => {
  const map = new Map<string, any>()
  if (liveResp.value?.passages) {
    liveResp.value.passages.forEach((p: any) => map.set(p._id, p))
  }
  return map
})

const handleStreamUpdate = (updatedStream: Partial<Stream>) => {
  if (liveResp.value?.streams) {
    const idx = liveResp.value.streams.findIndex((s: any) => s._id === updatedStream._id)
    if (idx !== -1) {
      const s = liveResp.value.streams[idx]
      if (!s) return
      // Apply updates
      if (updatedStream.url !== undefined) s.url = updatedStream.url
      if (updatedStream.isLive !== undefined) s.isLive = updatedStream.isLive
      if (updatedStream.currentPassage !== undefined) s.currentPassage = updatedStream.currentPassage
    }
  }
}

onMounted(() => {
  const socket = useSocket()
  if (socket.connected) {
    socket.emit('join-room', 'streams')
    socket.emit('join-room', 'schedule-updates')
  } else {
    socket.on('connect', () => {
      socket.emit('join-room', 'streams')
      socket.emit('join-room', 'schedule-updates')
    })
  }

  socket.on('stream-update', handleStreamUpdate)
  socket.on('schedule-update', handleScheduleUpdate)
  socket.on('status-update', handleStatusUpdate)
})

const handleScheduleUpdate = () => {
  refreshLive()
}

const handleStatusUpdate = (data: any) => {
  if (data.status === 'FINISHED') {
    refreshLive()
  }
}

onBeforeUnmount(() => {
  const socket = useSocket()
  socket.emit('leave-room', 'streams')
  socket.emit('leave-room', 'schedule-updates')
  socket.off('stream-update', handleStreamUpdate)
  socket.off('schedule-update', handleScheduleUpdate)
  socket.off('status-update', handleStatusUpdate)
})

const streams = computed<StreamDisplay[]>(() => {
  if (!liveResp.value?.streams) return []

  return liveResp.value.streams.map((s: any) => {
    let currentGroupName = '—'
    const cp = s.currentPassage
    if (cp) {
      if (typeof cp === 'string') {
        const passage = livePassagesMap.value.get(cp)
        if (passage && passage.group) {
             currentGroupName = passage.group.name
        }
      } else if (cp.group) {
         // If populated
        currentGroupName = (cp.group as any).name || '—'
      }
    }

    // Determine thumbnail: use provided one, else try YouTube/Twitch, else fallback
    const defaultImg = 'https://images.unsplash.com/photo-1764622078388-df36863688d3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

    let thumb = s.thumbnail || ''
    if (!thumb && s.url) {
      const url: string = s.url
      // YouTube embed URL: /embed/VIDEO_ID
      const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/)
      const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
      const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)

      const ytId = embedMatch?.[1] || watchMatch?.[1] || shortMatch?.[1]
      if (ytId) {
        thumb = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
      } else if (url.includes('twitch.tv')) {
        // Try to extract channel name and use Twitch preview URL
        const twMatch = url.match(/twitch\.tv\/(.+?)(?:$|\/|\?)/)
        const channel = twMatch?.[1]
        if (channel) {
          thumb = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-1280x720.jpg`
        }
      }
    }

    if (!thumb) thumb = defaultImg

    return {
      id: s._id,
      title: s.name || s.title || 'Stream',
      thumbnail: thumb,
      isLive: !!s.isLive,
      salle: s.location || '',
      currentGroup: currentGroupName
    }
  })
})
</script>

<template>
  <div class="px-4 space-y-4 pb-6">
    <p class="text-white/60 text-sm px-1">
      Sélectionnez un flux pour regarder
    </p>

    <div class="grid grid-cols-1 gap-4">
      <NuxtLink
        v-for="stream in streams" 
        :key="stream.id" 
        :to="`/stream/${stream.id}`"
        class="glass-card overflow-hidden cursor-pointer block hover:border-cyan-400/50 transition-colors"
      >
        <div class="relative aspect-video">
          <ImageWithFallback 
            :src="stream.thumbnail"
            :alt="stream.title"
            class="w-full h-full object-cover"
          />
          
          <div class="absolute top-3 left-3 flex gap-2">
            <div 
              v-if="stream.isLive"
              class="bg-red-500/90 px-3 py-1.5 rounded-full flex items-center gap-2"
            >
              <span class="w-2 h-2 bg-white rounded-full animate-pulse-glow" />
              <span class="text-white text-xs font-bold">LIVE</span>
            </div>
            <div class="glass-card px-3 py-1.5">
              <span class="text-white text-xs font-medium">{{ stream.salle }}</span>
            </div>
          </div>

          <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
            <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon name="fluent:play-24-filled" class="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div class="p-4">
          <h3 class="text-white font-bold mb-1">{{ stream.title }}</h3>
          <p class="text-white/60 text-sm">
            En piste: <span class="text-cyan-400">{{ stream.currentGroup }}</span>
          </p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

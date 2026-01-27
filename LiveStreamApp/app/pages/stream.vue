<script setup lang="ts">
import { PublicService } from '../services/public.service'

interface Stream {
  id: string
  title: string
  thumbnail?: string
  isLive: boolean
  salle?: string
  currentGroup?: string
}

// Fetch live streams (and passages) in one call
const { data: liveResp } = await PublicService.getLive()

const livePassagesMap = computed(() => {
  const map = new Map<string, any>()
  (liveResp.value?.passages || []).forEach((p: any) => map.set(p._id, p))
  return map
})

const streams = computed<Stream[]>(() => {
  return (liveResp.value?.streams || []).map((s: any) => {
    let currentGroupName = '—'
    const cp = s.currentPassage
    if (cp) {
      if (typeof cp === 'string') {
        currentGroupName = livePassagesMap.value.get(cp)?.group?.name || '—'
      } else {
        currentGroupName = cp.group?.name || '—'
      }
    }

    // Determine thumbnail: use provided one, else try YouTube/Twitch, else fallback
    const defaultImg = 'https://images.unsplash.com/photo-1752297725917-ada2cb5d3409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW1uYXN0aWNzJTIwY29tcGV0aXRpb24lMjBhY3Rpb258ZW58MXx8fHwxNzY5NDQwNDMzfDA&ixlib=rb-4.1.0&q=80&w=1080'

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
      <div 
        v-for="stream in streams" 
        :key="stream.id" 
        class="glass-card overflow-hidden cursor-pointer"
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
      </div>
    </div>
  </div>
</template>

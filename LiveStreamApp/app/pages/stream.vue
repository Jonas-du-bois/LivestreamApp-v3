<script setup lang="ts">
interface Stream {
  id: string
  title: string
  thumbnail: string
  isLive: boolean
  salle: string
  currentGroup: string
}

const streams: Stream[] = [
  {
    id: '1',
    title: 'Salle 1',
    thumbnail: 'https://images.unsplash.com/photo-1752297725917-ada2cb5d3409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW1uYXN0aWNzJTIwY29tcGV0aXRpb24lMjBhY3Rpb258ZW58MXx8fHwxNzY5NDQwNDMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    isLive: true,
    salle: 'Salle 1',
    currentGroup: 'FSG Yverdon'
  },
  {
    id: '2',
    title: 'Salle 2',
    thumbnail: 'https://images.unsplash.com/photo-1752297725917-ada2cb5d3409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW1uYXN0aWNzJTIwY29tcGV0aXRpb24lMjBhY3Rpb258ZW58MXx8fHwxNzY5NDQwNDMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    isLive: true,
    salle: 'Salle 2',
    currentGroup: 'FSG Morges'
  },
  {
    id: '3',
    title: 'Salle 3',
    thumbnail: 'https://images.unsplash.com/photo-1752297725917-ada2cb5d3409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW1uYXN0aWNzJTIwY29tcGV0aXRpb24lMjBhY3Rpb258ZW58MXx8fHwxNzY5NDQwNDMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    isLive: false,
    salle: 'Salle 3',
    currentGroup: 'Pause'
  },
  {
    id: '4',
    title: 'Vue générale',
    thumbnail: 'https://images.unsplash.com/photo-1752297725917-ada2cb5d3409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW1uYXN0aWNzJTIwY29tcGV0aXRpb24lMjBhY3Rpb258ZW58MXx8fHwxNzY5NDQwNDMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    isLive: true,
    salle: 'Multi-vue',
    currentGroup: 'Toutes les salles'
  }
]
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

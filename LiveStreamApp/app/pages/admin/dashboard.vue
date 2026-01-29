<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AdminService } from '../../services/admin.service'
import { PublicService } from '../../services/public.service'
import type { PassageEnriched, Stream, PassageStatus } from '../../types/api'
import { useAdminAuth } from '../../composables/useAdminAuth'

const { token: adminToken, login } = useAdminAuth()
const passwordInput = ref('')

const isAuthenticated = computed(() => !!adminToken.value)

const handleLogin = () => {
  if (passwordInput.value) {
    login(passwordInput.value)
  }
}

// Data
const passages = ref<PassageEnriched[]>([])
const streams = ref<Stream[]>([])
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const scheduleRes = await PublicService.getSchedule()
    const streamsRes = await PublicService.getStreams()

    // Wait for the actual data
    const [scheduleData, streamsData] = await Promise.all([
      scheduleRes.refresh(),
      streamsRes.refresh()
    ]) as [any, any]

    // Ensure scores object exists for editing
    if (scheduleData && scheduleData.data) {
      passages.value = scheduleData.data.map((p: any) => ({
        ...p,
        scores: p.scores || { program: undefined, technical: undefined, total: undefined }
      }))
    }

    if (streamsData) {
      streams.value = streamsData
    }
  } catch (e) {
    console.error('Error fetching data:', e)
  } finally {
    loading.value = false
  }
}

// Fetch data on mount if authenticated, or watch authentication
onMounted(() => {
  if (isAuthenticated.value) {
    fetchData()
  }
})

watch(isAuthenticated, (val) => {
  if (val) fetchData()
})

// Helper to find stream for passage
const getStreamForPassage = (passage: PassageEnriched): Stream | undefined => {
  // Logic: Match stream location to apparatus name, or fallback to first stream
  // Ideally, stream.location matches passage.apparatus.name
  return streams.value.find(s => s.location === passage.apparatus.name) || streams.value[0]
}

// Actions
const updateStatus = async (passage: PassageEnriched, status: PassageStatus) => {
  try {
    await AdminService.updateStatus({ passageId: passage._id!, status })
    passage.status = status
  } catch (e) {
    console.error('Error updating status:', e)
    alert('Error updating status')
  }
}

const updateScore = async (passage: PassageEnriched) => {
  try {
    await AdminService.updateScore({
      passageId: passage._id!,
      programScore: passage.scores?.program,
      techScore: passage.scores?.technical,
      totalScore: passage.scores?.total
    })
    alert('Score saved')
  } catch (e) {
    console.error('Error updating score:', e)
    alert('Error updating score')
  }
}

const updateStreamUrl = async (stream: Stream) => {
  if (!stream._id) return
  try {
    await AdminService.updateStream({
      streamId: stream._id,
      url: stream.url,
      isLive: stream.isLive
    })
    alert('Stream updated')
  } catch (e) {
    console.error('Error updating stream:', e)
    alert('Error updating stream')
  }
}
</script>

<template>
  <div class="min-h-screen p-4 md:p-8 text-white">
    <div v-if="!isAuthenticated" class="max-w-md mx-auto mt-20 glass-panel p-8 rounded-3xl text-center">
      <h1 class="text-2xl font-bold mb-6">Admin Login</h1>
      <input
        v-model="passwordInput"
        type="password"
        placeholder="Mot de passe Administrateur"
        class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-4 focus:outline-none focus:border-cyan-400"
        @keyup.enter="handleLogin"
      />
      <button
        @click="handleLogin"
        class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
      >
        Login
      </button>
    </div>

    <div v-else>
      <header class="flex justify-between items-center mb-8 sticky top-0 bg-[#0B1120]/80 backdrop-blur-md z-50 p-4 -mx-4 rounded-b-2xl">
        <h1 class="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <div class="flex gap-2">
           <button @click="fetchData" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">Refresh</button>
        </div>
      </header>

      <!-- Streams Section -->
      <section class="mb-12">
        <h2 class="text-xl font-bold mb-4 text-cyan-400">Streams Management</h2>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="stream in streams" :key="stream._id" class="glass-panel p-6 rounded-2xl">
            <h3 class="font-bold mb-2 flex justify-between">
              {{ stream.name || 'Unnamed Stream' }}
              <span class="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">{{ stream.location }}</span>
            </h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-white/60 block mb-1">YouTube/Video URL</label>
                <input
                  v-model="stream.url"
                  class="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-cyan-400"
                />
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" v-model="stream.isLive" :id="`live-${stream._id}`" class="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                <label :for="`live-${stream._id}`" class="text-sm cursor-pointer select-none">Is Live</label>
              </div>
              <button
                @click="updateStreamUrl(stream)"
                class="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Update Stream
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Passages Section -->
      <section>
        <h2 class="text-xl font-bold mb-4 text-cyan-400">Passages ({{ passages.length }})</h2>
        <div class="space-y-4">
          <div v-for="passage in passages" :key="passage._id" class="glass-panel p-4 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <!-- Info -->
            <div class="lg:w-1/4 w-full">
              <div class="text-xs text-cyan-400 font-bold uppercase">{{ passage.startTime }} - {{ passage.endTime }}</div>
              <div class="font-bold text-lg leading-tight mb-1">{{ passage.group.name }}</div>
              <div class="text-sm text-white/60 flex items-center gap-2">
                <Icon :name="passage.apparatus.icon" class="w-4 h-4" />
                {{ passage.apparatus.name }}
              </div>
            </div>

            <!-- Status -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="status in ['SCHEDULED', 'LIVE', 'FINISHED']"
                :key="status"
                @click="updateStatus(passage, status as PassageStatus)"
                class="px-3 py-1 rounded-full text-xs font-bold transition-all"
                :class="passage.status === status ? (status === 'LIVE' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]') : 'bg-white/5 text-white/40 hover:bg-white/10'"
              >
                {{ status }}
              </button>
            </div>

            <!-- Scores -->
            <div class="flex items-center gap-2 flex-1 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
              <div class="flex flex-col">
                <label class="text-[10px] text-white/40 text-center">Prog</label>
                <input v-model.number="passage.scores!.program" class="w-14 bg-black/20 border border-white/10 rounded-lg p-1.5 text-sm text-center focus:border-cyan-400" />
              </div>
              <div class="flex flex-col">
                 <label class="text-[10px] text-white/40 text-center">Tech</label>
                <input v-model.number="passage.scores!.technical" class="w-14 bg-black/20 border border-white/10 rounded-lg p-1.5 text-sm text-center focus:border-cyan-400" />
              </div>
               <div class="flex flex-col">
                 <label class="text-[10px] text-white/40 text-center">Total</label>
                <input v-model.number="passage.scores!.total" class="w-16 bg-black/20 border border-white/10 rounded-lg p-1.5 text-sm text-center font-bold focus:border-cyan-400" />
              </div>
              <button @click="updateScore(passage)" class="mt-3 bg-green-500/20 text-green-400 hover:bg-green-500/30 p-2 rounded-lg transition-colors" title="Save Score">
                <Icon name="fluent:save-24-regular" class="w-5 h-5" />
              </button>
            </div>

            <!-- Stream Quick Action -->
            <div class="lg:w-1/4 w-full bg-white/5 p-3 rounded-xl border border-white/5">
               <div class="text-[10px] text-white/40 mb-1 flex justify-between">
                 <span>Stream URL</span>
                 <span v-if="getStreamForPassage(passage)" class="text-cyan-400/80">{{ getStreamForPassage(passage)?.name }}</span>
                 <span v-else class="text-red-400/80">No Stream</span>
               </div>
               <div class="flex gap-2">
                 <input
                   v-if="getStreamForPassage(passage)"
                   :value="getStreamForPassage(passage)?.url"
                   @input="(e) => getStreamForPassage(passage)!.url = (e.target as HTMLInputElement).value"
                   class="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-xs text-white/80 focus:border-cyan-400"
                   placeholder="URL"
                 />
                 <div v-else class="text-xs text-white/40 italic flex items-center justify-center w-full">
                    No matching stream found
                 </div>
                 <button
                   v-if="getStreamForPassage(passage)"
                   @click="updateStreamUrl(getStreamForPassage(passage)!)"
                   class="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                   title="Update Stream URL"
                 >
                   <Icon name="fluent:arrow-sync-24-regular" class="w-4 h-4" />
                 </button>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

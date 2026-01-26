<script setup lang="ts">
interface Props {
  isOpen: boolean
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  isUnread?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const notifications: Notification[] = [
  {
    id: '1',
    title: 'Début imminent',
    message: 'FSG Yverdon passe dans 15 min',
    time: 'Il y a 2 min',
    isUnread: true
  },
  {
    id: '2',
    title: 'Résultats disponibles',
    message: 'Les scores du Sol sont publiés',
    time: 'Il y a 10 min',
    isUnread: true
  },
  {
    id: '3',
    title: 'Nouveau direct',
    message: 'Salle 3 est maintenant en ligne',
    time: 'Il y a 1 h'
  },
  {
    id: '4',
    title: 'Rappel',
    message: 'FSG Genève dans 30 minutes',
    time: 'Il y a 2 h'
  }
]

const unreadCount = computed(() => notifications.filter(n => n.isUnread).length)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="slide-right">
      <div
        v-if="isOpen"
        class="fixed right-0 top-0 bottom-0 w-[85%] max-w-md glass-panel z-[70] overflow-hidden"
      >
        <!-- Header -->
        <div class="p-6 border-b border-white/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <Icon name="fluent:alert-24-regular" class="w-6 h-6 text-cyan-400" />
              <h2 class="text-white font-bold text-xl">Notifications</h2>
            </div>
            <button
              @click="emit('close')"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white/80" />
            </button>
          </div>
          <p class="text-white/60 text-sm">
            {{ unreadCount }} nouvelles
          </p>
        </div>

        <!-- Notifications List -->
        <div class="overflow-y-auto h-[calc(100%-100px)] p-4 space-y-3">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="glass-card p-4 transition-all"
            :class="{ 'ring-1 ring-cyan-400/30': notification.isUnread }"
          >
            <div class="flex items-start gap-3">
              <div 
                v-if="notification.isUnread"
                class="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" 
              />
              <div class="flex-1 min-w-0">
                <h4 class="text-white font-bold mb-1">
                  {{ notification.title }}
                </h4>
                <p class="text-white/80 text-sm mb-2">
                  {{ notification.message }}
                </p>
                <div class="flex items-center gap-1.5 text-white/50 text-xs">
                  <Icon name="fluent:clock-24-regular" class="w-3 h-3" />
                  <span>{{ notification.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>

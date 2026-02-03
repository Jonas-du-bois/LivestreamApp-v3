<script setup lang="ts">
import type { AppNotification, NotificationType } from '~/types/notifications'
import { useNotificationsStore } from '#imports'

interface Props {
  isOpen: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const notificationsStore = useNotificationsStore()

// Computed values from store
const notifications = computed(() => notificationsStore.allNotifications)
const unreadCount = computed(() => notificationsStore.unreadCount)
const hasNotifications = computed(() => notifications.value.length > 0)

// Format relative time
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours} h`
  if (diffDays === 1) return 'Hier'
  return `Il y a ${diffDays} jours`
}

// Get icon based on notification type
const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    info: 'fluent:info-24-regular',
    success: 'fluent:checkmark-circle-24-regular',
    warning: 'fluent:warning-24-regular',
    live: 'fluent:live-24-filled',
    score: 'fluent:trophy-24-regular',
    reminder: 'fluent:clock-alarm-24-regular'
  }
  return icons[type] || 'fluent:alert-24-regular'
}

// Get accent color based on notification type
const getTypeColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    info: 'cyan',
    success: 'emerald',
    warning: 'amber',
    live: 'red',
    score: 'purple',
    reminder: 'orange'
  }
  return colors[type] || 'cyan'
}

// Actions
const markAsRead = (id: string) => {
  notificationsStore.markAsRead(id)
}

const markAllAsRead = () => {
  notificationsStore.markAllAsRead()
}

const removeNotification = (id: string) => {
  notificationsStore.removeNotification(id)
}

const clearAllRead = () => {
  notificationsStore.clearRead()
}

// Handle notification click - mark as read and optionally navigate
const handleNotificationClick = (notification: AppNotification) => {
  if (!notification.isRead) {
    markAsRead(notification.id)
  }
  
  if (notification.url) {
    emit('close')
    navigateTo(notification.url)
  }
}
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
        class="fixed right-0 top-0 bottom-0 w-[85%] max-w-md glass-panel z-[70] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="p-5 border-b border-white/10 flex-shrink-0">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-cyan-500/20 rounded-xl">
                <Icon name="fluent:alert-24-regular" class="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 class="text-white font-bold text-lg">Notifications</h2>
                <p class="text-white/50 text-xs">
                  {{ unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu' }}
                </p>
              </div>
            </div>
            <button
              @click="emit('close')"
              class="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Fermer les notifications"
            >
              <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white/70" />
            </button>
          </div>

          <!-- Actions bar -->
          <div v-if="hasNotifications" class="flex items-center gap-2">
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl text-sm font-medium transition-colors"
            >
              <Icon name="fluent:checkmark-circle-24-regular" class="w-4 h-4" />
              <span>Tout marquer comme lu</span>
            </button>
            <button
              @click="clearAllRead"
              class="p-2 hover:bg-white/10 rounded-xl transition-colors group"
              title="Supprimer les notifications lues"
            >
              <Icon name="fluent:delete-24-regular" class="w-4 h-4 text-white/50 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <!-- Empty state -->
          <div v-if="!hasNotifications" class="flex flex-col items-center justify-center h-full text-center px-6">
            <div class="p-6 bg-white/5 rounded-full mb-4">
              <Icon name="fluent:alert-off-24-regular" class="w-12 h-12 text-white/20" />
            </div>
            <h3 class="text-white/60 font-medium mb-2">Aucune notification</h3>
            <p class="text-white/40 text-sm">
              Les notifications apparaîtront ici lorsqu'il y aura de l'activité
            </p>
          </div>

          <!-- Notifications -->
          <TransitionGroup name="notification-list" tag="div" class="space-y-3">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-card glass-card p-4 transition-all cursor-pointer group"
              :class="[
                !notification.isRead 
                  ? 'ring-1 ring-cyan-400/30 bg-cyan-500/5' 
                  : 'opacity-70 hover:opacity-100'
              ]"
              @click="handleNotificationClick(notification)"
            >
              <div class="flex items-start gap-3">
                <!-- Type indicator icon -->
                <div 
                  class="flex-shrink-0 p-2 rounded-xl transition-colors"
                  :class="[
                    `bg-${getTypeColor(notification.type)}-500/20`,
                    notification.type === 'live' ? 'animate-pulse' : ''
                  ]"
                >
                  <Icon 
                    :name="notification.icon || getNotificationIcon(notification.type)" 
                    class="w-5 h-5"
                    :class="`text-${getTypeColor(notification.type)}-400`"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="text-white font-semibold text-sm leading-tight">
                      {{ notification.title }}
                    </h4>
                    <!-- Unread indicator -->
                    <div 
                      v-if="!notification.isRead"
                      class="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1 animate-pulse" 
                    />
                  </div>
                  
                  <p class="text-white/70 text-sm mt-1 line-clamp-2">
                    {{ notification.message }}
                  </p>
                  
                  <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center gap-1.5 text-white/40 text-xs">
                      <Icon name="fluent:clock-24-regular" class="w-3 h-3" />
                      <span>{{ formatRelativeTime(notification.timestamp) }}</span>
                    </div>

                    <!-- Actions (show on hover) -->
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        v-if="!notification.isRead"
                        @click.stop="markAsRead(notification.id)"
                        class="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Marquer comme lu"
                      >
                        <Icon name="fluent:checkmark-24-regular" class="w-3.5 h-3.5 text-white/60" />
                      </button>
                      <button
                        @click.stop="removeNotification(notification.id)"
                        class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Icon name="fluent:dismiss-24-regular" class="w-3.5 h-3.5 text-white/60 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Live indicator bar -->
              <div
                v-if="notification.type === 'live' && !notification.isRead"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-gradient-x"
              />
            </div>
          </TransitionGroup>
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

/* Notification list animations */
.notification-list-enter-active {
  transition: all 0.3s ease-out;
}
.notification-list-leave-active {
  transition: all 0.2s ease-in;
  position: absolute;
  width: calc(100% - 2rem);
}
.notification-list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.notification-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.notification-list-move {
  transition: transform 0.3s ease;
}

/* Notification card */
.notification-card {
  position: relative;
  overflow: hidden;
}

/* Gradient animation for live indicator */
@keyframes gradient-x {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
.animate-gradient-x {
  background-size: 200% 100%;
  animation: gradient-x 2s ease infinite;
}

/* Dynamic colors - Tailwind JIT workaround */
.bg-cyan-500\/20 { background-color: rgb(6 182 212 / 0.2); }
.bg-emerald-500\/20 { background-color: rgb(16 185 129 / 0.2); }
.bg-amber-500\/20 { background-color: rgb(245 158 11 / 0.2); }
.bg-red-500\/20 { background-color: rgb(239 68 68 / 0.2); }
.bg-purple-500\/20 { background-color: rgb(168 85 247 / 0.2); }
.bg-orange-500\/20 { background-color: rgb(249 115 22 / 0.2); }

.text-cyan-400 { color: rgb(34 211 238); }
.text-emerald-400 { color: rgb(52 211 153); }
.text-amber-400 { color: rgb(251 191 36); }
.text-red-400 { color: rgb(248 113 113); }
.text-purple-400 { color: rgb(192 132 252); }
.text-orange-400 { color: rgb(251 146 60); }
</style>

export type NotificationType = 'info' | 'success' | 'warning' | 'live' | 'score' | 'reminder'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  timestamp: string // ISO string pour la sérialisation
  isRead: boolean
  url?: string
  icon?: string
}

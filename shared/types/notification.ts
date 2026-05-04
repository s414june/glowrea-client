import type { TimelineStatus } from './timeline'

export type NotificationAccount = {
  id: string
  username: string
  acct: string
  displayName: string
  avatar: string
  url: string
}

export type NotificationItem = {
  id: string
  type: 'mention' | 'favourite' | 'reblog' | 'follow'
  createdAt: string
  account: NotificationAccount
  status?: TimelineStatus
}

export type NotificationsPageResponse = {
  items: NotificationItem[]
  nextMaxId: string | null
}

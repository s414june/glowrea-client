import type { TimelineStatus } from './timeline'

export type ConversationAccount = {
  id: string
  username: string
  acct: string
  displayName: string
  avatar: string
}

export type ConversationItem = {
  id: string
  accounts: ConversationAccount[]
  lastStatus: TimelineStatus | null
  unread: boolean
}

export type ConversationsPageResponse = {
  items: ConversationItem[]
  nextMaxId: string | null
}

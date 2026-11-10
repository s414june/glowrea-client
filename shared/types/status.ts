import type { CustomEmoji } from './timeline'

export type StatusAccount = {
  id: string
  username: string
  acct: string
  displayName: string
  avatar: string
  emojis?: CustomEmoji[]
}

export type StatusMediaAttachment = {
  id: string
  type: 'image' | 'video' | 'gifv' | 'audio' | 'unknown'
  url: string
  previewUrl?: string
  description?: string | null
}

export type StatusDetail = {
  id: string
  url?: string | null
  uri?: string
  content: string
  createdAt: string
  favouritesCount?: number
  reblogsCount?: number
  repliesCount?: number
  favourited?: boolean
  reblogged?: boolean
  bookmarked?: boolean
  emojis?: CustomEmoji[]
  mediaAttachments?: StatusMediaAttachment[]
  account: StatusAccount
  reblog?: StatusDetail | null
}

export type StatusContext = {
  ancestors: StatusDetail[]
  descendants: StatusDetail[]
}

export type StatusDetailResponse = {
  status: StatusDetail
}

export type StatusContextResponse = {
  context: StatusContext
}

export type StatusActionResult = {
  favouritesCount?: number
  reblogsCount?: number
  favourited?: boolean
  reblogged?: boolean
  bookmarked?: boolean
}

export type StatusActor = {
  id: string
  username: string
  acct: string
  displayName: string
  avatar: string
  emojis?: CustomEmoji[]
}

export type CustomEmoji = {
  shortcode: string
  url: string
  static_url: string
}

export type TimelineAccount = {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
  emojis?: CustomEmoji[]
}

export type TimelineMediaAttachment = {
  id: string
  type: 'image' | 'video' | 'gifv' | 'audio' | 'unknown'
  url: string
  preview_url?: string
  description?: string | null
}

export type TimelineStatus = {
  id: string
  url?: string | null
  uri?: string
  content: string
  created_at: string
  favourites_count?: number
  reblogs_count?: number
  replies_count?: number
  favourited?: boolean
  reblogged?: boolean
  bookmarked?: boolean
  emojis?: CustomEmoji[]
  media_attachments?: TimelineMediaAttachment[]
  account: TimelineAccount
  reblog?: TimelineStatus | null
}

export type TimelinePageResponse = {
  items: TimelineStatus[]
  nextMaxId: string | null
}

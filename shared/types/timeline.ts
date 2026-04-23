export type TimelineAccount = {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
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
  content: string
  created_at: string
  media_attachments?: TimelineMediaAttachment[]
  account: TimelineAccount
  reblog?: TimelineStatus | null
}

export type TimelinePageResponse = {
  items: TimelineStatus[]
  nextMaxId: string | null
}
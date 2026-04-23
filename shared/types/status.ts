export type StatusAccount = {
  id: string
  username: string
  acct: string
  displayName: string
  avatar: string
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
  content: string
  createdAt: string
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

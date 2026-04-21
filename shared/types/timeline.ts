export type TimelineAccount = {
  id: string
  username: string
  acct: string
  display_name: string
  avatar: string
}

export type TimelineStatus = {
  id: string
  content: string
  created_at: string
  account: TimelineAccount
  reblog?: TimelineStatus | null
}

export type TimelinePageResponse = {
  items: TimelineStatus[]
  nextMaxId: string | null
}
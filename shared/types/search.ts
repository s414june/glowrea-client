import type { TimelineStatus } from './timeline'

export type AccountSummary = {
  id: string
  username: string
  acct: string
  displayName: string
  avatar: string
  url: string
  note: string
}

export type HashtagItem = {
  name: string
  url: string
  history: { day: string; uses: string; accounts: string }[]
}

export type TrendingLink = {
  url: string
  title: string
  description: string
  image: string | null
  authorName: string | null
  providerName: string | null
  history: { day: string; uses: string; accounts: string }[]
}

export type SearchResponse = {
  accounts: AccountSummary[]
  statuses: TimelineStatus[]
  hashtags: HashtagItem[]
}

import type { CustomEmoji } from './timeline'

export type ProfileSummary = {
  id: string
  username: string
  acct: string
  displayName: string
  note: string
  avatar: string
  emojis?: CustomEmoji[]
  header: string
  statusesCount: number
  followingCount: number
  followersCount: number
}

export type ProfileMeResponse = {
  profile: ProfileSummary
}

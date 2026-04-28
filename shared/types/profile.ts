export type ProfileSummary = {
  id: string
  username: string
  acct: string
  displayName: string
  note: string
  avatar: string
  header: string
  statusesCount: number
  followingCount: number
  followersCount: number
}

export type ProfileMeResponse = {
  profile: ProfileSummary
}

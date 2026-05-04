export type TagHistory = {
  day: string
  uses: string
  accounts: string
}

export type TagInfo = {
  name: string
  following: boolean
  history: TagHistory[]
}

/** 唯一識別一個帳號在特定 Mastodon 實例上的複合鍵，格式：`${serverOrigin}::${accountId}` */
export type AccountKey = string

/** 單一帳號憑證記錄（存放於伺服器端加密檔案） */
export type CredentialEntry = {
  /** 複合鍵，用於跨帳號/跨聯邦唯一定位 */
  accountKey: AccountKey
  /** Mastodon 實例 origin，例如 https://mastodon.social */
  serverOrigin: string
  /** 帳號在該實例的 ID */
  accountId: string
  /** 帳號 username */
  username: string
  /** 帳號顯示名稱 */
  displayName: string
  /** 帳號頭貼 URL */
  avatar: string
  /**
   * AES-256-GCM 加密後的 access token。
   * 格式：`${ivHex}:${authTagHex}:${ciphertextHex}`
   */
  encryptedToken: string
  /** 首次加入時間（Unix ms） */
  addedAt: number
  /** 最後更新時間（Unix ms） */
  updatedAt: number
}

/** 整個 credential 檔案結構（保留 version 供未來格式遷移） */
export type CredentialStore = {
  version: 1
  entries: CredentialEntry[]
}

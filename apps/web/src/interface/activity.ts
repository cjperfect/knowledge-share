import type { PartialBlock } from '@blocknote/core'

export interface ActivityInput {
  name: string
  sharer: string
  date: string
  summary: string
  price: number
  thumbnail?: string
}

export type ActivityStatus = 'not_started' | 'ended' | 'pushed'

export interface Activity extends ActivityInput {
  id: string
  status: ActivityStatus
  signupCount?: number
  hasContent?: boolean
  content?: PartialBlock[]
  contentMarkdown?: string
}

export interface ActivityUpdateInput {
  name?: string
  sharer?: string
  date?: string
  summary?: string
  price?: number
  thumbnail?: string
  content?: PartialBlock[]
  contentMarkdown?: string
}

export interface ActivityInvite extends Activity {
  inviter: string | null
  registrationMode: 'live' | 'preview' | 'legacy'
}

export interface ActivityPosterQr {
  url: string
  size: number
  /** Base64-encoded, row-major matrix with one byte per module. */
  modules: string
}

export interface ActivityInvite {
  id: string
  name: string
  sharer: string
  date: string
  summary: string
  price: number
  thumbnail?: string
  inviter: string | null
  registrationMode: 'live' | 'preview' | 'legacy'
}

export interface ActivityPosterQr {
  url: string
  size: number
  /** Base64-encoded, row-major matrix with one byte per module. */
  modules: string
}

export interface PosterTemplate {
  id: string
  name: string
  image: string
  enabled: boolean
}

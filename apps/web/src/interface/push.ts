import type { PartialBlock } from '@blocknote/core'

export type PushStatus = 'sent' | 'scheduled' | 'failed' | 'draft'

export interface PushInput {
  title: string
  summary: string
  date: string
  time: string
  status: PushStatus
  document: PartialBlock[]
  contentMarkdown?: string
  activityId?: string | null
  tags: string[]
  prompt: string
}

export interface PushRecord extends PushInput {
  id: string
}

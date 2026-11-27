import { describe, expect, it } from 'vitest'
import { appendSpeechText } from './activity-ai'

describe('appendSpeechText', () => {
  it('starts a transcript from an empty field', () => {
    expect(appendSpeechText('', '今天分享了夏令营投递节奏')).toBe(
      '今天分享了夏令营投递节奏'
    )
  })

  it('separates chinese speech segments with a comma', () => {
    expect(appendSpeechText('今天分享了夏令营投递节奏', '她建议先分档')).toBe(
      '今天分享了夏令营投递节奏，她建议先分档'
    )
  })

  it('keeps existing punctuation', () => {
    expect(appendSpeechText('今天分享到这里。', '她建议先分档')).toBe(
      '今天分享到这里。她建议先分档'
    )
  })

  it('ignores empty recognition results', () => {
    expect(appendSpeechText('已有内容', '   ')).toBe('已有内容')
  })
})

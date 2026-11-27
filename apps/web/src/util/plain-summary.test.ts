import { describe, expect, it } from 'vitest'
import { plainSummaryText } from './plain-summary'

describe('plainSummaryText', () => {
  it('removes Markdown wrappers and keeps the summary prose', () => {
    const text = plainSummaryText(
      '### **本周重点**\n- 夏令营报名\n> 提前准备材料\n[报名入口](https://example.com)'
    )
    expect(text).toBe('本周重点 夏令营报名 提前准备材料 报名入口')
  })

  it('keeps normal Chinese prose unchanged', () => {
    expect(plainSummaryText('本周有夏令营和预推免，提醒同学准备材料。')).toBe(
      '本周有夏令营和预推免，提醒同学准备材料。'
    )
  })
})

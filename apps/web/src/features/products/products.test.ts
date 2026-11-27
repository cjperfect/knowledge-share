import { describe, expect, it } from 'vitest'
import { documentText, productExcerpt, products } from './products'

describe('product data', () => {
  it('keeps the three editable fields on every seed product', () => {
    expect(products).toHaveLength(4)
    for (const product of products) {
      expect(product.name.trim()).not.toBe('')
      expect(product.thumbnail).toMatch(/^\/images\/products\/.+\.jpg$/)
      expect(product.document.length).toBeGreaterThan(0)
    }
  })

  it('uses the first paragraph as the card excerpt', () => {
    const excerpt = productExcerpt(products[0])
    expect(excerpt).toContain('结合成绩、科研、竞赛和目标院校')
    expect(excerpt).not.toContain('你会得到')
  })

  it('keeps headings and paragraphs when converting rich text to plain text', () => {
    const text = documentText(products[0].document)
    expect(text).toContain('你会得到')
    expect(text).toContain('\n')
  })
})

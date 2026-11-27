import { describe, expect, it } from 'vitest';
import { cleanSummaryDelta } from './plain-summary';

describe('cleanSummaryDelta', () => {
  it('removes common Markdown markers from summary text', () => {
    const text = cleanSummaryDelta('### **本周重点**\n- 夏令营报名\n> 提前准备材料');
    expect(text).not.toContain('#');
    expect(text).not.toContain('*');
    expect(text).not.toContain('- ');
    expect(text).not.toContain('>');
    expect(text).toContain('本周重点');
    expect(text).toContain('夏令营报名');
  });

  it('keeps normal Chinese prose unchanged', () => {
    expect(cleanSummaryDelta('本周有夏令营和预推免，提醒同学准备材料。')).toBe(
      '本周有夏令营和预推免，提醒同学准备材料。',
    );
  });
});

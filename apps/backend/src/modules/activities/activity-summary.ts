import { clampText } from '../../util/text';

export interface GenerateActivitySummaryInput {
  title: string;
  summary: string;
}

function count(value: string) {
  return Array.from(value).length;
}

function trimToMax(value: string, max: number) {
  const characters = Array.from(value);
  if (characters.length <= max) return characters.join('');
  return characters.slice(0, max - 1).join('') + '。';
}

/**
 * 未配置模型时的本地回退：只根据活动标题和已填写概要拼装 50–100 字摘要。
 * 配置 AI 后由 AiService 调用模型，业务侧只负责构建提示词。
 */
export function generateActivitySummary({ title, summary }: GenerateActivitySummaryInput) {
  const titleText = clampText(title || '本次保研分享', 22);
  const currentSummary = clampText(summary.trim().replace(/[。！？；\s]+$/, ''), 70).replace(
    /…$/,
    '',
  );

  const sentences = currentSummary
    ? [
        `${currentSummary}。`,
        `活动围绕「${titleText}」展开，适合正在准备保研的同学参加。`,
        '欢迎带着问题来交流。',
      ]
    : [
        `本次活动围绕「${titleText}」展开。`,
        '将结合真实经历，梳理准备思路、关键节点和常见误区。',
        '适合正在准备保研的同学参加，欢迎带着问题来交流。',
      ];

  let text = '';
  for (const sentence of sentences) {
    if (count(text + sentence) <= 100) text += sentence;
  }

  if (count(text) < 50) text += '欢迎带着问题来交流。';

  return trimToMax(text, 100);
}

export function buildActivitySummaryPrompt({ title, summary }: GenerateActivitySummaryInput) {
  return `请根据下面这场活动的标题和已有概要，生成一段 50–100 个中文字符的活动概要。

活动标题：${title}
已有概要：${summary || '（暂无，请仅根据标题生成）'}

要求：
1. 只使用活动标题和已有概要中的信息，不要加入分享人、日期或其他未提供的内容。
2. 如果已有概要，请保留原意，在此基础上润色并补足为 50–100 字；如果没有，请仅根据标题生成。
3. 只输出一段连续纯文本，控制在 50–100 字；不要标题、换行、列表或任何 Markdown 标记（如 #、**、-、>、反引号）。
4. 语气简洁、具体，不使用夸张营销词。`;
}

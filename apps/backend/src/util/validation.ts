import type { TransformFnParams } from 'class-transformer';

/** 所有业务日期统一使用 YYYY-MM-DD，避免本地时区参与解析。 */
export const datePattern = /^[1-9]\d{3}-\d{2}-\d{2}$/;

/** 表单文本在进入校验前统一去除首尾空白。 */
export function trimText({ obj, key }: TransformFnParams): unknown {
  const value: unknown = obj[key];
  return typeof value === 'string' ? value.trim() : value;
}

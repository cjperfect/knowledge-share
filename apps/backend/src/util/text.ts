/** 按字符截断文本，超长时补省略号；中文与 emoji 都按单个字符计算。 */
export function clampText(value: string, max: number) {
  const characters = Array.from(value.trim());
  return characters.length > max ? characters.slice(0, max).join('') + '…' : characters.join('');
}

/**
 * 全站统一响应契约：{ code, msg, data }
 * - code：业务码，成功固定 200；失败见 ErrorCode（按页面逐步补）
 * - msg：给人看的提示，成功为 success，失败为可直接展示的中文文案
 * - data：业务数据，无返回值时为 null（不允许缺字段）
 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T | null;
}

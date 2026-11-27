import type { ApiResponse } from '../interface/api-response';

const SUCCESS_CODE = 200;
const SUCCESS_MSG = 'success';

/**
 * 显式返回统一结构，替代拦截器隐式包装：
 * - 成功：`return Result.ok(data)`，或 `Result.ok(data, '已创建')`
 * - 失败：`return Result.fail(40001, 'name不能为空')`
 * 控制器签名写 `ApiResponse<T>`，Swagger 与前端都能看到真实结构。
 */
export class Result {
  static ok<T>(data: T, msg: string = SUCCESS_MSG): ApiResponse<T> {
    return {
      code: SUCCESS_CODE,
      msg,
      data: data ?? null,
    };
  }

  static fail(code: number, msg: string): ApiResponse<null> {
    return {
      code,
      msg,
      data: null,
    };
  }
}

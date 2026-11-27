import { join } from 'node:path';

/** 上传文件统一放在 apps/backend/uploads，源码与 dist 运行时都能指向同一目录。 */
export const uploadRoot = join(__dirname, '..', '..', 'uploads');

/** 对象键按 UTC 年月分层，避免服务器时区影响路径。 */
export function uploadDateFolder(date = new Date()) {
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
  };
}

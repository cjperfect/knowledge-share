import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { uploadDateFolder, uploadRoot } from '../../util/uploads';
import type { ImageSaveInput, ImageStorage, StoredImage } from './image-storage';

/** 本地磁盘存储：文件写入 apps/backend/uploads，再由 Nest 以 /uploads 静态暴露。 */
export class LocalImageStorage implements ImageStorage {
  async save(input: ImageSaveInput): Promise<StoredImage> {
    const { year, month } = uploadDateFolder();
    const filename = `${randomUUID()}.${input.extension}`;
    const key = `uploads/${year}/${month}/${filename}`;
    const directory = join(uploadRoot, year, month);

    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), input.buffer, { flag: 'wx' });

    return { url: `/${key}`, key };
  }
}

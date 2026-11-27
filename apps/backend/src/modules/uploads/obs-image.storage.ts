import { randomUUID } from 'node:crypto';
import type { ImageSaveInput, ImageStorage, StoredImage } from './image-storage';
import type { StorageConfig } from '../../config/configuration';
import { uploadDateFolder } from '../../util/uploads';

type ObsClientLike = {
  putObject(params: Record<string, unknown>): Promise<unknown>;
};

type ObsModule = {
  default?: { ObsClient: new (init: Record<string, unknown>) => ObsClientLike };
  ObsClient?: new (init: Record<string, unknown>) => ObsClientLike;
};

/**
 * 华为云 OBS 存储。
 *
 * 当前默认不走这里，后续切到 OBS 时需要：
 * 1. 安装 `esdk-obs-nodejs`；
 * 2. IMAGE_STORAGE=obs，并配置 OBS_ENDPOINT / OBS_BUCKET / AK / SK；
 * 3. bucket 允许公共读，或配置 OBS_PUBLIC_BASE_URL 指向 CDN。
 */
export class ObsImageStorage implements ImageStorage {
  private client?: ObsClientLike;

  constructor(private readonly config: StorageConfig['obs']) {}

  async save(input: ImageSaveInput): Promise<StoredImage> {
    const { year, month } = uploadDateFolder();
    const key = `uploads/${year}/${month}/${randomUUID()}.${input.extension}`;
    const client = await this.getClient();

    await client.putObject({
      Bucket: this.config.bucket,
      Key: key,
      Body: input.buffer,
      ContentType: input.mimeType,
      ACL: 'public-read',
    });

    const publicBase = (this.config.publicBaseUrl || this.defaultPublicBase()).replace(/\/$/, '');
    return { url: `${publicBase}/${key}`, key };
  }

  private defaultPublicBase() {
    const host = this.config.endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${this.config.bucket}.${host}`;
  }

  private async getClient(): Promise<ObsClientLike> {
    if (this.client) return this.client;

    const moduleName = 'esdk-obs-nodejs';
    let loaded: ObsModule;
    try {
      loaded = (await import(moduleName)) as ObsModule;
    } catch {
      throw new Error(
        'OBS 存储需要先安装 esdk-obs-nodejs：pnpm --filter @knowledge-share/backend add esdk-obs-nodejs',
      );
    }

    const ObsClient = loaded.ObsClient ?? loaded.default?.ObsClient;
    if (!ObsClient) throw new Error('OBS SDK 中没有找到 ObsClient。');

    this.client = new ObsClient({
      access_key_id: this.config.accessKeyId,
      secret_access_key: this.config.secretAccessKey,
      server: this.config.endpoint,
    });
    return this.client;
  }
}

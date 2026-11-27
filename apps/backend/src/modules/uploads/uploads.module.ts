import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import type { StorageConfig } from '../../config/configuration';
import { IMAGE_STORAGE } from './image-storage';
import { LocalImageStorage } from './local-image.storage';
import { ObsImageStorage } from './obs-image.storage';
import { UploadsController } from './uploads.controller';

function createImageStorage(config: ConfigService) {
  const storage = config.getOrThrow<StorageConfig>('storage');
  if (storage.driver === 'local') return new LocalImageStorage();

  const missing = [
    ['OBS_ENDPOINT', storage.obs.endpoint],
    ['OBS_BUCKET', storage.obs.bucket],
    ['OBS_ACCESS_KEY_ID', storage.obs.accessKeyId],
    ['OBS_SECRET_ACCESS_KEY', storage.obs.secretAccessKey],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(`OBS 存储缺少配置：${missing.map(([name]) => name).join('、')}`);
  }
  return new ObsImageStorage(storage.obs);
}

@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [
    {
      provide: IMAGE_STORAGE,
      inject: [ConfigService],
      useFactory: createImageStorage,
    },
  ],
})
export class UploadsModule {}

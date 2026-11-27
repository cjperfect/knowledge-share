import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthWriteGuard } from '../../common/guards/auth-write.guard';
import { SessionGuard } from '../../common/guards/session.guard';
import { Result } from '../../util/result';
import { IMAGE_STORAGE, type ImageStorage } from './image-storage';

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const maxImageSize = 8 * 1024 * 1024;

function hasImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }
  if (mimeType === 'image/png') {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}

@Controller('uploads')
@UseGuards(AuthWriteGuard, SessionGuard)
export class UploadsController {
  constructor(@Inject(IMAGE_STORAGE) private readonly storage: ImageStorage) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: maxImageSize, files: 1 },
    }),
  )
  async uploadImage(@UploadedFile() file: UploadedImage | undefined) {
    if (!file) throw new BadRequestException('请选择要上传的图片。');

    const extension = imageExtensions[file.mimetype];
    if (!extension) {
      throw new BadRequestException('仅支持 JPG、PNG 或 WebP 图片。');
    }
    if (!file.buffer?.length) {
      throw new BadRequestException('上传的图片为空。');
    }
    if (!hasImageSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException('文件内容不是有效的图片。');
    }

    const stored = await this.storage.save({
      buffer: file.buffer,
      mimeType: file.mimetype,
      extension,
    });

    return Result.ok({
      url: stored.url,
      path: stored.key,
      mimeType: file.mimetype,
      size: file.size,
    });
  }
}

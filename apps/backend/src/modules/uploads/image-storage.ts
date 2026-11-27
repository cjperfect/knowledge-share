export type ImageSaveInput = {
  buffer: Buffer;
  mimeType: string;
  extension: string;
};

export type StoredImage = {
  /** 可直接写入活动/产品 thumbnail 或富文本的地址。 */
  url: string;
  /** 存储层内部标识，本地为 uploads/...，OBS 为对象 Key。 */
  key: string;
};

export interface ImageStorage {
  save(input: ImageSaveInput): Promise<StoredImage>;
}

export const IMAGE_STORAGE = 'IMAGE_STORAGE';

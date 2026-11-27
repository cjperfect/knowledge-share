import { Transform } from 'class-transformer';
import { IsString, Length, Matches, MaxLength } from 'class-validator';
import { trimText } from '../../../util/validation';

export class PosterTemplateDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 50, { message: '模板名称需要 1–50 字。' })
  name!: string;

  @IsString()
  @MaxLength(1_400_000)
  @Matches(
    /^(?:$|https?:\/\/\S+|\/(?!\/)\S+|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2})$/,
    {
      message: '海报模板图片格式无效。',
    },
  )
  image!: string;
}

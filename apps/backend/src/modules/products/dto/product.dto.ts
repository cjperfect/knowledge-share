import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsOptional,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { trimText } from '../../../util/validation';

export class ProductDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 50, { message: '产品名称需要 1–50 字。' })
  name!: string;

  @IsString()
  @MaxLength(1_400_000)
  @Matches(
    /^(?:$|https?:\/\/\S+|\/(?!\/)\S+|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2})$/,
    {
      message: '产品缩略图格式无效。',
    },
  )
  thumbnail!: string;

  // Keep nested BlockNote JSON intact when implicit DTO conversion is enabled.
  @Transform(({ obj }: TransformFnParams) => obj.document as unknown)
  @Transform(({ obj, key }) => (obj as Record<string, unknown>)[key])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  document!: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  @MaxLength(200000)
  contentMarkdown?: string;
}

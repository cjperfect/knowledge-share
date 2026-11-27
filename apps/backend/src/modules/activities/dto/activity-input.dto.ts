import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { datePattern, trimText } from '../../../util/validation';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsObject,
  IsString,
  IsNumber,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const isProvided = (_object: unknown, value: unknown) => value !== undefined;

export class CreateActivityDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 50, { message: '活动标题需要 1–50 字。' })
  name!: string;

  @Transform(trimText)
  @IsString()
  @Length(1, 50, { message: '分享人需要 1–50 字。' })
  sharer!: string;

  @Matches(datePattern, { message: '活动日期格式为 YYYY-MM-DD。' })
  @IsISO8601({ strict: true }, { message: '请输入有效的活动日期。' })
  date!: string;

  @Transform(trimText)
  @IsString()
  @Length(1, 100, { message: '活动概要需要 1–100 字。' })
  summary!: string;

  @ValidateIf(isProvided)
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: '活动价格最多保留两位小数。' },
  )
  @Min(0, { message: '活动价格不能小于 0。' })
  @Max(999999.99, { message: '活动价格不能超过 999999.99 元。' })
  price?: number;

  @ValidateIf(isProvided)
  @Transform(trimText)
  @IsString()
  @MaxLength(1_400_000, { message: '活动缩略图过大。' })
  @Matches(
    /^(?:$|https?:\/\/\S+|\/(?!\/)\S+|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2})$/,
    { message: '活动缩略图格式无效。' },
  )
  thumbnail?: string;
}

export class UpdateActivityDto {
  @ValidateIf(isProvided)
  @Transform(trimText)
  @IsString()
  @Length(1, 50, { message: '活动标题需要 1–50 字。' })
  name?: string;

  @ValidateIf(isProvided)
  @Transform(trimText)
  @IsString()
  @Length(1, 50, { message: '分享人需要 1–50 字。' })
  sharer?: string;

  @ValidateIf(isProvided)
  @Matches(datePattern, { message: '活动日期格式为 YYYY-MM-DD。' })
  @IsISO8601({ strict: true }, { message: '请输入有效的活动日期。' })
  date?: string;

  @ValidateIf(isProvided)
  @Transform(trimText)
  @IsString()
  @Length(1, 100, { message: '活动概要需要 1–100 字。' })
  summary?: string;

  @ValidateIf(isProvided)
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: '活动价格最多保留两位小数。' },
  )
  @Min(0, { message: '活动价格不能小于 0。' })
  @Max(999999.99, { message: '活动价格不能超过 999999.99 元。' })
  price?: number;

  @ValidateIf(isProvided)
  @Transform(trimText)
  @IsString()
  @MaxLength(1_400_000, { message: '活动缩略图过大。' })
  @Matches(
    /^(?:$|https?:\/\/\S+|\/(?!\/)\S+|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2})$/,
    { message: '活动缩略图格式无效。' },
  )
  thumbnail?: string;

  // Keep the nested BlockNote document intact when implicit conversion is enabled.
  @ValidateIf(isProvided)
  @Transform(({ obj }: TransformFnParams) => obj.content as unknown)
  @IsArray()
  @ArrayMaxSize(500, { message: '活动内容过多。' })
  @IsObject({ each: true })
  content?: Record<string, unknown>[];

  @ValidateIf(isProvided)
  @IsString()
  @MaxLength(200000, { message: 'Markdown 内容过长。' })
  contentMarkdown?: string;
}

export class GenerateActivitySummaryDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 50)
  title!: string;

  @Transform(trimText)
  @IsString()
  @Length(0, 100)
  summary!: string;
}

export class GenerateActivityReviewDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 50)
  title!: string;

  @Transform(trimText)
  @IsString()
  @Length(1, 50)
  sharer!: string;

  @Matches(datePattern)
  @IsISO8601({ strict: true })
  date!: string;

  @Transform(trimText)
  @IsString()
  @Length(1, 5000, { message: '请先录入 1–5000 字的回顾素材。' })
  source!: string;
}

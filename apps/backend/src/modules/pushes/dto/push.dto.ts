import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { datePattern, trimText } from '../../../util/validation';
import { pushStatuses, type PushStatus } from '../entities/content-push.entity';

export class PushDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 50)
  title!: string;

  @IsString()
  @MaxLength(200)
  summary!: string;

  // Keep nested BlockNote JSON intact when implicit DTO conversion is enabled.
  @Transform(({ obj }: TransformFnParams) => obj.document as unknown)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsObject({ each: true })
  document!: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  @MaxLength(200000)
  contentMarkdown?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[1-9]\d*$/, { message: '活动 ID 格式不正确。' })
  activityId?: string;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  tags!: string[];

  @IsString()
  @MaxLength(200)
  prompt!: string;

  @IsIn(pushStatuses)
  status!: PushStatus;

  @Matches(datePattern)
  @IsISO8601({ strict: true })
  date!: string;

  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  time!: string;
}

export class PushListDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 5;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @IsOptional()
  @IsIn(pushStatuses)
  status?: PushStatus;

  @IsOptional()
  @Matches(datePattern)
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @Matches(datePattern)
  @IsISO8601({ strict: true })
  endDate?: string;
}

export class OptimizePushSummaryDto {
  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(50)
  title?: string;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  tags!: string[];

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(200)
  summary?: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(200)
  prompt?: string;
}

export class OptimizePushBodyDto {
  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(50)
  title?: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(200)
  summary?: string;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  tags!: string[];

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(8000)
  content?: string;
}

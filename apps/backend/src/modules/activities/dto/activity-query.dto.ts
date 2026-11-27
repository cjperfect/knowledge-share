import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { ActivityStatus } from '../entities/activity.entity';
import { datePattern, trimText } from '../../../util/validation';

const activityStatuses: ActivityStatus[] = ['not_started', 'ended', 'pushed'];

const maxPageSize = 50;

export class ActivityQueryDto {
  @Type(() => Number)
  @IsInt({ message: '页码必须为整数。' })
  @Min(1, { message: '页码至少为 1。' })
  @Max(Math.floor(Number.MAX_SAFE_INTEGER / maxPageSize), { message: '页码超出范围。' })
  page = 1;

  @Type(() => Number)
  @IsInt({ message: '每页条数必须为整数。' })
  @Min(1, { message: '每页至少 1 条。' })
  @Max(maxPageSize, { message: '每页最多 50 条。' })
  pageSize = 10;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(50, { message: '活动标题关键词最多 50 字。' })
  keyword?: string;

  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(50, { message: '分享人关键词最多 50 字。' })
  sharer?: string;

  @IsOptional()
  @Matches(datePattern, { message: '活动日期格式为 YYYY-MM-DD。' })
  @IsISO8601({ strict: true }, { message: '请输入有效的活动日期。' })
  date?: string;

  @IsOptional()
  @Matches(datePattern, { message: '起始日期格式为 YYYY-MM-DD。' })
  @IsISO8601({ strict: true }, { message: '请输入有效的起始日期。' })
  startDate?: string;

  @IsOptional()
  @Matches(datePattern, { message: '结束日期格式为 YYYY-MM-DD。' })
  @IsISO8601({ strict: true }, { message: '请输入有效的结束日期。' })
  endDate?: string;

  @IsOptional()
  @IsIn(activityStatuses, { message: '活动状态无效。' })
  status?: ActivityStatus;
}

export class ActivityDetailQueryDto {
  @IsOptional()
  @IsIn(activityStatuses, { message: '活动状态无效。' })
  status?: ActivityStatus;
}

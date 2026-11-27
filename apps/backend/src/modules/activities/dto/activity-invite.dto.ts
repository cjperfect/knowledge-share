import { Transform, Type } from 'class-transformer';
import {
  IsISO8601,
  IsNumber,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { datePattern, trimText } from '../../../util/validation';

export const legacyActivityInvitePattern = /^[A-Za-z0-9_-]{1,2048}$/;

export class ActivityInviteQueryDto {
  @IsString()
  @MaxLength(2048)
  @Matches(/^[A-Za-z0-9_.-]+$/, { message: '活动报名码格式无效。' })
  token!: string;
}

export class ActivityInviteSnapshotDto {
  @IsString()
  @Length(1, 128)
  id!: string;

  @IsString()
  @Length(1, 50)
  name!: string;

  @Matches(datePattern)
  @IsISO8601({ strict: true })
  date!: string;

  @IsString()
  @MaxLength(50)
  sharer!: string;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(200)
  summary?: string;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: '活动价格最多保留两位小数。' },
  )
  @Min(0)
  @Max(999999.99)
  price?: number;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(trimText)
  @IsString()
  @Length(1, 50, { message: '邀请人姓名需要 1–50 字。' })
  inviter?: string;
}

export class ActivityPosterQrDto extends ActivityInviteSnapshotDto {
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(2048)
  @Matches(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, { message: '报名凭证无效。' })
  receipt?: string;
}

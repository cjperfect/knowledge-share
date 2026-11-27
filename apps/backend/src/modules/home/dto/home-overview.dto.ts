import { IsISO8601, IsOptional, Matches } from 'class-validator';
import { datePattern } from '../../../util/validation';

export class HomeOverviewQueryDto {
  @IsOptional()
  @Matches(/^[1-9][0-9]{0,19}$/)
  activityId?: string;

  @IsOptional()
  @Matches(datePattern)
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @Matches(datePattern)
  @IsISO8601({ strict: true })
  endDate?: string;
}
